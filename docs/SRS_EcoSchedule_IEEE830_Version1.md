# Software Requirements Specification

## EcoSchedule – Smart Waste Collection Management System for Urban Areas

*Theo IEEE Std 830-1998*

---

## Thông tin tài liệu

| Thông tin | Nội dung |
|-----------|----------|
| Tên tài liệu | Software Requirements Specification – EcoSchedule |
| Phiên bản | v1.1 – Cập nhật chuẩn hóa theo hệ thống thực tế |
| Ngày cập nhật | 20/07/2026 |
| Nhóm thực hiện | SWT301-05 / SE20A04 Group 4 |
| Môn học | SWP391 / SWT301 – Software Testing & Software Project |
| Tech stack thực tế | ReactJS (Vite/TailwindCSS) + Node.js (Express) + Firebase (Cloud Firestore & Auth) + PayOS VietQR + Google Gemini AI |
| Người phê duyệt | [Giảng viên / Product Owner] |

### Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 06/06/2026 | Nhóm SWT301-05 | Bản SRS đầu tiên |
| 1.1 | 20/07/2026 | SE20A04 Group 4 | Đọc và đối soát toàn bộ codebase: Cập nhật DB từ MySQL sang Firebase (Cloud Firestore & Auth), cập nhật cổng thanh toán PayOS VietQR thực tế, bổ sung Trợ lý AI Gemini (AIChatBox & AI Complaint Summary), tích hợp Google Maps hiển thị tuyến thu gom, làm sạch scope thông báo (In-App) và loại bỏ chức năng xuất PDF không có trong hệ thống. |

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

Tài liệu này đặc tả yêu cầu phần mềm cho EcoSchedule – hệ thống quản lý thu gom rác thông minh tại các khu đô thị/khu dân cư. Tài liệu được biên soạn dựa trên đúng kiến trúc và tính năng đang hoạt động thực tế trong dự án, làm căn cứ để thiết kế, lập kế hoạch kiểm thử, viết test case, kiểm thử nghiệm thu và đánh giá phạm vi đồ án.

Đối tượng sử dụng tài liệu: nhóm phát triển, nhóm kiểm thử, giảng viên, Product Owner giả định và các bên liên quan trong quá trình nghiệm thu môn học.

### 1.2 Scope

EcoSchedule là ứng dụng web (Web Application) hỗ trợ 4 vai trò chính: Resident (Cư dân), Collector (Nhân viên thu gom), Manager (Quản lý thu gom) và Admin (Quản trị viên hệ thống). Hệ thống tập trung vào quản lý lịch thu gom rác, phân tuyến thu gom trực quan với bản đồ Google Maps, hệ thống thông báo In-App, tiếp nhận và xử lý phản ánh môi trường, hỗ trợ thông minh bằng AI Gemini, và thanh toán phí vệ sinh trực tuyến qua cổng PayOS VietQR.

**Phạm vi chức năng trong bản v1.1 (Theo hệ thống thực tế)**

| Phạm vi | Mô tả cụ thể trong hệ thống |
|---------|-----------------------------|
| Lịch thu gom | Tạo, công bố, xem, lọc và cập nhật trạng thái lịch thu gom theo khu vực, tuyến, loại rác (GENERAL, ORGANIC, RECYCLABLE, HAZARDOUS, BULKY) và thời gian. |
| Thông báo In-App | Gửi và quản lý thông báo nhắc lịch, thay đổi lịch và thông báo hệ thống qua giao diện In-App Notifications (lưu trữ và đồng bộ thời gian thực trên Firebase Firestore). |
| Phản ánh môi trường | Resident gửi phản ánh kèm mô tả, khu vực, vị trí và ảnh bằng chứng; Manager xác minh, giao việc cho Collector; Collector tiếp nhận, xử lý và tải lên ảnh đối chứng hoàn thành. |
| Tuyến thu gom & Bản đồ | Manager tạo và phân tuyến thu gom cho Collector (RouteManager, TeamManager); hiển thị bản đồ tuyến đường và các điểm thu gom trực quan qua Google Maps JS API (`CollectionRouteMap`). |
| Thanh toán trực tuyến PayOS | Resident xem danh sách hóa đơn phí vệ sinh và thanh toán qua cổng thanh toán PayOS (mã VietQR tự động). Hệ thống kiểm tra, xác minh giao dịch thực tế (PAID/PENDING/CANCELLED) và xử lý lỗi đơn thanh toán đã tồn tại (mã lỗi 231). |
| Trợ lý AI & Phân tích thông minh | Tích hợp Google Gemini AI qua backend (`aiRoutes.js`): Cung cấp Trợ lý AI (`AIChatBox`) hỗ trợ Resident tra cứu thông tin/hướng dẫn phân loại rác, và công cụ `AIComplaintSummary` giúp Manager tổng hợp phân tích thông minh các phản ánh môi trường tồn đọng. |
| Quản trị & Phân quyền | Admin và Manager quản lý tài khoản người dùng, vai trò (RESIDENT, COLLECTOR, MANAGER, ADMIN), đội ngũ thu gom, tuyến đường, hóa đơn và giám sát hoạt động hệ thống. |

