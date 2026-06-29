# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Development Project |
| Mã môn học | SWP391 |
| Lớp | SE20A04 |
| Học kỳ | SU26 |
| Tên bài tập / Project | EcoSchedule - web hỗ trợ thu gom rác theo lịch trong các khu đô thị. |
| Tên sinh viên / Nhóm | Group-04 |
| MSSV / Danh sách MSSV | - Văn Xuân Phước (DE190430)<br>- Nguyễn Văn Tuấn (DE190362)<br>- Nguyễn Đình Bảo (DE190614)<br>- Nguyễn Hữu Vũ Tuấn (DE190399)<br>- Nguyễn Thành Trung (DE190471) |
| Giảng viên hướng dẫn | Lê Thiện Nhật Quang |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | 29/06/2026 |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] GitHub Copilot
- [x] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: ....................................

---

## 3. Mục tiêu sử dụng AI

Mô tả ngắn gọn sinh viên/nhóm đã sử dụng AI để hỗ trợ những công việc nào.

- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Thiết kế database
- Thiết kế giao diện
- Viết code mẫu
- Debug lỗi
- Tối ưu code
- Viết test case
- Viết báo cáo

### Mô tả mục tiêu sử dụng AI

- Sử dụng AI để gợi ý bảng màu, layout và cấu trúc giao diện responsive (Flat design + Glassmorphism) cho EcoSchedule.
- Hỗ trợ xây dựng cấu trúc API REST và tích hợp dữ liệu với cơ sở dữ liệu Firebase.
- Hỗ trợ phát triển, nâng cấp phân quyền Admin Portal và các chức năng Admin, Manager.
- Hỗ trợ phát hiện lỗi logic bất đồng bộ, lỗi trùng lặp dữ liệu và tối ưu hóa truy vấn Database (khắc phục lỗi N+1 query).
- Hỗ trợ viết tự động các test case kiểm thử chất lượng API bằng Jest và Supertest.

---

## 4. Nhật ký sử dụng AI chi tiết

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/05/2026 |
| Công cụ AI | ChatGPT / Gemini |
| Mục đích sử dụng | Lên ý tưởng giao diện (UI/UX) và layout cho EcoSchedule |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Brand: EcoSchedule
Màu chủ đạo: Xanh lá + Trắng
Loại sản phẩm: Web app quản lý
Mục tiêu: Tra cứu lịch thu gom rác, nhận thông báo tự động, thanh toán phí vệ sinh trực tuyến
Phong cách: Flat hiện automated + điểm nhấn Glassmorphism nhẹ
```

#### 4.2. Kết quả AI gợi ý

```text
Action-first layout:
- Header: Logo EcoSchedule bên trái; Menu gọn: Tra cứu lịch / Thông báo / Thanh toán / Hỗ trợ; CTA bên phải: Tra cứu ngay.
- Hero Section: Headline "Tra cứu lịch thu gom rác nhanh, nhận nhắc lịch đúng ngày"; Subheadline; 2 CTA (Kiểm tra lịch, Thanh toán phí); Background trắng hoặc gradient xanh lá nhẹ; Minh họa dashboard/map ở bên phải.
- Content chính: Khối tra cứu nhanh theo khu vực (Dropdown chọn block/phường); Lịch thu gom sắp tới (hiển thị ngày, loại rác, khung giờ, trạng thái); Thông báo tự động; Thanh toán phí vệ sinh.
- Footer: Thông tin liên hệ, social icons.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Cấu trúc trang web, các mục chính và nội dung của từng mục.
- Màu sắc chủ đạo và cách bố trí các button CTA.
- Sử dụng các icon trực quan cho từng danh mục.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tự code giao diện responsive, thay đổi nhẹ bố cục hiển thị Grid để phù hợp với màn hình di động.
- Sửa lại các text tiếng Việt tự nhiên hơn và thêm các validation form cho Login và Register.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/182158c |
| File liên quan | `.src/frontend/src/pages/Login/Login.jsx`, `.src/frontend/src/pages/Register/Register.jsx` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Đạt yêu cầu giao diện |
| Link video demo | Không có |
| Ghi chú khác | UI ban đầu của phase 1 |

#### 4.6. Nhận xét cá nhân/nhóm

