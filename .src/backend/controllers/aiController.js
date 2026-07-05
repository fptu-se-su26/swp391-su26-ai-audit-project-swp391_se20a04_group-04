const { db } = require('../config/firebase');
const https = require('https');
const invoiceService = require('../services/invoiceService');
const complaintService = require('../services/complaintService');

// ─── OpenRouter Configuration ─────────────────────────────────────────────────
const OPENROUTER_HOST = 'openrouter.ai';
const OPENROUTER_PATH = '/api/v1/chat/completions';

// Models — you can change these to any model on OpenRouter (400+ available)
// Browse models at: https://openrouter.ai/models
const RESIDENT_MODEL = 'google/gemini-2.5-flash'; // Standard, extremely fast, cheap, and reliable
const MANAGER_MODEL = 'anthropic/claude-sonnet-5';  // The absolute best for reasoning and perfect JSON output

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

function httpsPost(host, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      { hostname: host, path, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── OpenRouter API Call ──────────────────────────────────────────────────────

/**
 * Call OpenRouter API with specified API key and model.
 * Uses the OpenAI-compatible chat completions format.
 * @param {string} prompt - The user prompt text
 * @param {'resident'|'manager'} type - Which API key and model to use
 * @returns {string} The AI response text
 */
async function callOpenRouter(messagesPayload, type = 'resident') {
  // Select the correct API key and model based on the type
  const apiKey = type === 'manager'
    ? process.env.OPENROUTER_MANAGER_API_KEY
    : process.env.OPENROUTER_RESIDENT_API_KEY;

  const model = type === 'manager' ? MANAGER_MODEL : RESIDENT_MODEL;

  if (!apiKey) {
    throw new Error(`OPENROUTER_${type.toUpperCase()}_API_KEY chưa được cấu hình trong .env`);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'http://localhost:5001',
    'X-Title': 'EcoSchedule',
  };

  const finalMessages = typeof messagesPayload === 'string'
    ? [{ role: 'user', content: messagesPayload }]
    : messagesPayload;

  const requestBody = {
    model,
    messages: finalMessages,
    temperature: type === 'manager' ? 0.3 : 0.4, // Lower temp for manager JSON output
    max_tokens: 1024,
  };

  console.log(`[OpenRouter] Calling model: ${model} (type: ${type})`);

  const { status, body } = await httpsPost(OPENROUTER_HOST, OPENROUTER_PATH, headers, requestBody);

  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = {}; }

  if (status !== 200) {
    const msg = parsed?.error?.message || `OpenRouter API lỗi ${status}`;
    console.error('[OpenRouter] Error:', status, msg);
    throw new Error(msg);
  }

  // OpenRouter returns data in the standard OpenAI format
  const reply = parsed?.choices?.[0]?.message?.content || '';
  console.log(`[OpenRouter] Response received (${reply.length} chars)`);
  return reply;
}

// ─── Resident Chat ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Body: { message, city?, ward?, neighborhood? }
 */
async function residentChat(req, res) {
  const { message, messages, city, ward, neighborhood } = req.body;
  const currentMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : '');

  if (!currentMessage || !currentMessage.trim()) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
  }

  try {
    // 1. Trích xuất Tỉnh và Phường bằng AI (Fast Extractor)
    let searchCity = city || '';
    let searchWard = ward || '';

    try {
      const extractPrompt = `Bạn là hệ thống trích xuất địa danh.
Nhiệm vụ: Đọc tin nhắn sau và trích xuất Tỉnh/Thành phố (city) và Tên Phường/Xã/Quận (ward) mà người dùng nhắc tới.
- KHÔNG kèm theo chữ "Phường", "Xã", "Quận", "Thành phố", "Tỉnh" (Ví dụ: "Phường Thọ Quang" -> "Thọ Quang", "Thành phố Hà Nội" -> "Hà Nội").
- Nếu người dùng KHÔNG nhắc đến địa danh nào, trả về chuỗi rỗng "".

Tin nhắn của người dùng: "${currentMessage}"

BẮT BUỘC trả về định dạng JSON (không có markdown):
{
  "city": "<city_name>",
  "ward": "<ward_name>"
}`;
      const extractPayload = [{ role: 'user', content: extractPrompt }];
      const rawResponse = await callOpenRouter(extractPayload, 'resident');
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.city && extracted.city.trim() !== '') searchCity = extracted.city.trim();
        if (extracted.ward && extracted.ward.trim() !== '') searchWard = extracted.ward.trim();
      }
    } catch (err) {
      console.log('[AI Extract Location] Error:', err.message);
    }

    // 2. Fetch and Fuzzy Filter Schedules
    let scheduleContext = 'Hãy yêu cầu người dùng cung cấp Phường/Xã để tra cứu lịch.';

    if (searchWard || searchCity) {
      // Clean up search strings
      const targetCity = searchCity.toLowerCase().replace(/thành phố|tỉnh/g, '').trim();
      const targetWard = searchWard.toLowerCase().replace(/phường|xã|quận|\(.*\)/g, '').trim();

      // Fetch recent schedules (limit to prevent overloading memory, suitable for generic search)
      let query = db.collection('collection_schedules').limit(150);
      const snap = await query.get();

      if (!snap.empty) {
        // Javascript Fuzzy Match cho cả City và Ward
        const filteredDocs = snap.docs.filter((d) => {
          const s = d.data();
          let matchCity = true;
          let matchWard = true;

          if (targetCity) {
            const sCityClean = (s.city || '').toLowerCase().replace(/thành phố|tỉnh/g, '').trim();
            matchCity = sCityClean.includes(targetCity) || targetCity.includes(sCityClean);
          }
          if (targetWard) {
            const sWardClean = (s.ward || '').toLowerCase().replace(/phường|xã|quận|\(.*\)/g, '').trim();
            matchWard = sWardClean.includes(targetWard) || targetWard.includes(sWardClean);
          }

          return matchCity && matchWard;
        });

        if (filteredDocs.length > 0) {
          const items = filteredDocs.map((d) => {
            const s = d.data();
            return `- Khu vực: ${s.city || ''}, ${s.ward || ''} | Ngày: ${s.schedule_date || s.date || 'N/A'} | Giờ: ${s.time || 'N/A'} | Tuyến: ${s.routeName || 'N/A'}`;
          });
          scheduleContext = items.join('\n');
        } else {
          scheduleContext = `Không tìm thấy lịch thu gom nào cho khu vực: ${searchCity} ${searchWard}.`;
        }
      } else {
        scheduleContext = `Hệ thống hiện tại chưa có bất kỳ dữ liệu lịch trình nào.`;
      }
    }

    // 2. Fetch User Dynamic Context (Invoices & Complaints)
    let invoiceContext = 'Khách vãng lai hoặc chưa có dữ liệu hóa đơn.';
    let complaintContext = 'Chưa có phản ánh nào.';

    if (req.uid) {
      try {
        const latestInvoice = await invoiceService.getLatestInvoiceForUser(req.uid);
        if (latestInvoice) {
          invoiceContext = `Hóa đơn gần nhất: Tháng ${latestInvoice.billingMonth}/${latestInvoice.billingYear}, Số tiền: ${latestInvoice.amount.toLocaleString('vi-VN')}đ, Trạng thái: ${latestInvoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`;
        } else {
          invoiceContext = 'Không có nợ cước nào.';
        }

        const userComplaints = await complaintService.getUserComplaints(req.uid);
        if (userComplaints && userComplaints.length > 0) {
          const recent = userComplaints.slice(0, 3);
          complaintContext = recent.map(c => `- Tiêu đề: "${c.title}" | Trạng thái: ${c.status === 'Open' ? 'Đang chờ xử lý' : c.status === 'in_resolve' ? 'Đang giải quyết' : c.status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng'}`).join('\n');
        }
      } catch (err) {
        console.error('[AI Chat] Lỗi fetch dynamic context:', err.message);
      }
    }

    // 3. Build System Prompt
    const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
    const systemPrompt = `Bạn là trợ lý AI chính thức của EcoSchedule — Hệ thống quản lý lịch thu gom rác thông minh tại Việt Nam.
Hôm nay là: ${currentDate}.

[KIẾN THỨC VỀ HỆ THỐNG ECOSCHEDULE CHO CƯ DÂN]
Hệ thống có các tính năng sau, hãy hướng dẫn cư dân bấm vào các mục tương ứng trên thanh menu (menu bar) ở đầu trang khi họ cần:
1. Tra cứu lịch thu gom rác: Xem ngày, giờ, tuyến đường xe rác chạy. -> Hướng dẫn người dùng bấm vào mục "Tra cứu lịch".
2. Gửi phản ánh (Khiếu nại): Báo cáo rác chưa gom, gom sót, sai giờ, thái độ nhân viên. -> Hướng dẫn người dùng bấm vào mục "Gửi phản ánh".
3. Thanh toán: Xem hóa đơn và đóng tiền rác trực tuyến. -> Hướng dẫn người dùng bấm vào mục "Thanh toán".
4. Hướng dẫn: Xem hướng dẫn phân loại rác, cách sử dụng dịch vụ. -> Hướng dẫn người dùng bấm vào mục "Hướng dẫn phân loại".
5. Thông báo: Xem các thông báo từ ban quản lý (đổi giờ do mưa bão, lễ tết). -> Hướng dẫn người dùng bấm vào mục "Thông báo".

[QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG)]
- SO SÁNH NGÀY THÁNG: Luôn để ý ngày hôm nay là ${currentDate}. NẾU DỮ LIỆU ĐỊA PHƯƠNG chỉ có lịch của ngày trong QUÁ KHỨ, hãy báo cho người dùng biết rằng: "Lịch thu gom gần nhất là vào ngày [X] và hiện tại ban quản lý chưa cập nhật lịch mới cho các ngày tiếp theo".
- NẾU DỮ LIỆU ĐỊA PHƯƠNG có chứa lịch trình ở hiện tại/tương lai: Hãy ưu tiên đọc và thông báo trực tiếp lịch trình đó cho người dùng. SAU ĐÓ mới gợi ý thêm: "Để xem chi tiết hơn, bạn vui lòng bấm vào mục 'Tra cứu lịch'".
- NẾU KHÔNG CÓ DỮ LIỆU (hoặc người dùng hỏi chung chung về lịch): Hãy lịch sự hỏi họ đang ở Tỉnh/Thành, Phường/Xã nào để bạn tra cứu giúp, HOẶC khuyên họ tự bấm vào nút "Tra cứu lịch".
- NẾU NGƯỜI DÙNG HỎI VỀ TIỀN RÁC HOẶC PHẢN ÁNH: Dựa vào [DỮ LIỆU CÁ NHÂN CỦA NGƯỜI DÙNG] bên dưới để trả lời ngay lập tức tình trạng của họ.
- NGUYÊN TẮC CHỐNG BỊA ĐẶT: Nếu người dùng hỏi thông tin bạn không biết, hãy nói: "Xin lỗi, hiện tại tôi chưa có thông tin về vấn đề này. Bạn có thể bấm vào mục 'Gửi phản ánh' để ban quản lý hỗ trợ nhé".
- TUYỆT ĐỐI KHÔNG tự bịa ra tính năng hoặc tự tạo ra dữ liệu giả.

[DỮ LIỆU ĐỊA PHƯƠNG]
Khu vực mặc định của người dùng: ${searchCity} ${ward ? `, ${ward}` : ''}
Lịch thu gom (AI tự động tìm khu vực khớp với câu hỏi của người dùng trong danh sách này): 
${scheduleContext}

[DỮ LIỆU CÁ NHÂN CỦA NGƯỜI DÙNG]
Thông tin hóa đơn: ${invoiceContext}
Thông tin phản ánh gần đây:
${complaintContext}

Hãy trả lời ngắn gọn, thông minh, thân thiện và lịch sự bằng tiếng Việt.`;

    // 4. Prepare chat payload with history
    const chatPayload = [
      { role: 'system', content: systemPrompt }
    ];

    if (messages && Array.isArray(messages)) {
      chatPayload.push(...messages);
    } else {
      chatPayload.push({ role: 'user', content: currentMessage });
    }

    const reply = await callOpenRouter(chatPayload, 'resident');
    return res.json({ reply });
  } catch (error) {
    console.error('[AI Chat] Lỗi:', error.message);
    return res.status(500).json({ error: error.message || 'Không thể kết nối AI. Vui lòng thử lại sau.' });
  }
}