**Ngoài phạm vi (Out of Scope)**

| Ngoài phạm vi | Lý do |
|---------------|-------|
| Theo dõi GPS thời gian thực của xe rác ngoài bản đồ mô phỏng | Không có thiết bị phần cứng GPS/IoT thực tế gắn trên phương tiện trong phạm vi đồ án. |
| AI thuật toán tự động tối ưu đường đi (VRP/TSP) | Hệ thống hiện sử dụng Google Maps để hiển thị tuyến và điểm thu gom; thuật toán tự động tối ưu tuyến đường bằng AI là hướng phát triển tương lai. |
| Gửi tin nhắn qua cổng SMS / Zalo OA / Email bên thứ 3 | Hệ thống tập trung tối ưu trải nghiệm In-App Notifications lưu trực tiếp trên nền tảng Firebase Firestore. |
| Xuất báo cáo tập tin PDF | Báo cáo thống kê được trực quan hóa trực tiếp trên Dashboard tương tác của Manager (không hỗ trợ xuất file PDF). |

### 1.3 Definitions, Acronyms, and Abbreviations

| Thuật ngữ | Định nghĩa sử dụng trong tài liệu |
|-----------|----------------------------------|
| Resident | Cư dân/người dân sử dụng dịch vụ thu gom rác trong khu dân cư. |
| Collector | Nhân viên thu gom trực tiếp thực hiện tuyến thu gom hoặc xử lý phản ánh môi trường. |
| Manager | Ban quản lý/đơn vị vận hành thu gom, có quyền lập lịch, tạo tuyến, phân công đội ngũ và quản lý phản ánh. |
| Admin | Quản trị viên hệ thống, quản lý tài khoản, phân quyền và cấu hình hệ thống. |
| Schedule | Lịch thu gom cụ thể gồm ngày, khoảng thời gian, khu vực, tuyến, loại rác, collector phụ trách và trạng thái. |
| Route | Tuyến thu gom gồm danh sách khu vực/điểm thu gom được thể hiện trên Google Maps và gán cho Collector. |
| Complaint | Phản ánh môi trường do Resident gửi (rác tồn đọng, điểm tập kết quá tải, thu gom sót,...). |
| Evidence | Ảnh hoặc ghi chú bằng chứng trước/sau khi Collector xử lý phản ánh hoặc hoàn thành lịch thu gom. |
| In-App Notification | Thông báo nội bộ hiển thị trên giao diện ứng dụng web, lưu trên Firebase Cloud Firestore. |
| PayOS Gateway | Cổng thanh toán trực tuyến PayOS hỗ trợ sinh mã VietQR, chữ ký bảo mật HMAC SHA256 và xác nhận trạng thái thanh toán tự động (PAID/CANCELLED/PENDING). |
| Gemini AI Assistant | Trợ lý trí tuệ nhân tạo (Google Gemini API) hỗ trợ tương tác tự động với người dùng và tổng hợp dữ liệu phản ánh. |

### 1.4 References

| Tài liệu | Nội dung tham chiếu |
|----------|---------------------|
| IEEE Std 830-1998 | Recommended Practice for Software Requirements Specifications. |
| SWP391 Project Document | Hồ sơ dự án EcoSchedule – Nhóm 4 lớp SE20A04. |
| EcoSchedule Source Code | Cấu trúc mã nguồn ReactJS (`.src/frontend`), Node.js Express Backend (`.src/backend`), Firebase Firestore Config & Playwright E2E Tests. |
| PayOS API Documentation | Tài liệu tích hợp thanh toán VietQR & Webhook PayOS. |
| Google Gemini API Docs | Tài liệu tích hợp AI Chatbot & Text Summarization. |

### 1.5 Overview

Phần 2 mô tả tổng quan hệ thống, người dùng, môi trường vận hành và giả định. Phần 3 mô tả chi tiết các yêu cầu giao diện, từ điển dữ liệu, yêu cầu chức năng (gồm cả tính năng AI), phi chức năng, quy tắc nghiệp vụ và chuyển đổi trạng thái. Phần 4 đặc tả use case chính. Phần 5 chứa Ma trận truy vết yêu cầu (Traceability Matrix). Phần 6 là Phụ lục kiểm tra chất lượng SRS và dữ liệu mẫu.

---

## 2. Overall Description

### 2.1 Product Perspective

EcoSchedule được xây dựng theo kiến trúc Web Client-Server hiện đại. Frontend ReactJS (Vite, TailwindCSS) giao tiếp với Backend Node.js/Express thông qua REST API. Hệ thống sử dụng Firebase Cloud Firestore làm cơ sở dữ liệu NoSQL chính, Firebase Authentication để quản lý xác thực người dùng, cổng thanh toán trực tuyến PayOS VietQR và Google Gemini AI API cho các tính năng thông minh.

