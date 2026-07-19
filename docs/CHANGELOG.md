# Changelog

## 1. Quy định ghi Changelog

File này dùng để ghi lại các thay đổi quan trọng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Nguyên tắc ghi changelog:

- Chỉ ghi những gì đã hoàn thành thật sự.
- Không ghi kế hoạch nếu chưa thực hiện.
- Mỗi thay đổi nên có ngày, nội dung, người thực hiện và minh chứng.
- Nếu có AI hỗ trợ, cần ghi rõ AI đã hỗ trợ phần nào.
- Nếu có commit GitHub, cần ghi link commit.
- Nếu có lỗi đã sửa, cần ghi rõ lỗi, nguyên nhân và cách xử lý.

---

## 2. Thông tin project

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
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04 |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | 29/06/2026 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 11/05/2026 - 15/05/2026 | Khởi tạo project và thiết lập môi trường | Completed |
| Phase 02 | 16/05/2026 - 22/05/2026 | Phân tích yêu cầu dự án | Completed |
| Phase 03 | 23/05/2026 - 31/05/2026 | Thiết kế cơ sở dữ liệu, ERD và SRS | Completed |
| Phase 04 | 01/06/2026 - 20/06/2026 | Phát triển các phân hệ frontend & backend (Implementation) | Completed |
| Phase 05 | 21/06/2026 - 26/06/2026 | Viết kịch bản kiểm thử E2E Playwright, Unit Tests và Fix bugs | Completed |
| Phase 06 | 27/06/2026 - 29/06/2026 | Hoàn thiện báo cáo, Project Tracking và bàn giao | Completed |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
11/05/2026 - 15/05/2026
```

## Đã hoàn thành

- [x] Tạo repository
- [x] Tạo cấu trúc thư mục project
- [x] Tạo file README.md
- [x] Tạo thư mục `docs/`
- [x] Tạo file `AI_AUDIT_LOG.md`
- [x] Tạo file `PROMPTS.md`
- [x] Tạo file `REFLECTION.md`
- [x] Tạo file `CHANGELOG.md`
- [x] Khởi tạo source code ban đầu
- [x] Cài đặt thư viện/công cụ cần thiết
- [x] Cấu hình môi trường chạy project

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Khởi tạo repo GitHub và cấu trúc thư mục frontend/backend | Văn Xuân Phước | Root | Commit 7db949c |
| 2 | Cấu hình cài đặt Firebase Firestore Admin SDK | Văn Xuân Phước | .src/backend/firebaseAdmin.js | Commit 7db949c |
| 3 | Tạo dữ liệu seed ban đầu cho các tài khoản test local | Văn Xuân Phước | .src/backend/seedTestUsers.js | Commit 7db949c |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ cấu hình khởi tạo Firebase Admin SDK và gợi ý cấu trúc thư mục Node.js/Express để phân tách các files logic rõ ràng.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/7db949c
```

## Ghi chú

```text
Firebase được chọn làm cơ sở dữ liệu chính của toàn bộ dự án dưới dạng Firestore NoSQL để dễ dàng scale và xử lý real-time.
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
16/05/2026 - 22/05/2026
```

## Đã hoàn thành

- [x] Xác định problem statement
- [x] Xác định user roles
- [x] Viết user stories
- [x] Viết use cases
- [x] Xác định functional requirements
- [x] Xác định non-functional requirements
- [x] Xác định business rules
- [x] Xác định acceptance criteria
- [x] Review yêu cầu với giảng viên/nhóm
- [x] Chỉnh sửa yêu cầu sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết tài liệu phân tích bài toán, problem statement và actor roles | Nguyễn Thành Trung | docs/REQUIREMENT_ANALYSIS.md | Commit 02aded8 |
| 2 | Phác thảo User Stories chi tiết theo định dạng chuẩn | Nguyễn Thành Trung | docs/USER_STORIES.md | Commit ba82c98 |
| 3 | Chi tiết hóa tài liệu đặc tả Use Case (Resident, Collector, Manager, Admin) | Nguyễn Thành Trung | docs/USE_CASE_SPECIFICATION.md | Commit ba82c98 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ định dạng viết User Stories và phân biệt hành vi của 4 vai trò Resident, Collector, Manager, Admin trong các Use Case.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/02aded8
```

## Ghi chú

```text
Phạm vi hệ thống được xác định rõ ràng để tránh bùng nổ phạm vi (scope creep) ở các pha sau.
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
23/05/2026 - 31/05/2026
```

## Đã hoàn thành

- [x] Thiết kế kiến trúc tổng quan
- [x] Thiết kế database/ERD
- [x] Thiết kế API
- [x] Thiết kế giao diện/wireframe
- [x] Thiết kế flow xử lý
- [x] Thiết kế class diagram
- [x] Thiết kế sequence diagram
- [x] Thiết kế security/authorization flow
- [x] Review thiết kế
- [x] Chỉnh sửa thiết kế sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế cấu trúc các collections Firestore và viết Database Design | Văn Xuân Phước | docs/DATABASE_DESIGN.md | Commit 1ed21a4 |
| 2 | Phác thảo sơ đồ ERD dữ liệu quan hệ logic | Văn Xuân Phước | docs/erd.md | Commit 1ed21a4 |
| 3 | Biên soạn tài liệu đặc tả yêu cầu phần mềm theo IEEE 830 | Văn Xuân Phước | docs/SRS_EcoSchedule_IEEE830_Version1.md | Commit 1ed21a4 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ viết cấu trúc tài liệu đặc tả SRS chuẩn IEEE 830, đặc tả chi tiết các phi chức năng và business logic phân bổ rác.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/1ed21a4
```