- Sử dụng prompt rõ ràng giúp AI hiểu nhanh và phản hồi chính xác yêu cầu thiết kế.
- Cần thử nhiều prompt khác nhau để so sánh các phương án UI/UX tốt nhất.

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | Antigravity / ChatGPT |
| Mục đích sử dụng | Xây dựng chức năng Admin Portal (quản lý user, phản ánh, lịch sử giao dịch và thông báo nâng cấp) |
| Phần việc liên quan | Frontend / Backend |
| Mức độ sử dụng | Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Bây giờ ngoài manager và collector thì tạo ra thêm role admin với có chức năng là quản lí người dùng. 
Chức năng quản lí người dùng(Tên hiện thị sẽ là: Quản lí): Hiển thị danh sách người dùng gồm các thông tin cơ bản như tên, mã, gmail, role và trạng thái đã xác nhận gmail hoặc không. Có chức năng thêm xóa hoặc chỉnh sửa người dùng trực tiếp trên Database. Danh sách hiển thị 10 người 1 trang, có phân trang. Có chức năng tìm kiếm user theo tên và role.
Phản ánh: Đối với admin thì không có chức năng gửi phản ánh cư dân, nhưng có chức năng tổng hợp danh sách các phản ảnh đã được gửi của user, lọc phản ánh hoặc tìm kiếm phản ánh từ Database. Gộp chức năng quản lý phản ánh và quản lý user trong 1 chức năng quản lý.
Chức năng thanh toán của Admin: lưu lịch sử giao dịch và tìm kiếm giao dịch theo role từ Database.
Chức năng thông báo của Admin: Có thể tạo thông báo cho các user và đưa thông báo lên tổng hoặc cho các role khác nhau, đẩy trực tiếp lên Database theo format các thông báo có sẵn. Nâng cấp giao diện chức năng thông báo giống quản lý người dùng, 1 trang chứa tối đa 10 thông báo có phân trang. Khi bấm vào thông báo hiện ra nội dung chi tiết. Hủy bỏ kênh gửi và thời gian tạo lấy thời gian thực trên máy, thêm chức năng chỉnh sửa và xóa thông báo.
```

#### 4.2. Kết quả AI gợi ý

- Gợi ý cấu trúc các route API và controller phía backend Node.js/Express để tương tác với cơ sở dữ liệu.
- Viết component UI ReactJS có phân trang (10 dòng/trang) sử dụng Table và hooks quản lý filter/search.
- Viết logic tính thời gian thực bằng JS để tạo thuộc tính thời gian đếm từ lúc gửi thông báo.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Code khung UI của Admin Dashboard hiển thị danh sách User và bảng Thông báo.
- Logic phân trang và controller CRUD user phía backend.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tích hợp chung Quản lý phản ánh và Quản lý người dùng vào một giao diện điều hướng duy nhất ở Sidebar.
- Bỏ nút "tạo dữ liệu mẫu" trong phần thông báo theo yêu cầu thực tế, bổ sung debounce khi search.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/6105614 |
| File liên quan | `.src/frontend/src/pages/Admin/UserManagement.jsx`, `.src/backend/server.js` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Chạy tốt, tích hợp DB Firebase thành công |
| Link video demo | Không có |
| Ghi chú khác | Hoàn thành Admin Portal |

#### 4.6. Nhận xét cá nhân/nhóm

- AI sinh code boilerplate rất nhanh và chuẩn xác.
- Cần tự tối ưu lại UI CSS và thêm debounce để tránh gửi request API liên tục khi gõ ký tự search.

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/06/2026 - 26/06/2026 |
| Công cụ AI | Antigravity / Cursor |
| Mục đích sử dụng | Viết unit test cho Auth & Schedule API; tối ưu hóa truy vấn Database sửa lỗi N+1 query |
| Phần việc liên quan | Testing / Backend / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Hãy viết các test case bằng Jest và Supertest để kiểm thử toàn diện API đăng nhập, đăng ký và phân quyền API của EcoSchedule. Đồng thời, tối ưu hóa các hàm get user và complaints của admin để khắc phục các truy vấn dư thừa N+1 khi map dữ liệu từ các collection liên kết.
```

#### 4.2. Kết quả AI gợi ý