```text
[ Resident / Collector / Manager / Admin Client (ReactJS) ]
                            │
                   REST API (HTTPS/JSON)
                            │
               [ Backend Node.js / Express API ]
             ┌──────────────┼──────────────┬──────────────┐
             ▼              ▼              ▼              ▼
    [ Firebase Auth ]  [ Firestore DB ] [ PayOS API ] [ Gemini AI ]
```

| Thành phần | Trách nhiệm | Dữ liệu vào/ra chính |
|------------|-------------|----------------------|
| Frontend Web | Giao diện cho 4 vai trò (Resident, Collector, Manager, Admin), xử lý render UI, bản đồ Google Maps, chat AI và form thanh toán VietQR. | Request JSON đến API; nhận response JSON và render UI. |
| Backend API | Đảm nhận xác thực token, kiểm tra phân quyền (RBAC), xử lý logic lịch thu gom, phản ánh, thanh toán PayOS và gọi Gemini AI API. | HTTP Requests; trả Status Code & JSON chuẩn. |
| Firebase Cloud Firestore | Lưu trữ toàn bộ dữ liệu hệ thống (users, schedules, complaints, invoices, routes, notifications, audit_logs). | Collection / Document NoSQL với mã hóa và bảo mật real-time. |
| PayOS Payment Gateway | Khởi tạo đơn hàng, tạo mã VietQR, xác thực chữ ký HMAC SHA256 và kiểm tra trạng thái giao dịch thanh toán phí vệ sinh. | Input: invoice_id, amount; Output: checkoutUrl, qrCode, status (PAID/CANCELLED/PENDING). |
| Google Gemini AI Service | Cung cấp câu trả lời thông minh cho Resident qua AIChatBox và tự động tổng hợp báo cáo phản ánh cho Manager qua AIComplaintSummary. | Input: prompt / complaints list; Output: AI responses / text summary. |

### 2.2 Product Functions

| Nhóm chức năng | Mô tả chức năng thực tế |
|----------------|-------------------------|
| Authentication & Authorization | Đăng ký, đăng nhập (email/password), quên/đặt lại mật khẩu; phân quyền người dùng theo vai trò RESIDENT, COLLECTOR, MANAGER, ADMIN. |
| Resident Portal | Xem lịch thu gom rác theo khu vực cư trú, nhận thông báo In-App, xem và thanh toán hóa đơn phí vệ sinh qua PayOS VietQR, gửi phản ánh môi trường đính kèm vị trí/ảnh, tương tác với Trợ lý AI (`AIChatBox`). |
| Collector Portal | Xem lịch và tuyến thu gom được gán trong ngày (`AssignedReports`), cập nhật trạng thái thu gom (IN_PROGRESS, COMPLETED), tải ảnh đối chứng hoàn thành và báo cáo sự cố (DELAYED). |
| Manager Portal | Quản lý lịch thu gom (tạo, sửa, hủy, công bố), quản lý tuyến đường (`RouteManager`), phân công đội ngũ (`TeamManager`), duyệt và phân công phản ánh môi trường, tạo hóa đơn phí vệ sinh (`ManagerInvoice`), xem dashboard thống kê và báo cáo phân tích phản ánh AI (`AIComplaintSummary`). |
| Admin Portal | Quản lý tài khoản người dùng (tạo, cập nhật thông tin, thay đổi vai trò, khóa tài khoản), giám sát hoạt động hệ thống và cấu hình danh mục. |
| AI Assistant & Intelligence | Trợ lý AI tương tác trực tiếp với cư dân về phân loại rác và lịch trình; AI tự động tổng hợp dữ liệu phản ánh môi trường giúp Manager nắm bắt nhanh các điểm nóng rác thải. |

### 2.3 User Classes and Characteristics

| Role | Mô tả | Quyền chính | Tần suất sử dụng |
|------|-------|-------------|------------------|
| Resident | Cư dân sống trong khu đô thị/phường xã. | Xem lịch thu gom, nhận thông báo, thanh toán phí vệ sinh VietQR, gửi phản ánh rác thải, trò chuyện với Trợ lý AI. | Hàng ngày / Hàng tuần |
| Collector | Nhân viên thu gom rác / Tài xế xe rác. | Xem tuyến thu gom trong ngày, xem bản đồ Google Maps, cập nhật trạng thái công việc, upload ảnh bằng chứng, báo cáo sự cố. | Hàng ngày |
| Manager | Ban quản lý khu đô thị / Đơn vị môi trường. | Lập lịch thu gom, phân tuyến, quản lý đội ngũ, xác minh và phân công phản ánh, tạo hóa đơn thanh toán, xem thống kê AI. | Hàng ngày |
| Admin | Quản trị viên hệ thống. | Quản lý người dùng, phân quyền vai trò, khóa/mở khóa tài khoản, giám sát log hệ thống. | Theo nhu cầu vận hành |

### 2.4 Operating Environment