// ─── Manager Complaint Summary ────────────────────────────────────────────────

/**
 * GET /api/ai/complaints/summary
 */
async function complaintSummary(req, res) {
  try {
    const snap = await db.collection('complaints').limit(100).get();
    if (snap.empty) {
      return res.json({ summary: [], generatedAt: new Date().toISOString() });
    }

    const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Build a compact text list for the AI
    const complaintList = complaints
      .map(
        (c, i) =>
          `[${i + 1}] Loại: ${c.type || 'N/A'} | Tiêu đề: ${c.title} | Mô tả: ${c.description} | Trạng thái: ${c.status} | Ngày: ${c.created_at?.slice(0, 10)}`
      )
      .join('\n');

    const prompt = `Bạn là AI phân tích dữ liệu cho hệ thống EcoSchedule.
Dưới đây là danh sách ${complaints.length} phản ánh từ cư dân:

${complaintList}

Hãy phân tích và trả về kết quả dưới dạng JSON hợp lệ (không có markdown, không có backtick), đúng cấu trúc sau:
[
  {
    "priority": 1,
    "type": "<loại phổ biến nhất>",
    "count": <số lượng phản ánh cùng loại>,
    "resolvedCount": <số đã giải quyết (status Resolved/Closed)>,
    "summary": "<tóm tắt ngắn gọn vấn đề chính>",
    "recommendation": "<gợi ý hành động cho quản lý>"
  },
  ...
]
Sắp xếp theo priority từ cao (1) đến thấp. Chỉ trả về JSON, không có văn bản nào khác.`;

    const raw = await callOpenRouter(prompt, 'manager');

    // Parse JSON safely
    let groups = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      groups = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      groups = [{ priority: 1, type: 'Tổng hợp', count: complaints.length, resolvedCount: complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length, summary: raw, recommendation: '' }];
    }

    return res.json({ summary: groups, totalComplaints: complaints.length, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[AI Summary] Lỗi:', error.message);
    return res.status(500).json({ error: error.message || 'Không thể tạo phân tích AI. Vui lòng thử lại sau.' });
  }
}

module.exports = { residentChat, complaintSummary };
