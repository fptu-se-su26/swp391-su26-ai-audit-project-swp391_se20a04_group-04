# Báo cáo Kịch bản Kiểm thử Tự động (Playwright Test Cases Report)

Tài liệu này tổng hợp danh sách các kịch bản kiểm thử tự động (E2E Tests) được thiết kế và thực thi bằng framework **Playwright** cho hệ thống **EcoSchedule**. Các test case được phân loại theo các phân hệ/vai trò người dùng khác nhau và áp dụng các kỹ thuật thiết kế kiểm thử tiêu chuẩn như Phân vùng tương đương (EP), Phân tích giá trị biên (BVA), Bảng quyết định (Decision Table) và Kiểm thử chuyển đổi trạng thái (State Transition).

> [!NOTE]
> Tất cả các kịch bản kiểm thử bên dưới đã được triển khai mã nguồn kiểm thử tự động tại thư mục `e2e-tests/tests/` và chạy thành công trên môi trường kiểm thử giả lập (API Mocking).

---

## BẢNG KỊCH BẢN KIỂM THỬ CHI TIẾT (E2E AUTOMATION TEST CASES SHEET)

| ID | Description | Precondition | Test Steps | Expected Result | Actual Result | Status | Note / Technique | Requirement ID | Module | Week | Automation Tool | Người thực hiện | Evidence / Bug ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TC-LOGIN-01** | Kiểm tra thông báo lỗi khi để trống thông tin đăng nhập | - Người dùng ở trang `/login`. | 1. Điều hướng tới `/login`. <br>2. Nhấn nút "Đăng nhập" (không điền gì). | - Hiển thị thông báo: "Email không được bỏ trống". <br>- Hiển thị thông báo: "Mật khẩu không được bỏ trống". | - Cả hai thông báo lỗi hiển thị chính xác dưới các ô nhập liệu tương ứng. | **Passed** | **EP** (Empty input validation) | `FR-AUTH-02` | Auth / Login | Tuần 7 | Playwright | Nhóm 4 | `login.spec.js` |
| **TC-LOGIN-02** | Kiểm tra thông báo lỗi khi nhập sai định dạng email hoặc mật khẩu quá ngắn | - Người dùng ở trang `/login`. | 1. Điều hướng tới `/login`. <br>2. Nhập email: `invalid@email` (sai định dạng email). <br>3. Nhập mật khẩu: `12345` (độ dài 5 ký tự). <br>4. Nhấn nút "Đăng nhập". | - Hiển thị thông báo: "Định dạng email không hợp lệ". <br>- Hiển thị thông báo: "Mật khẩu phải có tối thiểu 6 ký tự". | - Các lỗi định dạng và độ dài mật khẩu được hiển thị đúng vị trí. | **Passed** | **BVA** (Mật khẩu < 6 ký tự), **EP** (Email sai định dạng) | `FR-AUTH-04` | Auth / Login | Tuần 7 | Playwright | Nhóm 4 | `login.spec.js` |
| **TC-LOGIN-03** | Kiểm tra thông báo lỗi khi đăng nhập sai thông tin tài khoản (Lỗi phía API) | - Người dùng ở trang `/login`. <br>- Mock API `**/api/auth/login` trả về mã **401** và JSON: `{ error: "Tên đăng nhập hoặc mật khẩu không đúng." }`. | 1. Điều hướng tới `/login`. <br>2. Nhập email: `wrong@test.com`. <br>3. Nhập mật khẩu: `wrongpassword`. <br>4. Nhấn nút "Đăng nhập". | - Hiển thị thông báo lỗi (Toast/Banner): "Tên đăng nhập hoặc mật khẩu không đúng." | - Toast thông báo lỗi hiển thị ở phía trên màn hình với nội dung chính xác. | **Passed** | **Decision Table** (Tài khoản không tồn tại / mật khẩu sai) | `FR-AUTH-02` | Auth / Login | Tuần 7 | Playwright | Nhóm 4 | `login.spec.js` |
| **TC-LOGIN-04** | Kiểm tra đăng nhập thành công và chuyển hướng trang | - Người dùng ở trang `/login`. <br>- Mock API `**/api/auth/login` trả về mã **200** với thông tin người dùng vai trò `resident` (Cư dân). | 1. Điều hướng tới `/login`. <br>2. Nhập email: `resident@test.com`. <br>3. Nhập mật khẩu: `CorrectPassword123!`. <br>4. Nhấn nút "Đăng nhập". | - Hiển thị Toast thông báo: "Đăng nhập thành công". <br>- URL được chuyển hướng và không còn chứa `/login`. | - Xuất hiện Toast thành công và trang tự động chuyển hướng về trang chủ `/`. | **Passed** | **State Transition** (Chuyển trạng thái từ Chưa đăng nhập -> Đã đăng nhập) | `FR-AUTH-01` | Auth / Login | Tuần 7 | Playwright | Nhóm 4 | `login.spec.js` |
| **TC-RES-01** | Kiểm tra đăng nhập với vai trò Cư dân | - Người dùng ở trang `/login`. <br>- Mock API đăng nhập với thông tin người dùng tên "Test Resident", vai trò `resident`. | 1. Điều hướng tới `/login`. <br>2. Nhập email & mật khẩu cư dân hợp lệ. <br>3. Nhấn đăng nhập. | - Người dùng được chuyển hướng về trang chủ. <br>- Header hiển thị tên cư dân: "Test Resident". | - Đăng nhập thành công và tên "Test Resident" hiển thị trên thanh điều hướng. | **Passed** | **Use Case** (Luồng thiết lập phiên làm việc của Cư dân) | `FR-AUTH-01` | Resident / Auth | Tuần 7 | Playwright | Nhóm 4 | `resident.spec.js` |
| **TC-RES-02** | Tra cứu lịch thu gom rác theo địa bàn | - Người dùng đã đăng nhập với vai trò Cư dân. <br>- Mock API địa chỉ và lịch trình hoạt động (`/api/address/provinces`, `/api/address/wards*`, `/api/schedules*`). | 1. Điều hướng tới `/tra-cuu`. <br>2. Chọn Tỉnh/Thành phố: "Thành phố Đà Nẵng". <br>3. Chọn Quận/Huyện, Phường/Xã chứa từ khóa "Sơn Trà" (ví dụ: "Phường An Hải Tây, Quận Sơn Trà"). <br>4. Nhấn nút "Tra cứu lịch". | - Danh sách kết quả hiển thị thông tin lịch thu gom rác khớp với khu vực đã chọn. <br>- Tiêu đề kết quả "Lịch thu gom rác tìm thấy" hiển thị rõ ràng. | - Dropdown được chọn chính xác, danh sách lịch trình tải thành công và hiển thị đầy đủ thông tin giả lập. | **Passed** | **Decision Table** / **Use Case** (Tra cứu thông tin theo bộ lọc địa lý) | `FR-RES-SCH-01` | Resident / Lookup | Tuần 7 | Playwright | Nhóm 4 | `resident.spec.js` |
| **TC-COLL-01** | Kiểm tra đăng nhập vai trò Thu gom, xem danh sách lịch làm việc và phản ánh được phân công | - Người dùng ở trang `/login`. <br>- Mock các API: Đăng nhập vai trò `collector`, stats chỉ số hoạt động (`/api/dashboard/collector*`), lịch trình hoạt động (`/api/collector/schedules*`), và phản ánh được giao (`/api/collector/reports`). | 1. Điều hướng tới `/login`. <br>2. Nhập email: `collector@test.com` và mật khẩu. <br>3. Nhấn đăng nhập. <br>4. Kiểm tra trang Lịch làm việc (`/collector`). <br>5. Di chuyển đến trang Phản ánh chỉ định (`/collector/reports`). | - Chuyển hướng thành công tới `/collector`. <br>- Hiển thị tên: "Test Collector" và lịch làm việc có tuyến "Tuyến Sơn Trà 1". <br>- Tại trang `/collector/reports` hiển thị phản ánh được giao: "Rác ngập tràn hẻm 12". | - Trang `/collector` hiển thị đúng lịch làm việc giả lập. <br>- Trang `/collector/reports` hiển thị đúng danh sách phản ánh giả lập được giao. | **Passed** | **Use Case** (Quy trình làm việc hàng ngày của Người thu gom) | `FR-COL-01` | Collector / Schedule & Reports | Tuần 7 | Playwright | Nhóm 4 | `collector.spec.js` |
| **TC-MGR-01** | Kiểm tra đăng nhập vai trò Quản lý và xem phản ánh của cư dân | - Người dùng ở trang `/login`. <br>- Mock các API: Đăng nhập vai trò `manager`, danh sách phản ánh cư dân (`/api/manager/complaints`), phản ánh chờ duyệt của nhân viên (`/api/manager/feedback-reports*`). | 1. Điều hướng tới `/login`. <br>2. Nhập email: `manager@test.com` và mật khẩu. <br>3. Nhấn đăng nhập. <br>4. Kiểm tra trang Dashboard của Quản lý (`/dashboard`). | - Chuyển hướng thành công tới `/dashboard`. <br>- Hiển thị tên: "Test Manager". <br>- Phần "Phản ánh cư dân" hiển thị tiêu đề "Rác ngập tràn chưa dọn". | - Đăng nhập thành công, chuyển hướng trang chính xác và tải đầy đủ danh sách phản ánh của cư dân. | **Passed** | **Use Case** (Luồng quản trị của Manager) | `FR-MAN-COM-01` | Manager / Dashboard | Tuần 7 | Playwright | Nhóm 4 | `manager.spec.js` |
| **TC-MGR-02** | Phê duyệt phản ánh hoàn thành công việc từ Người thu gom | - Quản lý đã đăng nhập thành công và đang ở trang `/dashboard`. <br>- Có ít nhất 1 phản ánh chờ duyệt trong danh sách ("Thùng rác hỏng tại ngã tư"). <br>- Mock API duyệt phản ánh (`/api/manager/feedback-reports/*/approve`). | 1. Cuộn đến khu vực danh sách "Phản ánh chờ duyệt". <br>2. Xác minh sự tồn tại của phản ánh "Thùng rác hỏng tại ngã tư". <br>3. Nhấn nút "Duyệt" trên thẻ phản ánh đó. | - Xuất hiện thông báo thành công: "Đã duyệt phản ánh. Cư dân sẽ nhận thông báo.". <br>- Phản ánh "Thùng rác hỏng tại ngã tư" biến mất khỏi giao diện danh sách chờ duyệt. | - Thông báo thành công hiển thị, giao diện tự động cập nhật ẩn đi phản ánh đã được duyệt thành công. | **Passed** | **State Transition** (Trạng thái phản ánh chuyển từ Chờ duyệt -> Đã hoàn thành/Đóng) | `FR-MAN-COM-04` | Manager / Feedback | Tuần 7 | Playwright | Nhóm 4 | `manager.spec.js` |