| Thành phần | Yêu cầu cụ thể |
|------------|----------------|
| Client Browser | Chrome 120+, Edge 120+, Firefox 120+, Safari 17+ (Desktop & Mobile Responsive). |
| Frontend Stack | ReactJS (Vite), TailwindCSS, Google Maps JS API. |
| Backend Stack | Node.js 20 LTS + Express REST API. |
| Database & Auth | Firebase Cloud Firestore & Firebase Authentication (Timezone: Asia/Ho_Chi_Minh). |
| Third-party APIs | PayOS Payment API (VietQR Payment Gateway), Google Gemini AI API. |
| Testing Environment | Playwright E2E Test Suite (`e2e-tests/`). |

### 2.5 Design and Implementation Constraints

| ID | Constraint testable |
|----|---------------------|
| CON-01 | Tất cả API nghiệp vụ phải sử dụng chuẩn JSON request/response và trả Content-Type = application/json (trừ API upload file sử dụng multipart/form-data). |
| CON-02 | Các API bảo mật yêu cầu đăng nhập phải kiểm tra Bearer JWT Token / Session hợp lệ trước khi thực hiện xử lý. |
| CON-03 | Mật khẩu người dùng được quản lý an toàn qua Firebase Auth / thuật toán mã hóa Bcrypt; tuyệt đối không lưu plain text trong cơ sở dữ liệu. |
| CON-04 | Dữ liệu thời gian trong lịch, hóa đơn và log được xử lý theo múi giờ chuẩn Vietnam Standard Time (Asia/Ho_Chi_Minh). |
| CON-05 | Khi gặp lỗi validate hoặc lỗi hệ thống, API phải trả status code HTTP phù hợp (400, 401, 403, 404, 500) kèm JSON mô tả lỗi rõ ràng (`error` / `message`). |
| CON-06 | Hệ thống sử dụng cổng thanh toán PayOS VietQR thực tế để sinh mã QR thanh toán và xác minh giao dịch; hệ thống thông báo sử dụng In-App Notifications lưu trữ trên Firebase Firestore. |

### 2.6 Assumptions and Dependencies

| ID | Assumption / Dependency | Ảnh hưởng kiểm thử |
|----|-------------------------|-------------------|
| ASM-01 | Dữ liệu ban đầu về khu vực, loại rác, tài khoản mẫu được seed sẵn trong Firebase Cloud Firestore để phục vụ kiểm thử. | Test suite cần sử dụng bộ dữ liệu mock/seed cố định. |
| ASM-02 | Mỗi Resident được liên kết với một khu vực cư trú (`area_id`) chính tại một thời điểm để nhận lịch và thông báo tương ứng. | Test lịch thu gom dựa trên thông tin `area_id` của user. |
| DEP-01 | Hệ thống phụ thuộc vào kết nối Internet tới dịch vụ Firebase Cloud Firestore & Firebase Auth. | Mất kết nối internet khiến API không thể đọc/ghi dữ liệu. |
| DEP-02 | Tính năng thanh toán phụ thuộc vào tính sẵn sàng của PayOS Payment Gateway API. | Lỗi API PayOS sẽ khiến tính năng tạo VietQR chuyển sang trạng thái chờ xử lý lại. |
| DEP-03 | Tính năng Trợ lý AI và Phân tích phản ánh phụ thuộc vào Google Gemini AI API key. | Nếu API Key hết hạn/lỗi quota, tính năng AI trả về thông báo lỗi thân thiện thay vì làm sập ứng dụng. |

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces

| Screen ID | Tên màn hình | Role | Yêu cầu hiển thị / Nhập liệu chính |
|-----------|--------------|------|-----------------------------------|
| UI-AUTH-01 | Màn hình Đăng nhập / Đăng ký / Quên mật khẩu | All | Email, password, thông tin cá nhân; hiển thị thông báo lỗi rõ ràng trên UI khi nhập sai. |
| UI-RES-01 | Resident Dashboard & Lịch thu gom (`/tra-cuu`) | Resident | Hiển thị danh sách lịch thu gom theo khu vực, bộ lọc từ ngày/đến ngày, loại rác, trạng thái thu gom. |
| UI-RES-02 | Phản ánh môi trường (`/phan-anh`) | Resident | Nhập tiêu đề, mô tả, chọn khu vực, mức độ nghiêm trọng, địa chỉ, tải lên ảnh chứng minh; xem danh sách phản ánh đã gửi. |
| UI-RES-03 | Thanh toán phí vệ sinh (`/thanh-toan`) | Resident | Danh sách hóa đơn, số tiền, hạn thanh toán; nút thanh toán mở mã QR VietQR PayOS và hiển thị kết quả giao dịch. |
| UI-RES-04 | Thông báo In-App (`/thong-bao`) | Resident | Danh sách thông báo nhắc lịch, thay đổi lịch; đánh dấu đã đọc; cấu hình bật/tắt nhắc lịch. |
| UI-AI-01 | Trợ lý AI Chatbot (`AIChatBox`) | Resident | Cửa sổ chat AI tự động hỗ trợ cư dân giải đáp thắc mắc về phân loại rác và hướng dẫn quy trình thu gom. |
| UI-COL-01 | Collector Dashboard (`/collector`) | Collector | Lịch làm việc trong ngày, danh sách tuyến/điểm thu gom được gán (`AssignedReports`), bản đồ Google Maps, nút cập nhật trạng thái (Bắt đầu, Hoàn thành), đính kèm ảnh đối chứng và báo sự cố. |
| UI-MAN-01 | Manager Dashboard & Quản lý lịch (`/dashboard`) | Manager | Tổng quan số liệu thu gom, tạo/sửa/hủy/công bố lịch thu gom, phân công Collector, quản lý tuyến (`RouteManager`), quản lý đội ngũ (`TeamManager`). |
| UI-MAN-02 | Quản lý Hóa đơn (`/dashboard/invoices/new`) | Manager | Lập hóa đơn phí vệ sinh cho từng khu vực/cư dân, thiết lập hạn thanh toán và đơn giá. |
| UI-MAN-03 | Phân tích phản ánh AI (`AIComplaintSummary`) | Manager | Giao diện tổng hợp thông minh do AI Gemini tự động phân tích từ các phản ánh tồn đọng của cư dân. |
| UI-ADM-01 | Admin Management Portal | Admin | Quản lý người dùng, phân quyền vai trò, mở/khóa tài khoản, giám sát log hệ thống. |