## Ghi chú

```text
Sử dụng Firestore phi quan hệ (NoSQL) đòi hỏi cách denormalization cấu trúc dữ liệu khác với SQL thông thường để tối ưu hóa việc đọc lịch thu gom.
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
01/06/2026 - 20/06/2026
```

## Đã hoàn thành

- [x] Tạo project structure
- [x] Cài đặt database connection
- [x] Xây dựng backend
- [x] Xây dựng frontend
- [x] Xây dựng authentication/authorization
- [x] Xử lý CRUD
- [x] Xử lý validation
- [x] Tích hợp API
- [x] Xử lý upload/download file
- [x] Xử lý lỗi
- [x] Tối ưu giao diện
- [x] Cập nhật README hướng dẫn chạy

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Tạo form đăng nhập, đăng ký và Dashboard Cư dân | Nguyễn Văn Tuấn | .src/frontend/src/pages/Login/ | Commit a2e8927, 31dc68e |
| 2 | Triển khai giao diện lập lịch và phân tuyến của Manager | Nguyễn Hữu Vũ Tuấn | .src/frontend/src/pages/Dashboard/ | Commit 0be4bad |
| 3 | Xây dựng logic phân vai trò (RBAC) và xác thực JWT token ở backend | Nguyễn Đình Bảo | .src/backend/server.js | Commit e60000d |
| 4 | Tích hợp cổng thanh toán trực tuyến PayOS VietQR | Nguyễn Hữu Vũ Tuấn | .src/frontend/src/pages/Payment.jsx | Commit 5816127 |
| 5 | Phát triển các trang quản trị của Admin Portal (User, Notify, Payments) | Nguyễn Đình Bảo | .src/admin-frontend/ | Commit 6105614 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ viết các REST API endpoints ở backend, tạo logic checksum HMAC SHA256 cho cổng thanh toán PayOS và sinh khung UI ReactJS có phân trang.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/6105614
```

## Ghi chú

```text
PayOS được tích hợp thật qua API Client-side check, giúp Resident có trải nghiệm thanh toán quét mã VietQR chân thực nhất mà không cần webhook.
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
21/06/2026 - 26/06/2026
```

## Đã hoàn thành

- [x] Viết test case
- [x] Chạy test chức năng chính
- [x] Kiểm tra output
- [x] Kiểm tra validation
- [x] Kiểm tra lỗi giao diện
- [x] Kiểm tra lỗi database
- [x] Kiểm tra phân quyền
- [x] Kiểm tra bảo mật cơ bản
- [x] Fix bug
- [x] Chạy lại sau khi fix bug
- [x] Ghi nhận kết quả test

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | Lỗi rò rỉ N+1 query Firestore khi Admin load user | Query map dữ liệu tuần tự làm quá tải API | Chuyển sang Promise.all và batch fetch data | Fixed |
| 2 | Trùng lặp payment do người dùng click đúp | Gửi 2 request thanh toán song song tạo 2 order | Sử dụng state isSubmitting tắt button ở UI và lock ở DB | Fixed |
| 3 | Giao diện complaints bị crash khi user tạo bị xóa | Field creator profile bị undefined ở frontend | Thêm optional chaining và default fallback rendering | Fixed |
| 4 | Resident bypass đăng ký role collector/admin | Form đăng ký ở frontend cho phép chọn role | Ẩn menu chọn role ở frontend, backend tự động gán resident | Fixed |
| 5 | Chạy unit test API bị lỗi timeout | Kết nối DB thật gây trễ khi chạy test cases Jest | Cấu hình mock module Firebase Admin SDK cho Jest | Fixed |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết bộ kiểm thử E2E tự động Playwright | Nguyễn Đình Bảo | e2e-tests/tests/ | Commit 4150512 |
| 2 | Thiết lập mock data cho Jest unit test API backend | Nguyễn Đình Bảo | .src/backend/tests/ | Commit 4150512 |
| 3 | Khắc phục các lỗi bảo mật Token và double-click | Nguyễn Đình Bảo | .src/backend/server.js | Commit 4e19a67 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ viết các test cases tự động bằng Jest, Supertest và Playwright, đồng thời gợi ý giải pháp tối ưu Promise.all để sửa lỗi truy vấn Firestore N+1.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/4e19a67
```