- Mã nguồn các tệp test trong `.src/backend/tests/` sử dụng framework Jest và Supertest.
- Cách viết code tối ưu bằng `Promise.all` kết hợp batch fetch để gộp các truy vấn con của user và complaints, giảm thiểu N+1 queries.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Cấu trúc và cú pháp của tệp kiểm thử `scheduleService.test.js` và `server.test.js`.
- Thuật toán map dữ liệu và gom nhóm truy vấn Firestore.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Chỉnh sửa mock module Firebase Admin SDK cho tương thích với file `firebaseAdmin.js` thực tế của project.
- Khắc phục các cảnh báo timeout của Jest và xử lý rò rỉ bộ nhớ (memory leaks) khi kết nối DB mock.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/4150512 |
| File liên quan | `.src/backend/tests/unit/scheduleService.test.js`, `.src/backend/server.js` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Jest test pass 100% |
| Link video demo | Không có |
| Ghi chú khác | Cải thiện hiệu năng backend đáng kể |

#### 4.6. Nhận xét cá nhân/nhóm

- AI hỗ trợ sinh mã kiểm thử chất lượng cao, giúp đạt tỷ lệ bao phủ test code lớn.
- Đòi hỏi lập trình viên phải hiểu sâu về cơ chế bất đồng bộ (async/await) để sửa lỗi Jest.

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/06/2026 |
| Công cụ AI | Claude / Antigravity |
| Mục đích sử dụng | Tích hợp cổng thanh toán thực tế PayOS để thanh toán hóa đơn (Invoice) cho cư dân |
| Phần việc liên quan | Backend / Frontend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Hãy hướng dẫn cách tích hợp cổng thanh toán PayOS vào dự án Node.js/Express. Cư dân chọn hóa đơn vệ sinh môi trường chưa thanh toán (UNPAID), hệ thống sẽ gọi API PayOS để tạo link thanh toán chứa mã VietQR. Sau khi người dùng thanh toán, frontend sẽ gọi một API xác thực để backend kiểm tra trạng thái đơn hàng trực tiếp từ PayOS thông qua API GET, thay vì cài đặt webhook phức tạp.
```

#### 4.2. Kết quả AI gợi ý

- Hướng dẫn cấu hình các biến môi trường `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`.
- Cấu trúc API `POST /api/invoices/:invoiceId/payment-request` để gọi API PayOS tạo giao dịch, bao gồm cách tạo chữ ký bảo mật (checksum HMAC SHA256).
- API xác thực `POST /api/invoices/:invoiceId/verify-payment` để fetch trạng thái giao dịch từ PayOS và cập nhật `Payment.status = PAID` trong Firestore nếu trạng thái là PAID/COMPLETED.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Code khởi tạo payload, tạo chuỗi signature checksum chuẩn xác của PayOS để tạo payment link.
- Logic kiểm tra trạng thái giao dịch bằng HTTP GET request thẳng tới PayOS server để xác nhận thanh toán thành công mà không phụ thuộc vào Webhook.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tích hợp thêm nghiệp vụ xử lý lỗi mã `231` (Đơn thanh toán đã tồn tại) từ PayOS: tự động fetch lại thông tin `checkoutUrl` và `qrCode` của đơn cũ để tránh bị lỗi crash luồng thanh toán.
- Bổ sung logic ghi log chi tiết lịch sử giao dịch vào collection `payments` với mã `transactionCode` để Admin có thể đối soát.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/5816127 |
| File liên quan | `.src/frontend/src/pages/Payment.jsx`, `.src/backend/server.js` |
| Screenshot | Đã kiểm tra UI quét mã QR hoạt động đúng |
| Kết quả chạy/test | Hóa đơn cập nhật trạng thái PAID thành công sau khi nhấn xác thực |
| Link video demo | Không có |
| Ghi chú khác | Tích hợp thành công cổng thanh toán PayOS thật qua cơ chế Verify tự động |

#### 4.6. Nhận xét cá nhân/nhóm

- Claude hướng dẫn tạo chuỗi checksum HMAC SHA256 rất chuẩn xác, giúp request API không bị từ chối.
- Cơ chế verify thủ công thay vì Webhook giúp dễ dàng triển khai, test trên localhost và tránh các lỗi hụt webhook.

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/06/2026 - 18/06/2026 |
| Công cụ AI | Gemini / GitHub Copilot |
| Mục đích sử dụng | Thiết lập chức năng gán tuyến thu gom (Assign Route) cho Manager và báo cáo sự cố (Report Incident) cho Collector |
| Phần việc liên quan | Frontend / Backend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Làm thế nào để Manager phân công một tuyến đường rác (Route) cho một Collector cụ thể trong ngày, và Collector đó có thể xem tuyến đường được gán, cập nhật trạng thái thu gom và gửi báo cáo sự cố (có đính kèm ảnh bằng chứng) khi có sự cố phát sinh tại hiện trường?
```