#### 3.1.2 API and Communication Interfaces

| ID | Requirement |
|----|-------------|
| API-01 | Đồng bộ base path API dạng `/api/v1` (hoặc `/api/schedules`, `/api/complaints`, `/api/invoices`, `/api/ai`). |
| API-02 | Format phản hồi chuẩn: Phản hồi thành công dạng `{ "success": true, "data": ... }` hoặc `{ "data": ... }`; Phản hồi lỗi dạng `{ "error": "Mô tả lỗi" }` kèm HTTP Status Code thích hợp. |
| API-03 | Mã HTTP Status Code chuẩn: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error). |
| API-04 | API thanh toán PayOS gọi trực tiếp `/api/invoices/:invoiceId/payment-request` và `/api/invoices/:invoiceId/verify-payment`. |
| API-05 | API AI gọi `/api/ai/chat` (cho Resident) và `/api/ai/complaints/summary` (cho Manager). |

### 3.2 Data Dictionary

Bảng cấu trúc dữ liệu chính lưu trữ trên nền tảng Firebase Cloud Firestore:

| Firestore Collection | Trường chính | Ý nghĩa kiểm thử |
|----------------------|--------------|------------------|
| `users` | uid, email, fullName, role, phone, areaId, status | Roles: `RESIDENT`, `COLLECTOR`, `MANAGER`, `ADMIN`. Status: `ACTIVE`, `LOCKED`. |
| `schedules` | id, areaId, routeId, wasteType, collectionDate, startTime, endTime, collectorId, status, note | Waste types: `GENERAL`, `ORGANIC`, `RECYCLABLE`, `HAZARDOUS`, `BULKY`. Statuses: `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DELAYED`. |
| `complaints` | id, residentId, title, description, areaId, locationText, severity, imageUrls, status, collectorId, rejectReason | Statuses: `SUBMITTED`, `VERIFIED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED_PENDING_APPROVAL`, `CLOSED`. |
| `invoices` | id, residentId, areaId, amount, period, dueDate, status, paidAt, checkoutUrl, qrCode | Statuses: `UNPAID`, `PENDING`, `PAID`, `CANCELLED`, `FAILED`. |
| `notifications` | id, userId, title, content, status, createdAt | Statuses: `UNREAD`, `READ`. Channel: In-App. |
| `routes` | id, routeName, areaId, collectionPoints | Danh sách các điểm thu gom hiển thị trên bản đồ Google Maps. |

### 3.3 Functional Requirements

#### 3.3.1 Authentication & Authorization

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-AUTH-01 | Người dùng đăng nhập thành công với email và mật khẩu đúng, hệ thống trả về JWT token/User session và điều hướng đúng Dashboard theo Role. | High | API/UI |
| FR-AUTH-02 | Khi người dùng đăng nhập sai email hoặc mật khẩu, hệ thống hiển thị thông báo lỗi thân thiện "Mật khẩu hoặc email không chính xác". | High | UI/API |
| FR-AUTH-03 | Đăng ký tài khoản Resident mới yêu cầu nhập đầy đủ thông tin: email, mật khẩu, họ tên, số điện thoại và khu vực cư trú (`areaId`). | High | UI/API |
| FR-AUTH-04 | Mật khẩu khi đăng ký phải đạt độ dài tối thiểu 6 ký tự; hệ thống từ chối nếu mật khẩu không đủ độ dài quy định. | High | UI/API |
| FR-AUTH-05 | Hệ thống kiểm tra quyền truy cập API theo Role (RBAC); từ chối truy cập HTTP 403 nếu tài khoản không đúng vai trò yêu cầu. | High | API |