## Ghi chú

```text
Chạy thành công 9/9 E2E test cases Playwright đạt tỷ lệ pass 100%.
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
27/06/2026 - 29/06/2026
```

## Đã hoàn thành

- [x] Hoàn thiện source code
- [x] Hoàn thiện README.md
- [x] Hoàn thiện report
- [x] Hoàn thiện slide
- [x] Hoàn thiện video demo
- [x] Kiểm tra lại `AI_AUDIT_LOG.md`
- [x] Kiểm tra lại `PROMPTS.md`
- [x] Hoàn thiện `REFLECTION.md`
- [x] Kiểm tra lại `CHANGELOG.md`
- [x] Đóng gói bài nộp

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Hoàn thiện đầy đủ nội dung tài liệu REFLECTION.md | Nhóm 4 | docs/REFLECTION.md | Commit e60000d |
| 2 | Hoàn tất điền dữ liệu theo dõi tiến độ PROJECT_TRACKING.md | Nhóm 4 | docs/PROJECT_TRACKING.md | Commit e60000d |
| 3 | Hoàn thiện Changelog.md ghi nhận các pha thực hiện | Nhóm 4 | docs/CHANGELOG.md | Commit e60000d |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ tổng hợp thông tin tiến độ của 4 Iteration để tạo file Project Tracking rõ ràng và đối soát đúng với SRS.
```

## Commit/Screenshot minh chứng

```text
Link commit: https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a04_group-04/commit/e60000d
```

## Ghi chú

```text
Toàn bộ dự án đã sẵn sàng nộp bài và chạy nghiệm thu chất lượng.
```

---

## 4. Tổng kết thay đổi cuối project

### 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Xác thực đăng nhập & Đăng ký phân quyền resident | Completed | login.spec.js, resident.spec.js | Hoạt động an toàn, chống parameter injection |
| 2 | Quản lý lịch trình và phân tuyến thu gom rác | Completed | manager.spec.js, collector.spec.js | Manager lập lịch, collector cập nhật tiến độ |
| 3 | Báo cáo sự cố và đính kèm bằng chứng (Evidence) | Completed | collector.spec.js | Collector upload ảnh thực tế và chuyển trạng thái |
| 4 | Thanh toán phí vệ sinh môi trường bằng PayOS VietQR | Completed | resident.spec.js | Quét mã QR, tự động verify trạng thái giao dịch |
| 5 | Quản trị viên (User CRUD, Broadcast alerts) | Completed | manager.spec.js | Phân trang 10 dòng/trang, search realtime, đếm giờ |

---

### 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 | Theo dõi GPS vị trí xe rác thời gian thực | Không có thiết bị IoT/GPS thật trên xe thu gom | Dùng mô phỏng bản đồ số giả lập tọa độ các điểm dừng |
| 2 | Tối ưu hóa tuyến đường thu gom bằng AI | Vượt quá phạm vi thời gian môn học | Nghiên cứu giải thuật Dijkstra/Genetic Algorithm để định tuyến |

---

### 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Trung bình | Hỗ trợ phân tích Use Cases và User Stories |
| Design | Có | Trung bình | Gợi ý layout, bảng màu Flat + Glassmorphism |
| Database | Có | Nhiều | Hỗ trợ thiết kế Schema NoSQL Firestore |
| Coding | Có | Nhiều | Sinh code boilerplate ReactJS, endpoints Express |
| Debug | Có | Nhiều | Hỗ trợ phát hiện lỗi rò rỉ N+1, lỗi double click |
| Testing | Có | Nhiều | Hỗ trợ viết test cases Jest, Playwright |
| Report | Có | Trung bình | Hỗ trợ lập cấu trúc audit, viết reflection |
| Presentation | Không | Ít | Nhóm tự thiết kế slide trình chiếu |

---

### 4.4. Bài học rút ra

```text
1. Hiểu sâu sắc sự khác biệt khi quản trị cơ sở dữ liệu phi quan hệ (NoSQL Firestore) so với RDBMS thông thường.
2. Tầm quan trọng của việc xây dựng hệ thống phân quyền an toàn (RBAC) đồng nhất giữa frontend và backend.
3. Kỹ năng thiết lập test tự động E2E bằng Playwright giúp phát hiện lỗi nghiệp vụ rất nhanh sau mỗi lần sửa code.
```

---

### 4.5. Hướng cải thiện tiếp theo

```text
1. Phát triển mobile app riêng cho Collector để dễ dàng tác nghiệp hiện trường và upload ảnh.
2. Tích hợp giải thuật tối ưu hóa đường đi của xe rác (Vehicle Routing Problem) để tiết kiệm nhiên liệu.
3. Bổ sung cổng thanh toán thực tế khác như MoMo/VNPay qua Webhook để đa dạng phương thức.
```

---

## 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Văn Xuân Phước | 29/06/2026 |