#### 4.2. Kết quả AI gợi ý

- Cấu trúc bảng dữ liệu: Tuyến thu gom (Route) liên kết với danh sách Khu dân cư (Area), Lịch trình (Schedule) chứa thông tin `route_id`, `collector_id`, và `collection_date`.
- API endpoint `PUT /api/v1/schedules/:id/assign` để Manager gán tuyến.
- API endpoint `PUT /api/v1/schedules/:id/status` để Collector bắt đầu (IN_PROGRESS) hoặc hoàn thành (COMPLETED), và `POST /api/v1/schedules/:id/incidents` để gửi báo cáo sự cố kèm evidence.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Cấu trúc database liên kết các schema Route, Schedule và User.
- Logic truyền và lưu trữ chuỗi ảnh (base64/URL) qua API khi Collector cập nhật trạng thái thu gom.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Thêm validate middleware ở backend: Collector chỉ được phép cập nhật trạng thái của lịch trình được gán cho chính mình, ngăn chặn Collector khác thay đổi dữ liệu của đồng nghiệp.
- Thiết kế lại màn hình Manager để theo dõi các sự cố do Collector báo cáo theo thời gian thực trên bản đồ trực quan.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/2f1d871 |
| File liên quan | `.src/frontend/src/pages/Collector/AssignedReports.jsx`, `.src/backend/server.js` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Tuyến được phân công hiển thị chính xác trên màn hình Collector |
| Link video demo | Không có |
| Ghi chú khác | Cập nhật sự cố tự động đổi trạng thái lịch sang DELAYED |

#### 4.6. Nhận xét cá nhân/nhóm

- Gợi ý cấu trúc của AI giúp việc chia nhỏ các bảng và gán khóa ngoại hợp lý.
- Việc xử lý ảnh đính kèm bằng base64 hoặc URL trực tiếp giúp giảm bớt cấu hình middleware phức tạp.

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 |
| Công cụ AI | Antigravity / ChatGPT |
| Mục đích sử dụng | Sửa lỗi rò rỉ trạng thái người dùng (missing user state) trong phản ánh (Complaints) và cải thiện cơ chế hiển thị lỗi khi gọi API |
| Phần việc liên quan | Frontend / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Giao diện danh sách phản ánh (Complaints) bị crash hoặc hiển thị trống khi dữ liệu của người tạo phản ánh bị thiếu (chẳng hạn như user đã bị xóa hoặc thiếu field user_state). Hãy giúp xử lý lỗi này và cải thiện cơ chế hiển thị lỗi khi gọi API thất bại ở frontend.
```

#### 4.2. Kết quả AI gợi ý

- Sử dụng toán tử optional chaining `complaint.user?.fullName` hoặc kiểm tra `!complaint.user` để React render an toàn và không gây lỗi crash runtime.
- Thiết kế cơ chế hiển thị cảnh báo lỗi (Error Fallback / toast alert) khi cuộc gọi API bị lỗi timeout hoặc trả về status code >= 400.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Cú pháp React render với optional chaining và kiểm tra null-safety.
- Cấu trúc Component Loading Spinner và Error Alert dùng CSS thuần.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tự viết hàm kiểm tra ở backend: nếu dữ liệu người dùng bị thiếu, hệ thống tự động fallback an toàn trên giao diện thay vì báo lỗi trực tiếp đến người dùng.
- Tối ưu UI hiển thị spinner tải dữ liệu mượt mà hơn.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/7e08684 |
| File liên quan | `.src/frontend/src/pages/Complaints.jsx` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Danh sách phản ánh render bình thường, không còn lỗi crash màn hình trắng |
| Link video demo | Không có |
| Ghi chú khác | Nâng cao trải nghiệm người dùng đáng kể |

#### 4.6. Nhận xét cá nhân/nhóm

- Việc kiểm tra null/undefined khi render dữ liệu từ database NoSQL rất quan trọng.
- AI đề xuất optional chaining là giải pháp nhanh, nhưng backend vẫn cần trả về dữ liệu chuẩn để frontend không phải handle quá nhiều biệt lệ.

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/06/2026 |
| Công cụ AI | ChatGPT / GitHub Copilot |
| Mục đích sử dụng | Triển khai và sửa lỗi phân quyền (Role-Based Access Control - RBAC) và bảo mật Token JWT ở Backend |
| Phần việc liên quan | Backend / Security |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Làm sao để cấu hình middleware phân quyền trong ExpressJS sao cho mỗi router API chỉ cho phép các vai trò nhất định truy cập (ví dụ: chỉ Admin mới có quyền xem audit logs, chỉ Resident mới gửi được complaints)? Hãy viết middleware xác thực JWT và kiểm tra role từ token payload.
```