#### 3.3.2 Resident – Collection Schedule & Routes

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-SCH-01 | Resident có thể xem danh sách lịch thu gom thuộc khu vực cư trú của mình, lọc theo khoảng thời gian và loại rác. | High | UI/API |
| FR-RES-SCH-02 | Màn hình lịch thu gom hiển thị chi tiết: ngày, khoảng giờ thu gom, loại rác, tên tuyến, người phụ trách và trạng thái thực hiện. | High | UI |
| FR-RES-SCH-03 | Hệ thống hiển thị trực quan các lịch đã công bố (`PUBLISHED`), đang thực hiện (`IN_PROGRESS`), đã hoàn thành (`COMPLETED`), bị hoãn (`DELAYED`) hoặc bị hủy (`CANCELLED`). | High | UI/DB |

#### 3.3.3 Resident – In-App Notifications

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-NOT-01 | Resident nhận được thông báo In-App khi lịch thu gom trong khu vực được công bố, điều chỉnh hoặc hủy bỏ. | High | UI/DB |
| FR-RES-NOT-02 | Resident có thể xem danh sách thông báo của mình tại trang `/thong-bao`, phân biệt thông báo chưa đọc/đã đọc và thực hiện thao tác "Đánh dấu đã đọc". | Medium | UI/API |
| FR-RES-NOT-03 | Resident có thể cấu hình bật/tắt nhận thông báo nhắc lịch thu gom rác trên giao diện cá nhân. | Medium | UI/API |

#### 3.3.4 Resident – Complaint Management

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-COM-01 | Resident có thể gửi phản ánh môi trường gồm: tiêu đề, nội dung chi tiết, khu vực, địa điểm cụ thể, mức độ ưu tiên (LOW, MEDIUM, HIGH) và ảnh bằng chứng. | High | UI/API |
| FR-RES-COM-02 | Khi gửi phản ánh thành công, hệ thống khởi tạo complaint ở trạng thái `SUBMITTED` và hiển thị mã phản ánh để Resident theo dõi tiến độ. | High | UI/DB |
| FR-RES-COM-03 | Resident chỉ được xem danh sách phản ánh do chính mình gửi; không thể truy cập thông tin phản ánh của người dùng khác. | High | API |

#### 3.3.5 Resident – VietQR Online Payment (PayOS Gateway)

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-RES-PAY-01 | Resident có thể xem danh sách hóa đơn phí vệ sinh của mình kèm thông tin kỳ phí, số tiền, hạn thanh toán và trạng thái (`UNPAID`, `PAID`, `PENDING`). | High | UI/API |
| FR-RES-PAY-02 | Khi Resident chọn thanh toán hóa đơn `UNPAID`, hệ thống gọi API PayOS để sinh mã VietQR và liên kết thanh toán (`checkoutUrl`). | High | UI/API |
| FR-RES-PAY-03 | Khi giao dịch thanh toán thành công qua PayOS, hệ thống cập nhật trạng thái hóa đơn thành `PAID`, lưu thời gian thanh toán và khóa không cho thanh toán lại. | High | UI/API/DB |
| FR-RES-PAY-04 | Hệ thống xử lý tự động trường hợp mã thanh toán đã tồn tại trên PayOS (mã lỗi 231) bằng cách tải lại thông tin VietQR/checkoutUrl cũ để Resident hoàn tất giao dịch. | Medium | UI/API |

#### 3.3.6 Collector – Schedule & Route Execution

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-COL-01 | Collector có thể xem danh sách nhiệm vụ/tuyến thu gom được phân công trong ngày trên màn hình `/collector` (`AssignedReports`). | High | UI/API |
| FR-COL-02 | Collector có thể xem vị trí các điểm thu gom trên bản đồ tương tác Google Maps (`CollectionRouteMap`). | Medium | UI |
| FR-COL-03 | Collector có thể cập nhật trạng thái thu gom sang `IN_PROGRESS` khi bắt đầu và sang `COMPLETED` khi hoàn thành (bắt buộc tải lên ảnh đối chứng). | High | UI/API |
| FR-COL-04 | Collector có thể gửi báo cáo sự cố (tắc đường, xe hỏng, điểm tập kết quá tải); lịch thu gom tương ứng tự động chuyển trạng thái `DELAYED`. | High | UI/API |

#### 3.3.7 Manager – Schedule, Route, Team & Complaint Management

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-MAN-SCH-01 | Manager có thể tạo, chỉnh sửa, hủy hoặc công bố (`PUBLISHED`) lịch thu gom rác theo khu vực, tuyến và phân công Collector phụ trách. | High | UI/API |
| FR-MAN-ROU-01 | Manager có thể quản lý danh sách tuyến thu gom (`RouteManager`) và phân công đội ngũ thu gom (`TeamManager`). | High | UI/API |
| FR-MAN-COM-01 | Manager có thể tiếp nhận danh sách phản ánh, thực hiện xác minh (`VERIFIED`), từ chối (`REJECTED`) hoặc giao việc cho Collector (`ASSIGNED`). | High | UI/API |
| FR-MAN-INV-01 | Manager có thể lập hóa đơn phí vệ sinh cho cư dân (`/dashboard/invoices/new`) và theo dõi tình hình thu phí. | High | UI/API |
| FR-MAN-REP-01 | Manager có thể xem Dashboard thống kê số liệu tổng quan: tổng số lịch, tỷ lệ hoàn thành, số phản ánh môi trường theo trạng thái và tổng doanh thu. | Medium | UI/API |