---

## Chi tiết theo Phân hệ (Module Details)

### 1. Phân hệ: Đăng nhập (Login Module)
*Tệp kiểm thử tương ứng:* `e2e-tests/tests/login.spec.js`

Xem chi tiết 4 kịch bản từ `TC-LOGIN-01` đến `TC-LOGIN-04` tại bảng tổng hợp trên để biết chi tiết các bước thiết lập mock API và thông báo lỗi tương ứng.

### 2. Phân hệ: Cư dân (Resident Module)
*Tệp kiểm thử tương ứng:* `e2e-tests/tests/resident.spec.js`

Xem chi tiết 2 kịch bản `TC-RES-01` và `TC-RES-02` tại bảng tổng hợp trên.

### 3. Phân hệ: Người thu gom rác (Collector Module)
*Tệp kiểm thử tương ứng:* `e2e-tests/tests/collector.spec.js`

Xem chi tiết kịch bản `TC-COLL-01` tại bảng tổng hợp trên.

### 4. Phân hệ: Quản lý (Manager Module)
*Tệp kiểm thử tương ứng:* `e2e-tests/tests/manager.spec.js`

Xem chi tiết 2 kịch bản `TC-MGR-01` và `TC-MGR-02` tại bảng tổng hợp trên.

---

## 5. Tổng kết thực thi kiểm thử (Execution Summary)

* **Tổng số Test Case:** 9
* **Số Test Case chạy thành công (Passed):** 9
* **Số Test Case thất bại (Failed):** 0
* **Tỷ lệ thành công (Pass Rate):** 100%
* **Công cụ áp dụng:** Playwright E2E Runner (NodeJS), API Route Mocking.