#### 4.2. Kết quả AI gợi ý

- Middleware `authenticateToken` giải mã JWT token từ header `Authorization: Bearer <token>`.
- Middleware `authorizeRoles(...allowedRoles)` nhận vào danh sách vai trò cho phép và kiểm tra `allowedRoles.includes(req.user.role)`.
- Trả về mã lỗi `401 Unauthorized` khi thiếu/hết hạn token và `403 Forbidden` khi không đủ quyền hạn.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Code middleware xác thực JWT và giải mã payload.
- Cấu trúc áp dụng middleware phân quyền trên các route của file `server.js`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tích hợp thêm nghiệp vụ kiểm tra trạng thái hoạt động của tài khoản: tự động vô hiệu hóa token của các tài khoản đã bị Admin khóa (`status = INACTIVE` hoặc `BLOCKED` trong database) ngay lập tức.
- Tách biệt code middleware thành một file module riêng để bảo trì dễ dàng hơn.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/e60000d |
| File liên quan | `.src/backend/server.js` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Route bị chặn đúng mong muốn khi truy cập bằng tài khoản không có quyền |
| Link video demo | Không có |
| Ghi chú khác | Nền tảng bảo mật cho toàn hệ thống |

#### 4.6. Nhận xét cá nhân/nhóm

- Việc quản lý phân quyền chặt chẽ từ phía Backend giúp ngăn chặn các nguy cơ tấn công thay đổi dữ liệu Client-Side.

---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 25/06/2026 |
| Công cụ AI | Antigravity / Gemini |
| Mục đích sử dụng | Khắc phục lỗi trùng lặp phương thức thanh toán (fix payment duplicate) và tối ưu hóa giao dịch của cư dân |
| Phần việc liên quan | Frontend / Backend / Debug |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Khi cư dân thực hiện thanh toán hóa đơn, đôi khi giao dịch bị trùng lặp do người dùng nhấp đúp (double click) vào nút thanh toán hoặc do backend tạo transaction song song. Hãy hướng dẫn cách sửa lỗi này.
```

#### 4.2. Kết quả AI gợi ý

- Ở phía Client: Sử dụng state `isSubmitting` để vô hiệu hóa (disabled) nút bấm thanh toán ngay sau khi click chuột.
- Ở phía Server: Sử dụng cơ chế Transaction để kiểm tra trạng thái hóa đơn là `UNPAID` tại thời điểm tạo giao dịch và chặn các request thanh toán đồng thời.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Logic tắt/bật trạng thái button thanh toán ở Frontend ReactJS.
- Validate trạng thái hóa đơn tại Backend trước khi cho phép tạo Transaction mới.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tích hợp thêm luồng tự động hủy các hóa đơn ở trạng thái PENDING sau 15 phút nếu người dùng tắt trang thanh toán giữa chừng, giúp khôi phục trạng thái hóa đơn về UNPAID để có thể thực hiện thanh toán lại.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/4e19a67 |
| File liên quan | `.src/backend/server.js`, `.src/frontend/src/pages/Payment.jsx` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Đã giải quyết triệt để lỗi trùng lặp giao dịch |
| Link video demo | Không có |
| Ghi chú khác | Tránh rò rỉ giao dịch giả lập |

#### 4.6. Nhận xét cá nhân/nhóm

- Xử lý các nghiệp vụ nhạy cảm liên quan đến thanh toán luôn đòi hỏi cơ chế khóa trạng thái (locking state) ở cả Client và Server.

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 11/05/2026 |
| Công cụ AI | ChatGPT / Gemini |
| Mục đích sử dụng | Thiết kế Database Schema ban đầu và thiết lập Firebase Firestore |
| Phần việc liên quan | Database / Backend |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Hãy thiết kế cấu trúc database NoSQL (Firebase Firestore) cho ứng dụng quản lý thu gom rác EcoSchedule. Gồm các collection: users, schedules, routes, complaints, notifications, payments. Hãy mô tả các trường thông tin và quan hệ giữa các collection.
```