#### 3.3.8 Admin – User & System Administration

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-ADM-USR-01 | Admin có thể tạo tài khoản mới cho Collector, Manager hoặc Admin với email, tên và vai trò xác định. | High | UI/API |
| FR-ADM-USR-02 | Admin có thể cập nhật thông tin người dùng, thay đổi vai trò hoặc thực hiện khóa/mở khóa tài khoản (`ACTIVE` / `LOCKED`). | High | UI/API |

#### 3.3.9 AI Assistant & Complaint Intelligence (Google Gemini AI)

| ID | Requirement | Priority | Verification |
|----|-------------|----------|--------------|
| FR-AI-01 | **Trợ lý AI Chatbot (`AIChatBox`)**: Resident có thể trò chuyện với Trợ lý AI trên giao diện web để nhận tư vấn phân loại rác, giải đáp thắc mắc dịch vụ và hướng dẫn tra cứu lịch thu gom. | High | UI/API |
| FR-AI-02 | **Phân tích phản ánh AI (`AIComplaintSummary`)**: Manager có thể xem báo cáo tổng hợp thông minh do Gemini AI tự động phân tích từ danh sách phản ánh môi trường tồn đọng của cư dân. | High | UI/API |

---

## 3.4 Business Rules

| Rule ID | Tên quy tắc | Phát biểu rõ ràng | Xử lý vi phạm |
|---------|-------------|-------------------|---------------|
| BR-SCH-01 | Không trùng lịch | Hai lịch thu gom chưa bị hủy trong cùng một khu vực và cùng loại rác không được trùng khoảng thời gian. | Từ chối tạo/cập nhật lịch, hiển thị thông báo lỗi trùng lịch. |
| BR-COM-01 | Hoàn thành phản ánh | Complaint chỉ được chuyển trạng thái `RESOLVED` / `CLOSED` khi Collector đã tải lên ít nhất 01 ảnh bằng chứng xử lý. | Bắt buộc upload ảnh trước khi cập nhật hoàn tất. |
| BR-PAY-01 | Thanh toán hóa đơn | Hóa đơn đã ở trạng thái `PAID` không cho phép khởi tạo lại giao dịch thanh toán. | Chặn thao tác thanh toán lại, thông báo hóa đơn đã được thanh toán. |
| BR-AI-01 | Bảo mật dữ liệu AI | API Chatbot AI chỉ nhận và trả lời các câu hỏi liên quan tới quản lý rác thải, lịch trình và hướng dẫn sử dụng hệ thống EcoSchedule. | Giới hạn System Prompt Gemini AI. |

---

## 3.5 Non-Functional Requirements

| ID | Yêu cầu đo lường được | Priority | Verification |
|----|-----------------------|----------|--------------|
| NFR-PER-01 | 95% số request GET API tra cứu lịch thu gom phản hồi trong thời gian <= 1000ms trong điều kiện vận hành chuẩn. | High | Performance Test |
| NFR-PER-02 | Màn hình Resident Dashboard render dữ liệu hoàn tất trong vòng <= 3 giây đối với bộ dữ liệu demo. | Medium | UI Test |
| NFR-SEC-01 | Tất cả mật khẩu người dùng phải được bảo mật qua thuật toán mã hóa của Firebase Auth / Bcrypt hash. DB không lưu mật khẩu dạng plain-text. | High | DB Audit |
| NFR-SEC-02 | Các API nghiệp vụ giới hạn vai trò phải kiểm tra phân quyền RBAC chặt chẽ; truy cập trái quyền trả về HTTP Status 403 Forbidden. | High | Security Test |
| NFR-USAB-01 | Giao diện web hỗ trợ thiết kế Responsive đầy đủ trên các độ phân giải màn hình Desktop (1366px+), Tablet (768px) và Mobile (390px). | High | Responsive UI Test |
| NFR-TEST-01 | Toàn bộ các luồng chức năng chính (Đăng nhập, Tra cứu lịch, Gửi phản ánh, Collector cập nhật công việc, PayOS payment) được phủ tự động bằng Playwright E2E Tests. | High | Playwright Test Suite |

---

## 3.6 State Transition Rules

### Chuyển đổi trạng thái Lịch thu gom (Schedule Status)

```text
  [ DRAFT ] ──(Publish)──> [ PUBLISHED ] ──(Start)──> [ IN_PROGRESS ]
      │                         │                          │
   (Cancel)                  (Cancel / Delay)          (Complete)
      │                         │                          │
      ▼                         ▼                          ▼
 [ CANCELLED ]             [ DELAYED ]               [ COMPLETED ]
```

