const { db } = require('../config/firebase');
const https = require('https');

const GEMINI_HOST = 'generativelanguage.googleapis.com';
const GEMINI_MODEL = 'gemini-2.0-flash';

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

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình.');

  // AQ. = new Google AI Studio key format → x-goog-api-key header
  // AIzaSy = legacy format → ?key= query param
  const isNewFormat = apiKey.startsWith('AQ.');
  const path = `/v1beta/models/${GEMINI_MODEL}:generateContent${isNewFormat ? '' : `?key=${apiKey}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(isNewFormat ? { 'x-goog-api-key': apiKey } : {}),
  };

  const { status, body } = await httpsPost(GEMINI_HOST, path, headers, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
  });

  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = {}; }

  if (status !== 200) {
    const msg = parsed?.error?.message || `Gemini API lỗi ${status}`;
    console.error('[Gemini] Error:', status, msg);
    throw new Error(msg);
  }

  return parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Resident Chat ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Body: { message, city?, ward?, neighborhood? }
 */
async function residentChat(req, res) {
  const { message, city, ward, neighborhood } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Tin nhắn không được để trống.' });
  }

  try {
    // Fetch relevant schedules for context
    let scheduleContext = 'Không có thông tin lịch thu gom.';
    if (city && ward) {
      let query = db.collection('collection_schedules')
        .where('city', '==', city)
        .where('ward', '==', ward);
      if (neighborhood) query = query.where('neighborhood', '==', neighborhood);

      const snap = await query.limit(10).get();
      if (!snap.empty) {
        const items = snap.docs.map((d) => {
          const s = d.data();
          return `- Tuyến: ${s.routeName || 'N/A'}, Ngày: ${s.schedule_date || s.date || 'N/A'}, Giờ: ${s.time || 'N/A'}, Trạng thái: ${s.status || 'N/A'}, Dịch vụ: ${s.serviceType || 'N/A'}`;
        });
        scheduleContext = items.join('\n');
      }
    }

    const prompt = `Bạn là trợ lý AI của ứng dụng EcoSchedule — hệ thống quản lý lịch thu gom rác tại Việt Nam.
Nhiệm vụ của bạn:
1. Trả lời câu hỏi của cư dân liên quan đến lịch thu gom, loại rác, giờ thu gom.
2. Nếu cư dân phàn nàn về dịch vụ (thu gom trễ, bỏ sót, xe rác hỏng...), hãy gợi ý họ tạo phản ánh qua trang /phan-anh.
3. Trả lời ngắn gọn, thân thiện, bằng tiếng Việt.

Thông tin lịch thu gom tại khu vực ${city || ''}${ward ? `, ${ward}` : ''}${neighborhood ? `, ${neighborhood}` : ''}:
${scheduleContext}

Câu hỏi của cư dân: ${message.trim()}

Hãy trả lời:`;

    const reply = await callGemini(prompt);
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

    // Build a compact text list for Gemini
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

    const raw = await callGemini(prompt);

    // Parse JSON safely
    let groups = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      groups = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      groups = [{ priority: 1, type: 'Tổng hợp', count: complaints.length, resolvedCount: complaints.filter(c => ['Resolved','Closed'].includes(c.status)).length, summary: raw, recommendation: '' }];
    }

    return res.json({ summary: groups, totalComplaints: complaints.length, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[AI Summary] Lỗi:', error.message);
    return res.status(500).json({ error: error.message || 'Không thể tạo phân tích AI. Vui lòng thử lại sau.' });
  }
}

module.exports = { residentChat, complaintSummary };