#### 4.2. Kết quả AI gợi ý

- Sơ đồ cấu trúc tài liệu Firestore với các collection cơ bản và kiểu dữ liệu (String, Number, Array, Timestamp, GeoPoint).
- Hướng dẫn thiết lập Firebase Admin SDK và kết nối Node.js server thông qua file service account key.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Thiết kế cấu trúc các trường thông tin trong schema Firestore để áp dụng trực tiếp cho các collection.
- Code kết nối khởi tạo Firebase Admin SDK trong file `firebaseAdmin.js`.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Tự viết thêm logic tự động hóa việc tạo dữ liệu ban đầu (seeding) cho các test users ở file `seedTestUsers.js` để tiện cho việc phát triển và kiểm thử ở môi trường local.

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/7db949c |
| File liên quan | `.src/backend/firebaseAdmin.js`, `.src/backend/seedTestUsers.js` |
| Screenshot | Đã kết nối Firestore thành công |
| Kết quả chạy/test | Firestore kết nối tốt và seeding dữ liệu mẫu thành công |
| Link video demo | Không có |
| Ghi chú khác | Khởi đầu của backend kiến trúc dự án |

#### 4.6. Nhận xét cá nhân/nhóm

- AI hỗ trợ rất tốt trong việc phác thảo nhanh database phi quan hệ (NoSQL) vốn đòi hỏi cách tư duy phi chuẩn hóa (denormalization) khác với SQL truyền thống.

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 26/06/2026 |
| Công cụ AI | Antigravity / Cursor |
| Mục đích sử dụng | Đơn giản hóa quy trình đăng ký tài khoản cư dân (Resident) bằng cách loại bỏ việc chọn vai trò khi đăng ký và tự động gán mặc định role "resident" ở backend |
| Phần việc liên quan | Frontend / Backend / Security |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Hãy hướng dẫn sửa luồng đăng ký người dùng ở cả frontend và backend. Loại bỏ trường chọn role ở form đăng ký ở frontend để tránh việc người dùng tự chọn role admin/collector. Backend phải tự động gán cứng role là 'resident' khi tạo user mới và bỏ qua thuộc tính role từ request body gửi lên.
```

#### 4.2. Kết quả AI gợi ý

- Cách ẩn/loại bỏ thẻ Select chọn Role trong form đăng ký ở file `Register.jsx` phía frontend.
- Sửa đổi backend route `POST /api/v1/auth/register` để luôn gán cứng `role: 'resident'` khi ghi nhận tài khoản mới vào Firestore và bỏ qua bất kỳ trường role nào được gửi lên từ client.

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

- Logic tự động gán role mặc định ở backend API đăng ký.
- Cấu trúc dọn dẹp form ở React UI phía frontend.

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

- Bổ sung validate nghiêm ngặt ở backend: Trả về lỗi `400 Bad Request` nếu request body cố tình gửi kèm trường `role` không phải `resident` (nhằm chống các cuộc tấn công bypass client-side parameter injection).

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/c0dbaba |
| File liên quan | `.src/backend/server.js`, `.src/frontend/src/pages/Register/Register.jsx` |
| Screenshot | Đã kiểm tra UI hoạt động đúng |
| Kết quả chạy/test | Đăng ký thành công và tự động gán phân quyền Resident an toàn |
| Link video demo | Không có |
| Ghi chú khác | Giúp hệ thống an toàn và bảo mật hơn |

#### 4.6. Nhận xét cá nhân/nhóm

- Việc kiểm soát chặt chẽ dữ liệu đầu vào (input validation) từ client gửi lên backend là vô cùng quan trọng đối với các hệ thống phân quyền phức tạp.

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu | | ✔ | | | |
| Viết user story/use case | | ✔ | | | |
| Thiết kế database | | | ✔ | | |
| Thiết kế kiến trúc hệ thống | | ✔ | | | |
| Thiết kế giao diện | | | ✔ | | |
| Code frontend | | | ✔ | | |
| Code backend | | | ✔ | | |
| Debug lỗi | | | | ✔ | |
| Viết test case | | | | ✔ | |
| Kiểm thử sản phẩm | | | ✔ | | |
| Tối ưu code | | | ✔ | | |
| Viết báo cáo | | ✔ | | | |
| Làm slide thuyết trình | ✔ | | | | |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI sinh code gợi ý dùng SQLite/MySQL query truyền thống trong khi DB dùng Firebase Firestore | Khi chạy server bị lỗi cú pháp SQL và lỗi không nhận diện thư viện kết nối | Đổi các truy vấn sang Firebase Firestore Admin SDK. |
| 2 | Code gán token authentication bị thiếu middleware xác thực JWT hoặc logic secret key không khớp giữa backend và test config | Chạy unit test API login và access route bị fail code 401/403 | Đồng nhất JWT_SECRET và cấu hình lại middleware JWT trong file server.js. |
| 3 | AI không tạo cơ chế debounce khi tìm kiếm danh sách user, dẫn đến spam API liên tục khi gõ phím | F12 Inspect Tab Network thấy hàng chục request API được gửi liên tục theo mỗi ký tự gõ vào | Tự thêm hàm custom debounce (trì hoãn 500ms) trước khi thực hiện request API search. |

---

## 7. Kiểm chứng kết quả AI

Mô tả cách sinh viên/nhóm kiểm tra lại kết quả do AI gợi ý.

- **Chạy thử chương trình (Manual test):** Cả nhóm phối hợp đăng nhập các account thử nghiệm (Resident, Collector, Manager, Admin) chạy thử các flow cơ bản như tạo lịch rác, gửi phản ánh, thanh toán mock, gửi thông báo và quản lý user.
- **Chạy tự động (Automated test):** Viết và chạy unit test qua Jest để test logic API.
- **Postman API Testing:** Import file Postman collection để test thủ công từng REST endpoint ở backend.
- **Đối chiếu tài liệu SRS:** So sánh kết quả thực hiện UI và API với tài liệu SRS để đảm bảo tính đúng đắn và đầy đủ.

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
N/A (Đây là bài tập nhóm)
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Văn Xuân Phước | DE190430 | Setup Firebase, viết tài liệu SRS, ERD, leader điều phối | Có | Commit 1ed21a4 |
| Nguyễn Văn Tuấn | DE190362 | Code auth, UI login/register, dashboard cư dân, gửi phản ánh | Có | Commit a2e8927, 31dc68e |
| Nguyễn Đình Bảo | DE190614 | Code Admin Portal UI & API, quản lý thông báo, tối ưu N+1 query | Có | Commit f6abe1e, 6105614 |
| Nguyễn Hữu Vũ Tuấn | DE190399 | Code Manager Portal (phân tuyến, lịch trình), mock payment | Có | Commit 0be4bad, 0909358 |
| Nguyễn Thành Trung | DE190471 | Phân tích yêu cầu, viết user stories, use case specs | Có | Commit 02aded8, ba82c98 |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
AI hỗ trợ tạo khung code (boilerplate), thiết kế cấu trúc UI React, sinh code mẫu cho API Node.js/Express nhanh chóng và hỗ trợ viết unit test độ phủ cao.
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Phần code cấu trúc truy vấn DB dạng SQL thuần. Vì hệ thống sử dụng cơ sở dữ liệu Firebase Firestore phi quan hệ (NoSQL) nên nhóm phải tự viết lại các hàm truy vấn theo Firebase SDK.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Nhóm kiểm tra thông qua việc chạy thử trực tiếp trên giao diện (manual test), sử dụng Jest test cases cho API backend, và kiểm tra log trong Firebase Console.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Viết code unit test cho toàn bộ API và tối ưu hóa các truy vấn bất đồng bộ phức tạp (sửa lỗi N+1 query) sẽ mất nhiều thời gian tìm hiểu và triển khai nhất.
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Nhóm hiểu rõ hơn quy trình thiết kế phần mềm theo chuẩn IEEE 830, cách xây dựng một kiến trúc Client-Server RESTful, phân quyền vai trò (RBAC) chặt chẽ và tầm quan trọng của việc viết test case.
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Sử dụng AI như một người trợ lý để gợi ý giải pháp và viết code mẫu, thay vì sao chép mù quáng. Cần luôn tự kiểm chứng lại logic, bảo mật và tính tương thích của mã nguồn trước khi tích hợp vào project.
```

---

## 10. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Văn Xuân Phước | 29/06/2026 |