### Chuyển đổi trạng thái Phản ánh môi trường (Complaint Status)

```text
 [ SUBMITTED ] ──(Verify)──> [ VERIFIED ] ──(Assign)──> [ ASSIGNED ]
       │                         │                           │
   (Reject)                      └───────────┐               │
       │                                     ▼               ▼
       ▼                             [ IN_PROGRESS ] ──> [ CLOSED ]
  [ REJECTED ]
```

---

## 4. Use Case Specifications

### Danh sách Use Cases tổng quát

| Use Case ID | Tên Use Case | Actor chính | Mô tả kết quả chính |
|-------------|--------------|-------------|---------------------|
| UC-RES-01 | Tra cứu lịch thu gom | Resident | Hiển thị danh sách lịch thu gom rác theo khu vực và bộ lọc. |
| UC-RES-02 | Gửi phản ánh môi trường | Resident | Khởi tạo phản ánh rác thải đính kèm thông tin vị trí và ảnh bằng chứng. |
| UC-RES-03 | Thanh toán phí vệ sinh VietQR | Resident | Khởi tạo mã VietQR PayOS và hoàn tất thanh toán hóa đơn. |
| UC-RES-04 | Trò chuyện với Trợ lý AI | Resident | Nhận phản hồi tư vấn phân loại rác và hướng dẫn từ AIChatBox. |
| UC-COL-01 | Xem và thực hiện tuyến thu gom | Collector | Xem điểm thu gom trên Google Maps, cập nhật status và upload ảnh đối chứng. |
| UC-COL-02 | Báo cáo sự cố thu gom | Collector | Gửi báo cáo sự cố khiến lịch thu gom chuyển trạng thái `DELAYED`. |
| UC-MAN-01 | Lập và công bố lịch thu gom | Manager | Tạo, chỉnh sửa, chọn Collector và công bố lịch thu gom cho cư dân. |
| UC-MAN-02 | Quản lý tuyến và đội ngũ | Manager | Quản lý thông tin tuyến thu gom (`RouteManager`) và phân công đội ngũ (`TeamManager`). |
| UC-MAN-03 | Phân tích phản ánh bằng AI | Manager | Xem báo cáo tổng hợp thông minh `AIComplaintSummary` do Gemini AI phân tích. |
| UC-ADM-01 | Quản lý tài khoản người dùng | Admin | Tạo tài khoản, phân quyền vai trò và khóa/mở khóa người dùng trong hệ thống. |

---

## 5. Requirement Traceability Matrix

| Requirement ID | Use Case ID | Test Case tham chiếu | Priority |
|----------------|-------------|----------------------|----------|
| FR-AUTH-01 | UC-ADM-01 | `auth.spec.js` | High |
| FR-RES-SCH-01 | UC-RES-01 | `schedule.spec.js` | High |
| FR-RES-COM-01 | UC-RES-02 | `complaint.spec.js` | High |
| FR-RES-PAY-02 | UC-RES-03 | `payment.spec.js` | High |
| FR-AI-01 | UC-RES-04 | `ai-chat.spec.js` | High |
| FR-COL-01 | UC-COL-01 | `collector.spec.js` | High |
| FR-COL-04 | UC-COL-02 | `collector-incident.spec.js` | High |
| FR-MAN-SCH-01 | UC-MAN-01 | `manager.spec.js` | High |
| FR-MAN-ROU-01 | UC-MAN-02 | `route.spec.js` | High |
| FR-AI-02 | UC-MAN-03 | `ai-summary.spec.js` | High |
| FR-ADM-USR-01 | UC-ADM-01 | `admin.spec.js` | High |

---

## 6. Appendices

### Appendix A – SRS Compliance & Verification Checklist

| Tiêu chí | Nội dung kiểm tra | Đạt được trong bản v1.1 |
|----------|-------------------|------------------------|
| Accuracy (Chính xác) | Tài liệu mô tả đúng 100% tính năng đang hoạt động trong mã nguồn? | **ĐẠT** – Đã cập nhật đúng tech stack Firebase, PayOS VietQR, Google Gemini AI và Google Maps. |
| Completeness (Đầy đủ) | Có mô tả đầy đủ 4 vai trò người dùng và các tính năng AI không? | **ĐẠT** – Đã bổ sung chi tiết tính năng AIChatBox và AIComplaintSummary. |
| Consistency (Nhất quán) | Thuật ngữ, vai trò và trạng thái có đồng bộ xuyên suốt không? | **ĐẠT** – Thống nhất các trạng thái Schedule, Complaint, Payment và Role. |
| Realism (Thực tế) | Đã loại bỏ các mục không có trong hệ thống thực tế? | **ĐẠT** – Đã loại bỏ MySQL, xuất PDF, SMS gateway và GPS realtime. |

---

*Tài liệu SRS EcoSchedule IEEE 830 – Version 1.1 (Cập nhật ngày 20/07/2026).*
