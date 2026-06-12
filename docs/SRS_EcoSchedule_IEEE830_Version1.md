# Software Requirements Specification

## EcoSchedule – Smart Waste Collection Management System for Urban Areas

*Theo IEEE Std 830-1998*

---

## Thông tin tài liệu

| Thông tin | Nội dung |
|-----------|----------|
| Tên tài liệu | Software Requirements Specification – EcoSchedule |
| Phiên bản | v1.0 – Bản đầu tiên |
| Ngày tạo | 06/06/2026 |
| Nhóm thực hiện | SWT301-05 / LGBT |
| Môn học | SWT301 – Software Testing |
| Tech stack dự kiến | ReactJS + Node.js + Express + MySQL |
| Người phê duyệt | [Giảng viên / Product Owner] |

### Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 06/06/2026 | Nhóm SWT301-05 | Bản SRS đầu tiên |

---

## Mục lục

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Scope
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
   - 1.5 Overview
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 Assumptions and Dependencies
3. [Specific Requirements](#3-specific-requirements)
   - 3.1 External Interface Requirements
   - 3.2 Data Dictionary
   - 3.3 Functional Requirements
   - 3.4 Business Rules
   - 3.5 Non-Functional Requirements
   - 3.6 State Transition Rules
4. [Use Case Specifications](#4-use-case-specifications)
5. [Requirement Traceability Matrix](#5-requirement-traceability-matrix)
6. [Appendices](#6-appendices)

---

## 1. Introduction

### 1.1 Purpose

Tài liệu này đặc tả yêu cầu phần mềm cho EcoSchedule – hệ thống quản lý thu gom rác tại khu đô thị/khu dân cư. Tài liệu là căn cứ để thiết kế, lập kế hoạch kiểm thử, viết test case, kiểm thử nghiệm thu và đánh giá phạm vi đồ án.

Đối tượng sử dụng tài liệu: nhóm phát triển, nhóm kiểm thử, giảng viên, Product Owner giả định và các bên liên quan trong quá trình nghiệm thu môn học.

### 1.2 Scope

EcoSchedule là web application hỗ trợ 4 vai trò: Resident, Collector, Manager và Admin. Hệ thống tập trung vào quản lý lịch thu gom, tuyến thu gom, thông báo nhắc lịch, phản ánh môi trường và thanh toán phí vệ sinh ở mức demo/mock.

**Phạm vi trong bản v1.0**

| Phạm vi | Mô tả cụ thể |
|---------|--------------|
| Lịch thu gom | Tạo, công bố, xem, lọc và cập nhật trạng thái lịch thu gom theo khu vực, tuyến, loại rác và thời gian. |
| Thông báo | Gửi thông báo nhắc lịch và thông báo thay đổi lịch qua in-app notification; email/SMS/Zalo được mô phỏng bằng notification log nếu chưa tích hợp thật. |
| Phản ánh môi trường | Resident gửi phản ánh kèm mô tả, vị trí và ảnh; Manager xác minh, giao việc; Collector xử lý và cập nhật ảnh đối chứng. |
| Tuyến thu gom | Manager phân tuyến cho Collector; Collector xem tuyến được giao trong ngày và cập nhật trạng thái. |
| Thanh toán phí | Resident thanh toán phí vệ sinh bằng cổng thanh toán giả lập. Không xử lý tiền thật trong phạm vi demo. |
| Quản trị hệ thống | Admin quản lý tài khoản, vai trò, quyền hạn, danh mục hệ thống và giám sát hoạt động. |

**Ngoài phạm vi**

| Ngoài phạm vi | Lý do |
|---------------|-------|
| Theo dõi GPS thời gian thực của xe rác ngoài bản đồ tuyến mô phỏng | Không có thiết bị GPS/IoT thật trong phạm vi môn học. |
| AI tối ưu tuyến đường tự động | Chỉ được xem là hướng mở rộng; v1.0 tập trung vào quy trình quản lý và kiểm thử. |
| Thanh toán tiền thật | Dùng mock gateway để tránh yêu cầu pháp lý, bảo mật và transaction thật. |
| Tích hợp hệ thống chính quyền/đơn vị môi trường thật | Không có API chính thức từ bên thứ ba. |

### 1.3 Definitions, Acronyms, and Abbreviations

| Thuật ngữ | Định nghĩa sử dụng trong tài liệu |
|-----------|----------------------------------|
| Resident | Cư dân/người dân sử dụng dịch vụ thu gom rác trong khu dân cư. |
| Collector | Nhân viên thu gom/driver trực tiếp thực hiện tuyến thu gom hoặc xử lý phản ánh. |
| Manager | Đơn vị thu gom hoặc ban quản lý khu đô thị, có quyền lập lịch, phân tuyến và quản lý phản ánh. |
| Admin | Quản trị viên hệ thống, quản lý tài khoản, quyền hạn, cấu hình và giám sát hệ thống. |
| Schedule | Một lịch thu gom cụ thể gồm ngày, giờ, khu vực, tuyến, loại rác, collector và trạng thái. |
| Route | Tuyến thu gom gồm danh sách khu vực/điểm thu gom được gán cho Collector. |
| Complaint | Phản ánh môi trường do Resident gửi, ví dụ rác tồn đọng, rác chưa thu gom, điểm tập kết quá tải. |
| Evidence | Ảnh hoặc ghi chú bằng chứng trước/sau xử lý phản ánh hoặc hoàn thành tuyến. |
| Notification Log | Bản ghi hệ thống về thông báo đã tạo/gửi/thất bại, dùng để kiểm thử notification. |
| Mock Payment | Cổng thanh toán giả lập cho phép test các trạng thái PAID, FAILED, PENDING mà không dùng tiền thật. |

### 1.4 References

| Tài liệu | Nội dung tham chiếu |
|----------|---------------------|
| IEEE Std 830-1998 | Recommended Practice for Software Requirements Specifications. |
| Tài liệu chủ đề SWT301-05 | Bối cảnh, vấn đề, câu hỏi nghiên cứu, dữ liệu đầu vào và kết quả mong đợi của EcoSchedule. |
| Tài liệu đánh giá hệ thống | Tech stack ReactJS + Node.js + Express + MySQL và phạm vi chức năng chính. |
| Role description | Mô tả 4 vai trò Resident, Collector, Manager/Sub-Admin, Admin. |
| Use case diagrams | Các use case của Resident, Collector, Manager và Admin do nhóm cung cấp. |

### 1.5 Overview

Phần 2 mô tả tổng quan hệ thống, người dùng, môi trường vận hành và giả định. Phần 3 mô tả yêu cầu giao diện, dữ liệu, chức năng, phi chức năng, business rules và trạng thái. Phần 4 đặc tả các use case chính. Phần 5 trace yêu cầu sang use case và test case dự kiến. Phần 6 chứa checklist kiểm tra chất lượng SRS.

---

## 2. Overall Description

### 2.1 Product Perspective

EcoSchedule là một hệ thống web client-server. Frontend ReactJS gọi REST API của backend Node.js/Express. Backend xử lý nghiệp vụ, phân quyền, lịch, phản ánh, thanh toán giả lập và ghi notification log trong MySQL.

| Thành phần | Trách nhiệm | Dữ liệu vào/ra chính |
|------------|-------------|----------------------|
| Frontend Web | Cung cấp giao diện cho 4 vai trò, kiểm tra input cơ bản, hiển thị dữ liệu và thông báo lỗi. | Request JSON đến API; nhận response JSON và render UI. |
| Backend API | Xác thực, phân quyền, xử lý lịch, tuyến, phản ánh, thanh toán, báo cáo và notification. | Nhận request từ frontend; trả status code và JSON chuẩn. |
| MySQL Database | Lưu user, role, area, route, schedule, complaint, payment, notification log, audit log. | Dữ liệu quan hệ, có khóa ngoại và trạng thái rõ ràng. |
| Mock Notification Service | Tạo notification log cho push/in-app/email/SMS/Zalo giả lập. | Input: user_id, channel, title, content; Output: SENT/FAILED log. |
| Mock Payment Gateway | Giả lập kết quả thanh toán phí vệ sinh. | Input: invoice_id, amount; Output: PAID/FAILED/PENDING. |

### 2.2 Product Functions

| Nhóm chức năng | Mô tả chức năng rõ ràng |
|----------------|-------------------------|
| Authentication & Authorization | Đăng ký, đăng nhập, đăng xuất; cấp quyền theo role Resident, Collector, Manager, Admin. |
| Resident Portal | Xem lịch, nhận thông báo, thanh toán, xem thông báo, gửi phản ánh và theo dõi trạng thái. |
| Collector Portal | Xem lịch/ngày, xem tuyến được phân công, cập nhật trạng thái thu gom, báo sự cố và upload evidence. |
| Manager Portal | Tạo lịch, phân tuyến, quản lý phản ánh, quản lý thông báo, xem dashboard và xuất báo cáo PDF. |
| Admin Portal | Quản lý user, role, permission, cấu hình hệ thống và monitor audit log. |
| Reporting | Tổng hợp số liệu thu gom, phản ánh, thanh toán và hiệu suất xử lý theo khoảng thời gian. |

### 2.3 User Classes and Characteristics

| Role | Mô tả | Quyền chính | Tần suất |
|------|-------|-------------|----------|
| Resident | Cư dân trong khu đô thị/khu dân cư. | Xem lịch, nhận thông báo, thanh toán phí, gửi và theo dõi phản ánh. | Hàng ngày / hàng tuần |
| Collector | Nhân viên thu gom phụ trách tuyến. | Xem tuyến, cập nhật trạng thái, báo sự cố, upload ảnh đối chứng. | Hàng ngày |
| Manager | Ban quản lý/đơn vị thu gom. | Tạo lịch, phân tuyến, phê duyệt xử lý, tạo báo cáo. | Hàng ngày |
| Admin | Quản trị viên kỹ thuật hệ thống. | Quản lý người dùng, vai trò, cấu hình, monitor hoạt động, quản lý phản ánh. | Theo nhu cầu vận hành |

### 2.4 Operating Environment

| Thành phần | Yêu cầu cụ thể |
|------------|----------------|
| Client browser | Chrome 120+, Edge 120+, Firefox 120+ trên desktop; Chrome/Safari mobile trên Android/iOS. |
| Frontend | ReactJS, responsive web layout, gọi backend qua HTTPS REST API. |
| Backend | Node.js 20 LTS + Express, REST API JSON, JWT/session-based authentication. |
| Database | Firebase, timezone cấu hình Asia/Ho_Chi_Minh. |
| Deployment demo | Dev/Staging chạy trên máy nhóm hoặc cloud demo; dữ liệu demo được seed trước khi test. |
| File storage demo | Ảnh evidence lưu local folder hoặc mock storage; DB lưu đường dẫn file. |

### 2.5 Design and Implementation Constraints

| ID | Constraint testable |
|----|---------------------|
| CON-01 | Tất cả API nghiệp vụ phải dùng JSON request/response và trả Content-Type = application/json, trừ upload file dùng multipart/form-data. |
| CON-02 | Tất cả API yêu cầu đăng nhập phải kiểm tra token trước khi xử lý nghiệp vụ. |
| CON-03 | Password không được lưu plain text; trường password_hash không được trùng với mật khẩu gốc khi kiểm tra DB test. |
| CON-04 | Thời gian trong lịch, thông báo, payment và log phải lưu theo timezone Asia/Ho_Chi_Minh hoặc UTC có convert rõ ràng khi hiển thị. |
| CON-05 | Mỗi API lỗi validate phải trả HTTP 400 và body gồm error_code, message, details. |
| CON-06 | Hệ thống demo dùng mock payment/notification; kết quả mock phải được ghi log để kiểm thử. |

### 2.6 Assumptions and Dependencies

| ID | Assumption / Dependency | Ảnh hưởng kiểm thử |
|----|-------------------------|-------------------|
| ASM-01 | Dữ liệu khu vực, tuyến, loại rác và lịch ban đầu do Manager/Admin nhập hoặc seed data. | Test cần chuẩn bị bộ dữ liệu cố định. |
| ASM-02 | Resident chỉ được gán vào một khu vực cư trú chính tại một thời điểm. | Test lịch và thông báo dựa trên active_area_id. |
| ASM-03 | Payment gateway và notification channel là mock trong demo. | Test xác nhận log và trạng thái thay vì xác nhận giao dịch/thiết bị thật. |
| DEP-01 | Hệ thống phụ thuộc MySQL để lưu dữ liệu nghiệp vụ. | Database down thì API trả lỗi 500/503 theo cấu hình. |
| DEP-02 | Ảnh evidence phụ thuộc file storage demo. | Test upload cần kiểm tra định dạng và kích thước file. |

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces

| Screen ID | Tên màn hình | Role | Yêu cầu hiển thị/nhập liệu |
|-----------|--------------|------|----------------------------|
| UI-AUTH-01 | Login | All roles | Email, password, nút Login, link Register/Forgot password; lỗi sai credential hiển thị trong cùng màn hình. |
| UI-RES-01 | Resident Dashboard | Resident | Hiển thị lịch sắp tới, thông báo chưa đọc, trạng thái phí và nút gửi phản ánh. |
| UI-RES-02 | Collection Schedule | Resident | Bộ lọc từ ngày/đến ngày, loại rác, khu vực; bảng lịch gồm ngày, giờ, loại rác, trạng thái, ghi chú. |
| UI-RES-03 | Complaint Form | Resident | Nhập tiêu đề, mô tả, vị trí, mức độ, ảnh bằng chứng; nút Submit. |
| UI-COL-01 | Collector Daily Schedule | Collector | Danh sách tuyến/lịch trong ngày; trạng thái từng điểm; nút Start/Complete/Report incident. |
| UI-MAN-01 | Schedule Management | Manager | Tạo/sửa/hủy/publish lịch; phân collector/route; validate trùng lịch. |
| UI-MAN-02 | Complaint Management | Manager | Danh sách phản ánh, filter trạng thái, xem ảnh, assign collector, approve/reject. |
| UI-ADM-01 | User & Role Management | Admin | Tạo/sửa/khóa user, gán role, gán permission. |
| UI-ADM-02 | System Monitor | Admin | Audit log, notification log, payment log, filter theo thời gian và actor. |

#### 3.1.2 API and Communication Interfaces

| ID | Requirement |
|----|-------------|
| API-01 | API base path dùng `/api/v1`. Ví dụ: `/api/v1/auth/login`, `/api/v1/schedules`, `/api/v1/complaints`. |
| API-02 | Mọi response thành công trả body dạng `{ "data": ..., "message": "..." }`. Mọi response lỗi trả `{ "error_code": "...", "message": "...", "details": [...] }`. |
| API-03 | API tạo thành công trả HTTP 201; đọc thành công trả 200; validate sai trả 400; chưa đăng nhập trả 401; không đủ quyền trả 403; không tìm thấy trả 404. |
| API-04 | Upload evidence dùng multipart/form-data, chỉ nhận .jpg, .jpeg, .png, dung lượng mỗi file <= 5MB. |

### 3.2 Data Dictionary

Các enum dưới đây dùng thống nhất cho database, API, UI và test case để tránh hiểu sai trạng thái.

| Entity/Enum | Giá trị hợp lệ | Ý nghĩa kiểm thử |
|-------------|----------------|------------------|
| User.role | RESIDENT, COLLECTOR, MANAGER, ADMIN | Dùng để kiểm tra phân quyền theo role. |
| Schedule.status | DRAFT, PUBLISHED, UPDATED, CANCELLED, IN_PROGRESS, COMPLETED, DELAYED | Chỉ PUBLISHED/UPDATED/IN_PROGRESS/COMPLETED/DELAYED hiển thị cho Resident; DRAFT chỉ Manager/Admin thấy. |
| WasteType.code | ORGANIC, RECYCLABLE, HAZARDOUS, BULKY, GENERAL | Loại rác hợp lệ khi tạo lịch. |
| Complaint.status | SUBMITTED, VERIFIED, REJECTED, ASSIGNED, IN_PROGRESS, RESOLVED_PENDING_APPROVAL, CLOSED | Luồng phản ánh phải đi theo thứ tự trạng thái hợp lệ. |
| Payment.status | UNPAID, PENDING, PAID, FAILED, CANCELLED | Mock payment cập nhật invoice dựa trên callback giả lập. |
| Notification.status | CREATED, SENT, FAILED, READ | Dùng kiểm tra notification log và danh sách thông báo. |

### 3.3 Functional Requirements

> **Quy ước:** "Hệ thống phải" là yêu cầu bắt buộc. Mỗi yêu cầu có thể được kiểm thử bằng UI test, API test hoặc kiểm tra database/log.

#### 3.3.1 Authentication & Authorization

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-AUTH-01 | Khi người dùng nhập email đúng định dạng và password đúng, hệ thống phải đăng nhập thành công, trả token/session, role và redirect đến dashboard tương ứng với role. | High | API/UI |
| FR-AUTH-02 | Nếu email không tồn tại hoặc password sai, hệ thống phải không tạo session và hiển thị "Email hoặc mật khẩu không đúng"; không được chỉ rõ email có tồn tại hay không. | High | API/UI |
| FR-AUTH-03 | Khi tạo tài khoản Resident, hệ thống phải yêu cầu email, password, full_name, phone, area_id; email phải duy nhất không phân biệt hoa thường. | High | API/DB |
| FR-AUTH-04 | Password khi đăng ký phải dài 8-32 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt; vi phạm trả error_code PASSWORD_POLICY_FAILED. | High | API/UI |
| FR-AUTH-05 | Hệ thống phải chặn truy cập API nếu token thiếu/hết hạn bằng HTTP 401; nếu token hợp lệ nhưng role không có quyền thì trả HTTP 403. | High | API |
| FR-AUTH-06 | Khi người dùng đăng xuất, hệ thống phải xóa session/token phía client; truy cập lại màn hình yêu cầu đăng nhập phải redirect về Login. | Medium | UI |

#### 3.3.2 Resident – Collection Schedule

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-SCH-01 | Khi Resident đã đăng nhập và có active_area_id, hệ thống phải hiển thị danh sách lịch thuộc khu vực đó trong khoảng ngày được chọn, gồm: ngày, giờ bắt đầu, giờ kết thúc, loại rác, tuyến, trạng thái và ghi chú. | High | API/UI |
| FR-RES-SCH-02 | Nếu Resident chưa chọn khu vực, màn hình lịch phải hiển thị thông báo "Vui lòng chọn khu vực cư trú trước khi xem lịch" và nút chuyển đến hồ sơ cá nhân. | High | UI |
| FR-RES-SCH-03 | Resident có thể lọc lịch theo from_date, to_date và waste_type; nếu from_date > to_date, hệ thống phải từ chối và hiển thị lỗi validate. | Medium | API/UI |
| FR-RES-SCH-04 | Hệ thống chỉ hiển thị cho Resident các lịch có status PUBLISHED, UPDATED, CANCELLED, IN_PROGRESS, COMPLETED hoặc DELAYED; không hiển thị DRAFT. | High | API/DB |
| FR-RES-SCH-05 | Trên dashboard Resident, hệ thống phải hiển thị lịch thu gom sắp tới gần nhất trong 7 ngày tiếp theo của khu vực cư trú. Nếu không có lịch, hiển thị "Không có lịch thu gom trong 7 ngày tới". | High | UI/API |

#### 3.3.3 Resident – Notification and Announcements

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-NOT-01 | Resident có thể bật/tắt nhận thông báo và chọn thời gian nhắc trước: 30 phút, 1 giờ, 6 giờ hoặc 1 ngày trước giờ bắt đầu thu gom. | High | UI/API |
| FR-RES-NOT-02 | Với lịch PUBLISHED/UPDATED, hệ thống phải tạo notification log cho các Resident thuộc khu vực của lịch tại thời điểm nhắc đã cấu hình. | High | API/DB |
| FR-RES-NOT-03 | Nếu Manager hủy hoặc đổi giờ lịch đã publish, hệ thống phải tạo thông báo thay đổi cho tất cả Resident thuộc khu vực bị ảnh hưởng trong vòng 5 phút. | High | API/DB |
| FR-RES-NOT-04 | Resident có thể xem danh sách thông báo của mình, sắp xếp mới nhất trước; mỗi item gồm title, content, created_at, status READ/UNREAD. | Medium | UI/API |
| FR-RES-NOT-05 | Resident có thể đánh dấu một thông báo là đã đọc; sau khi cập nhật, thông báo đó không còn tính vào unread_count. | Low | API/UI |
| FR-RES-ANN-01 | Resident có thể xem thông báo chung/announcement do Manager tạo, gồm title, content, target_area, published_at và expired_at nếu có. | Medium | UI/API |

#### 3.3.4 Resident – Complaint

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-COM-01 | Resident gửi phản ánh phải nhập title từ 5-100 ký tự, description từ 20-1000 ký tự, area_id, location_text hoặc GPS coordinate, severity LOW/MEDIUM/HIGH. | High | API/UI |
| FR-RES-COM-02 | Resident có thể đính kèm tối đa 3 ảnh định dạng jpg/jpeg/png, mỗi ảnh <= 5MB; file sai định dạng hoặc quá dung lượng phải bị từ chối trước khi tạo phản ánh. | Medium | API/UI |
| FR-RES-COM-03 | Khi phản ánh hợp lệ được gửi, hệ thống phải tạo complaint status SUBMITTED, sinh complaint_code và hiển thị mã phản ánh cho Resident. | High | API/DB/UI |
| FR-RES-COM-04 | Resident chỉ được xem danh sách và chi tiết phản ánh do chính mình tạo; truy cập complaint của user khác phải trả 403. | High | API |
| FR-RES-COM-05 | Resident có thể theo dõi trạng thái phản ánh theo timeline: SUBMITTED → VERIFIED/REJECTED → ASSIGNED → IN_PROGRESS → RESOLVED_PENDING_APPROVAL → CLOSED. | High | UI/API |

#### 3.3.5 Resident – Online Payment

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-PAY-01 | Resident có thể xem danh sách hóa đơn phí vệ sinh của mình gồm invoice_id, kỳ thu, amount, due_date và status UNPAID/PENDING/PAID/FAILED. | High | UI/API |
| FR-RES-PAY-02 | Khi Resident chọn hóa đơn UNPAID và nhấn Pay, hệ thống phải tạo mock payment transaction với status PENDING và redirect/hiển thị màn hình mock gateway. | High | API/UI |
| FR-RES-PAY-03 | Khi mock gateway trả kết quả success, hệ thống phải cập nhật payment.status = PAID, lưu paid_at và không cho thanh toán lại hóa đơn đó. | High | API/DB |
| FR-RES-PAY-04 | Khi mock gateway trả failed/cancelled, hệ thống phải cập nhật status FAILED/CANCELLED và cho phép Resident thực hiện lại payment. | Medium | API/UI |

#### 3.3.6 Collector

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-COL-01 | Collector đã đăng nhập có thể xem lịch làm việc trong ngày hiện tại gồm route_name, danh sách điểm/khu vực, loại rác, giờ dự kiến và status. | High | UI/API |
| FR-COL-02 | Collector có thể xem tuyến được phân công trong khoảng ngày chọn; hệ thống chỉ trả route/schedule được gán cho collector_id của người đang đăng nhập. | High | API |
| FR-COL-03 | Collector có thể cập nhật trạng thái lịch được gán từ PUBLISHED/UPDATED sang IN_PROGRESS khi bắt đầu thu gom; nếu lịch không được gán cho Collector đó thì trả 403. | High | API/UI |
| FR-COL-04 | Collector có thể cập nhật trạng thái IN_PROGRESS sang COMPLETED khi kết thúc thu gom và bắt buộc upload ít nhất 1 ảnh evidence. | High | API/UI |
| FR-COL-05 | Collector có thể báo sự cố cho lịch/tuyến được gán bằng incident_type, description từ 20-1000 ký tự và evidence tùy chọn; status lịch chuyển DELAYED nếu incident_type ảnh hưởng lịch. | High | API/DB |
| FR-COL-06 | Khi lịch chuyển DELAYED, hệ thống phải tạo notification thay đổi lịch cho Resident thuộc khu vực liên quan. | High | API/DB |

#### 3.3.7 Manager

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-MAN-SCH-01 | Manager có thể tạo lịch thu gom với area_id, route_id, waste_type, collection_date, start_time, end_time, collector_id và note tùy chọn. | High | API/UI |
| FR-MAN-SCH-02 | Hệ thống phải từ chối tạo/cập nhật lịch nếu cùng area_id, waste_type, collection_date và khoảng thời gian bị chồng lấn với lịch chưa CANCELLED. | High | API/DB |
| FR-MAN-SCH-03 | Manager có thể publish lịch DRAFT. Sau khi publish, status chuyển PUBLISHED và hệ thống tạo notification log cho Resident thuộc khu vực đó. | High | API/DB |
| FR-MAN-SCH-04 | Manager có thể cập nhật lịch PUBLISHED; nếu đổi collection_date/start_time/end_time/waste_type/area_id thì status chuyển UPDATED và tạo notification thay đổi. | High | API/DB |
| FR-MAN-SCH-05 | Manager có thể hủy lịch chưa COMPLETED bằng cách nhập cancellation_reason từ 10-255 ký tự; status chuyển CANCELLED và tạo notification hủy lịch. | High | API/UI |
| FR-MAN-ROU-01 | Manager có thể tạo route gồm route_name, area_id và ít nhất 1 điểm thu gom; route_name phải duy nhất trong cùng area_id. | Medium | API/DB |
| FR-MAN-ROU-02 | Manager có thể gán route/schedule cho Collector đang ACTIVE; không được gán cho user bị khóa hoặc không có role COLLECTOR. | High | API/DB |
| FR-MAN-COM-01 | Manager có thể xem tất cả phản ánh, lọc theo status, area_id, severity và created_date. | High | UI/API |
| FR-MAN-COM-02 | Manager có thể xác minh phản ánh SUBMITTED. Nếu hợp lệ, chuyển VERIFIED; nếu không hợp lệ, chuyển REJECTED và bắt buộc nhập reject_reason. | High | API/UI |
| FR-MAN-COM-03 | Manager có thể assign phản ánh VERIFIED cho Collector; status chuyển ASSIGNED và Collector nhìn thấy nhiệm vụ trong danh sách công việc. | High | API/DB |
| FR-MAN-COM-04 | Manager có thể approve kết quả xử lý RESOLVED_PENDING_APPROVAL; khi approve, status chuyển CLOSED và Resident nhận notification. | High | API/DB |
| FR-MAN-REP-01 | Manager có thể generate report theo khoảng ngày với các chỉ số: số lịch, tỷ lệ hoàn thành đúng hạn, số phản ánh theo trạng thái, thời gian xử lý trung bình, tổng phí đã thanh toán. | Medium | API/UI |
| FR-MAN-REP-02 | Manager có thể export báo cáo hiện tại sang PDF; nếu không có dữ liệu trong khoảng ngày, hệ thống vẫn xuất PDF có thông báo "No data". | Low | UI |

#### 3.3.8 Admin

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-ADM-USR-01 | Admin có thể tạo user cho Collector, Manager hoặc Admin với email duy nhất, full_name, phone và role; password tạm thời phải được hash. | High | API/DB |
| FR-ADM-USR-02 | Admin có thể cập nhật full_name, phone, status và role của user; hệ thống phải ghi audit log gồm admin_id, target_user_id, changed_fields, timestamp. | High | API/DB |
| FR-ADM-USR-03 | Admin có thể khóa user ACTIVE; user bị khóa không thể đăng nhập và mọi token hiện tại của user đó bị vô hiệu trong lần kiểm tra kế tiếp. | High | API/UI |
| FR-ADM-USR-04 | Admin chỉ được xóa mềm user không có dữ liệu nghiệp vụ quan trọng; nếu user đã có schedule/complaint/payment thì hệ thống chuyển status DELETED thay vì xóa vật lý. | Medium | API/DB |
| FR-ADM-ROL-01 | Admin có thể tạo role và gán permission; permission gồm resource, action và effect ALLOW/DENY. | Medium | API/DB |
| FR-ADM-CON-01 | Admin có thể cấu hình notification channels enabled/disabled, payment_mock_mode và các mốc reminder mặc định. | Medium | UI/API |
| FR-ADM-MON-01 | Admin có thể monitor system activity bằng audit log, filter theo actor_role, action, resource và thời gian. | Medium | UI/API |

### 3.4 Business Rules

| Rule ID | Tên rule | Phát biểu rõ ràng | Vi phạm |
|---------|----------|-------------------|---------|
| BR-SCH-01 | Không trùng lịch | Trong cùng area_id và waste_type, hai lịch chưa CANCELLED không được có khoảng thời gian giao nhau trong cùng ngày. | [BLOCK] tạo/cập nhật lịch, trả SCHEDULE_OVERLAP. |
| BR-SCH-02 | Lịch quá khứ | Manager không được tạo lịch có start_time nhỏ hơn thời điểm hiện tại của hệ thống. | [BLOCK] trả START_TIME_IN_PAST. |
| BR-SCH-03 | Publish lịch | Chỉ lịch DRAFT có đủ area_id, route_id, waste_type, collector_id, collection_date, start_time, end_time mới được publish. | [BLOCK] trả MISSING_REQUIRED_FIELDS. |
| BR-NOT-01 | Đối tượng nhận thông báo | Thông báo lịch chỉ gửi cho Resident ACTIVE có active_area_id trùng area_id của lịch và notification_enabled = true. | [AUTO] bỏ qua user không đủ điều kiện, ghi skipped_count. |
| BR-COM-01 | Quyền xem phản ánh | Resident chỉ xem phản ánh của chính mình; Collector chỉ xem phản ánh được assign; Manager/Admin xem theo phạm vi quyền. | [BLOCK] trả HTTP 403. |
| BR-COM-02 | Đóng phản ánh | Complaint chỉ được CLOSED khi đã có ít nhất 1 evidence sau xử lý và được Manager approve. | [BLOCK] trả EVIDENCE_REQUIRED hoặc APPROVAL_REQUIRED. |
| BR-PAY-01 | Thanh toán một lần | Hóa đơn PAID không được tạo payment transaction mới. | [BLOCK] trả INVOICE_ALREADY_PAID. |
| BR-ADM-01 | Audit log bắt buộc | Mọi thao tác tạo/sửa/xóa/khóa user, lịch, role và cấu hình phải ghi audit log. | [AUTO] ghi log; nếu ghi log thất bại thì rollback transaction nghiệp vụ. |

### 3.5 Non-Functional Requirements

| ID | Requirement đo lường được | Priority | Verification |
|----|---------------------------|----------|--------------|
| NFR-PER-01 | 95% request GET /api/v1/schedules của một Resident với tối đa 200 lịch phải phản hồi <= 1000ms trong môi trường demo. | High | API perf test |
| NFR-PER-02 | Màn hình Resident Dashboard phải render dữ liệu ban đầu trong <= 3 giây với mạng nội bộ/trường học và dataset demo <= 10.000 records. | Medium | UI test |
| NFR-PER-03 | Hệ thống phải xử lý 100 người dùng đồng thời đọc lịch với error rate <= 1% trong 5 phút test JMeter demo. | Medium | JMeter |
| NFR-SEC-01 | Password phải được hash bằng bcrypt hoặc thuật toán tương đương; DB không được chứa plain password. | High | DB check |
| NFR-SEC-02 | Tất cả API Manager/Admin/Collector phải có role-based authorization; test với Resident phải nhận 403. | High | API test |
| NFR-SEC-03 | Input text trong complaint, announcement, note phải được sanitize/escape để không thực thi script khi render UI. | High | Security test |
| NFR-REL-01 | Thao tác publish/update/cancel schedule và tạo notification log phải nằm trong transaction; nếu tạo notification log lỗi thì schedule vẫn lưu nhưng log lỗi phải được ghi với status FAILED. | Medium | Integration test |
| NFR-USAB-01 | Tất cả message lỗi validate phải hiển thị bằng tiếng Việt và nêu đúng trường lỗi, ví dụ "Mô tả phải có ít nhất 20 ký tự". | Medium | UI test |
| NFR-USAB-02 | Resident phải truy cập được màn hình lịch từ dashboard trong tối đa 2 click sau khi đăng nhập. | Medium | Usability test |
| NFR-AVAIL-01 | Trong giai đoạn demo, hệ thống phải khởi động lại và phục hồi truy cập trong <= 5 phút sau khi restart server. | Low | Ops test |
| NFR-MAIN-01 | API documentation phải mô tả endpoint, method, auth role, request, response success và error cho tất cả API chính. | Medium | Doc review |
| NFR-COMP-01 | Giao diện web phải responsive ở width 390px, 768px và 1366px; không có bảng/nút bị che hoặc vỡ layout trên các màn hình chính. | Medium | UI test |

### 3.6 State Transition Rules

| Entity | From | Action | To | Actor được phép |
|--------|------|--------|-----|-----------------|
| Schedule | DRAFT | Publish | PUBLISHED | Manager |
| Schedule | PUBLISHED/UPDATED | Start collection | IN_PROGRESS | Collector được gán |
| Schedule | IN_PROGRESS | Complete with evidence | COMPLETED | Collector được gán |
| Schedule | PUBLISHED/UPDATED/IN_PROGRESS | Report delay/incident | DELAYED | Collector được gán / Manager |
| Schedule | DRAFT/PUBLISHED/UPDATED/DELAYED | Cancel with reason | CANCELLED | Manager |
| Complaint | SUBMITTED | Verify valid | VERIFIED | Manager |
| Complaint | SUBMITTED | Reject with reason | REJECTED | Manager |
| Complaint | VERIFIED | Assign collector | ASSIGNED | Manager |
| Complaint | ASSIGNED | Start handling | IN_PROGRESS | Collector được gán |
| Complaint | IN_PROGRESS | Resolve with evidence | RESOLVED_PENDING_APPROVAL | Collector được gán |
| Complaint | RESOLVED_PENDING_APPROVAL | Approve | CLOSED | Manager |

---

## 4. Use Case Specifications

Các use case dưới đây được rút từ use case diagrams nhóm cung cấp và được viết lại theo form có precondition, trigger, main flow, exception flow và postcondition để tester có thể tạo test case.

### Use Case Diagram - Resident

### Use Case Diagram - Collector

### Use Case Diagram - Manager

### Use Case Diagram - Admin

| Use Case ID | Name | Actor | Precondition | Trigger | Main Result | Exception |
|-------------|------|-------|--------------|---------|-------------|-----------|
| UC-RES-01 | View Collection Schedule | Resident | Resident đã đăng nhập và có active_area_id. | Resident mở Schedule. | Hệ thống hiển thị lịch theo khu vực và filter. | Nếu chưa có khu vực: yêu cầu cập nhật hồ sơ. |
| UC-RES-02 | Receive Reminder Notification | Resident | Resident bật notification; có lịch published/updated. | Đến thời điểm reminder. | Notification log được tạo/gửi, Resident xem được thông báo. | Nếu channel lỗi: log FAILED, không crash hệ thống. |
| UC-RES-03 | Submit Complaint | Resident | Resident đăng nhập. | Resident gửi form phản ánh hợp lệ. | Complaint SUBMITTED, có complaint_code. | Thiếu mô tả/ảnh sai định dạng: trả lỗi validate. |
| UC-RES-04 | Track Complaint Status | Resident | Complaint do Resident tạo tồn tại. | Resident mở chi tiết phản ánh. | Hiển thị timeline trạng thái và ảnh xử lý nếu có. | Nếu truy cập complaint của user khác: 403. |
| UC-RES-05 | Make Online Payment | Resident | Có invoice UNPAID. | Resident nhấn Pay và mock gateway trả result. | Invoice cập nhật PAID/FAILED/CANCELLED theo result. | Invoice PAID không được thanh toán lại. |
| UC-COL-01 | Check Daily Schedule | Collector | Collector đăng nhập. | Collector mở lịch hôm nay. | Hiển thị tuyến/lịch được gán trong ngày. | Không có lịch: hiển thị empty state. |
| UC-COL-02 | Update Collection Status | Collector | Lịch được gán cho Collector. | Collector cập nhật start/complete. | Status chuyển IN_PROGRESS/COMPLETED, lưu evidence khi complete. | Không có quyền hoặc thiếu evidence: trả lỗi. |
| UC-COL-03 | Report Incident | Collector | Collector có lịch/tuyến được gán. | Collector gửi sự cố. | Incident được ghi, lịch có thể chuyển DELAYED. | Mô tả quá ngắn: validate error. |
| UC-MAN-01 | Create Collection Schedule | Manager | Manager đăng nhập. | Manager nhập lịch và nhấn Save/Publish. | Lịch DRAFT/PUBLISHED được tạo, validate trùng lịch. | Trùng lịch hoặc thiếu collector: lỗi. |
| UC-MAN-02 | Assign Collection Route | Manager | Route và Collector ACTIVE tồn tại. | Manager gán route/schedule. | Collector thấy assignment. | Collector bị khóa: reject. |
| UC-MAN-03 | Manage Complaints | Manager | Có complaint SUBMITTED/VERIFIED. | Manager verify/assign/approve. | Complaint chuyển trạng thái hợp lệ. | Transition sai thứ tự: reject. |
| UC-MAN-04 | Generate Reports | Manager | Có quyền Manager. | Chọn date range và generate/export. | Hiển thị report và có thể export PDF. | Date range sai: validate error. |
| UC-ADM-01 | Manage Users | Admin | Admin đăng nhập. | Admin create/update/lock/delete user. | User cập nhật, audit log được ghi. | Email trùng hoặc role sai: reject. |
| UC-ADM-02 | Manage Roles | Admin | Admin đăng nhập. | Admin gán permission cho role. | Permission áp dụng cho API/UI sau lần đăng nhập tiếp theo. | Permission không tồn tại: reject. |
| UC-ADM-03 | Configure System | Admin | Admin đăng nhập. | Admin thay đổi reminder/payment/notification config. | Cấu hình lưu và audit log ghi nhận. | Giá trị ngoài enum: reject. |

### 4.1 Detailed Use Case: Submit Complaint

| Mục | Nội dung |
|-----|----------|
| Use Case ID | UC-RES-03 |
| Actor | Resident |
| Precondition | Resident đã đăng nhập, status ACTIVE, có active_area_id. |
| Main Flow | 1. Resident mở Complaint Form. 2. Nhập title, description, severity, location. 3. Đính kèm 0-3 ảnh hợp lệ. 4. Nhấn Submit. 5. Hệ thống validate input. 6. Hệ thống tạo complaint status SUBMITTED và complaint_code. 7. Hệ thống hiển thị mã phản ánh và ghi audit/event log. |
| Alternative Flow A1 | Ảnh không hợp lệ: hệ thống không tạo complaint, trả FILE_TYPE_NOT_ALLOWED hoặc FILE_TOO_LARGE. |
| Alternative Flow A2 | Description < 20 ký tự: hệ thống không tạo complaint, hiển thị lỗi "Mô tả phải có ít nhất 20 ký tự". |
| Postcondition | Complaint tồn tại trong DB với owner_id = Resident hiện tại; Manager nhìn thấy trong danh sách phản ánh mới. |

### 4.2 Detailed Use Case: Create Collection Schedule

| Mục | Nội dung |
|-----|----------|
| Use Case ID | UC-MAN-01 |
| Actor | Manager |
| Precondition | Manager đăng nhập; area, route, waste_type và Collector ACTIVE tồn tại. |
| Main Flow | 1. Manager mở Schedule Management. 2. Chọn area, route, waste_type, collector, collection_date, start_time, end_time. 3. Nhấn Save Draft hoặc Publish. 4. Hệ thống kiểm tra quyền và validate dữ liệu. 5. Hệ thống kiểm tra rule không trùng lịch. 6. Nếu hợp lệ, lưu lịch. 7. Nếu Publish, tạo notification log cho Resident thuộc khu vực. |
| Alternative Flow A1 | Lịch trùng: hệ thống trả SCHEDULE_OVERLAP, không lưu thay đổi. |
| Alternative Flow A2 | Collector bị khóa hoặc sai role: hệ thống trả INVALID_COLLECTOR. |
| Postcondition | Schedule được tạo với status DRAFT hoặc PUBLISHED; audit log được ghi. |

---

## 5. Requirement Traceability Matrix

| Requirement ID | Use Case | Suggested Test Case ID | Priority |
|----------------|----------|------------------------|----------|
| FR-RES-SCH-01 | UC-RES-01 | TC-SCH-001 | High |
| FR-RES-SCH-02 | UC-RES-01 | TC-SCH-002 | High |
| FR-RES-NOT-02 | UC-RES-02 | TC-NOT-001 | High |
| FR-RES-COM-01 | UC-RES-03 | TC-COM-001 | High |
| FR-RES-COM-04 | UC-RES-04 | TC-COM-SEC-001 | High |
| FR-RES-PAY-03 | UC-RES-05 | TC-PAY-001 | High |
| FR-COL-04 | UC-COL-02 | TC-COL-001 | High |
| FR-COL-05 | UC-COL-03 | TC-COL-INC-001 | High |
| FR-MAN-SCH-02 | UC-MAN-01 | TC-MAN-SCH-OVERLAP | High |
| FR-MAN-COM-03 | UC-MAN-03 | TC-MAN-COM-ASSIGN | High |
| FR-MAN-REP-02 | UC-MAN-04 | TC-REP-PDF-001 | Low |
| FR-ADM-USR-03 | UC-ADM-01 | TC-ADM-LOCK-001 | High |
| NFR-SEC-02 | All restricted UCs | TC-SEC-RBAC-001 | High |
| NFR-PER-01 | UC-RES-01 | TC-PER-SCH-001 | High |

---

## 6. Appendices

### Appendix A – SRS Quality Checklist

| Tiêu chí | Câu hỏi kiểm tra | Cách bản v1.0 đáp ứng |
|----------|------------------|----------------------|
| Clear | Yêu cầu có tránh từ mơ hồ như "nhanh", "dễ dùng", "hỗ trợ tốt" không? | Dùng số đo: 1000ms, 3 giây, 5MB, 20-1000 ký tự, status enum. |
| Complete | Yêu cầu có actor, input, điều kiện, output/response không? | FR được viết theo role/module, có điều kiện và kết quả hệ thống. |
| Consistent | Enum, role và trạng thái có thống nhất không? | Có Data Dictionary và State Transition Rules. |
| Testable | Tester có thể viết TC pass/fail không? | Mỗi FR có Verification: API/UI/DB/JMeter/Security. |
| Traceable | Yêu cầu có trace sang use case/test case không? | Có Requirement Traceability Matrix. |
| Feasible | Có loại bỏ scope quá lớn không? | GPS realtime, AI tối ưu tuyến và payment thật được đưa ra ngoài phạm vi v1.0. |

### Appendix B – Sample API Error Format

```json
{
  "error_code": "SCHEDULE_OVERLAP",
  "message": "Lịch thu gom bị trùng với lịch đã tồn tại trong cùng khu vực và loại rác.",
  "details": [{ "field": "start_time", "reason": "Overlaps with schedule SCH-2026-0001" }]
}
```

### Appendix C – Minimum Demo Test Data

| Data type | Minimum dataset for testing |
|-----------|----------------------------|
| Users | 1 Resident, 1 Collector, 1 Manager, 1 Admin, 1 locked user. |
| Areas | 2 khu vực: Phường A, Phường B. |
| Waste types | GENERAL, ORGANIC, RECYCLABLE, HAZARDOUS, BULKY. |
| Schedules | Ít nhất 1 DRAFT, 1 PUBLISHED, 1 UPDATED, 1 CANCELLED, 1 IN_PROGRESS, 1 COMPLETED, 1 DELAYED. |
| Complaints | Ít nhất 1 complaint ở mỗi status chính: SUBMITTED, ASSIGNED, IN_PROGRESS, CLOSED, REJECTED. |
| Invoices | 1 UNPAID, 1 PAID, 1 FAILED/PENDING. |

---

*Tài liệu chuyển đổi từ `SRS_EcoSchedule_IEEE830_Version1.docx` — Phiên bản v1.0, ngày 06/06/2026.*
