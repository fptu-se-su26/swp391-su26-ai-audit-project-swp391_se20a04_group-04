# EcoSchedule Database Design

## 1. Overview

| Item                | Value                               |
| ------------------- | ----------------------------------- |
| Firebase Project ID | `swp391-database`                   |
| Database            | Cloud Firestore                     |
| Phạm vi triển khai  | **Quận Sơn Trà**, Thành phố Đà Nẵng |

EcoSchedule sử dụng **Firebase Firestore** (NoSQL). Cấu trúc:

```text
Collection → Document → Fields
```

### Phường thuộc Quận Sơn Trà (7 phường)

1. Phường An Hải Bắc
2. Phường An Hải Đông
3. Phường An Hải Tây
4. Phường Mân Thái
5. Phường Nại Hiên Đông
6. Phường Phước Mỹ
7. Phường Thọ Quang

### Tính năng chính

- Đăng ký và xác thực người dùng
- Tra cứu lịch thu gom rác
- Quản lý tuyến thu gom
- Phân công nhân viên thu gom
- Phản ánh môi trường
- Hóa đơn và thanh toán phí vệ sinh
- Thông báo và cài đặt thông báo
- Nhật ký hoạt động hệ thống

---

## 2. User Roles

| Role        | Mô tả                                                   |
| ----------- | ------------------------------------------------------- |
| `resident`  | Người dân: tra cứu lịch, gửi phản ánh, thanh toán       |
| `collector` | Nhân viên thu gom: xem tuyến, cập nhật tiến độ          |
| `manager`   | Quản lý công ty: lịch, tuyến, phân công, xử lý phản ánh |
| `admin`     | Quản trị hệ thống: user, danh mục, phí, báo cáo         |

Allowed role values:

```text
resident
collector
manager
admin
```

---

## 3. Collection List

| Collection              | Mục đích                                                   |
| ----------------------- | ---------------------------------------------------------- |
| `users`                 | Tài khoản và hồ sơ người dùng                              |
| `areas`                 | Khu vực hành chính (city → district → ward → neighborhood) |
| `waste_types`           | Loại rác thải                                              |
| `collection_companies`  | Công ty thu gom                                            |
| `routes`                | Tuyến thu gom                                              |
| `route_assignments`     | Phân công collector theo tuyến                             |
| `collection_schedules`  | Lịch thu gom theo khu vực                                  |
| `reports`               | Phản ánh môi trường                                        |
| `report_comments`       | Lịch sử xử lý phản ánh                                     |
| `invoices`              | Hóa đơn phí vệ sinh                                        |
| `payments`              | Giao dịch thanh toán                                       |
| `notifications`         | Thông báo người dùng                                       |
| `notification_settings` | Cài đặt nhận thông báo                                     |
| `system_logs`           | Nhật ký hệ thống                                           |

---

## 4. Collection Schemas

### 4.1 `users`

| Field         | Type        | Description                                       |
| ------------- | ----------- | ------------------------------------------------- |
| uid           | string (PK) | Firebase Auth UID, document ID                    |
| fullName      | string      | Họ tên                                            |
| email         | string      | Email                                             |
| phone         | string      | Số điện thoại                                     |
| role          | string      | `resident` \| `collector` \| `manager` \| `admin` |
| status        | string      | `active` \| `blocked` \| `inactive`               |
| emailVerified | boolean     | Email đã xác minh                                 |
| city          | string      | Thành phố                                         |
| district      | string      | Quận/huyện                                        |
| ward          | string      | Phường/xã                                         |
| neighborhood  | string      | Tổ dân phố                                        |
| address       | string      | Địa chỉ đầy đủ (tùy chọn)                         |
| companyId     | string/null | FK → `collection_companies` (collector, manager)  |
| avatarUrl     | string      | URL ảnh đại diện (tùy chọn)                       |
| createdAt     | timestamp   |                                                   |
| updatedAt     | timestamp   |                                                   |

Example:

```json
{
  "uid": "user_resident_001",
  "fullName": "Nguyễn Văn A",
  "email": "resident@ecoschedule.test",
  "phone": "0909123456",
  "role": "resident",
  "status": "active",
  "emailVerified": true,
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "address": "Tổ 12, Phường Thọ Quang, Quận Sơn Trà, Đà Nẵng",
  "companyId": null,
  "avatarUrl": "",
  "createdAt": "2026-06-01T08:00:00Z",
  "updatedAt": "2026-06-01T08:00:00Z"
}
```

### 4.2 `areas`

| Field     | Type        | Description                                      |
| --------- | ----------- | ------------------------------------------------ |
| areaId    | string (PK) |                                                  |
| name      | string      | Tên khu vực                                      |
| type      | string      | `city` \| `district` \| `ward` \| `neighborhood` |
| parentId  | string/null | FK → `areas.areaId`                              |
| city      | string      |                                                  |
| district  | string      |                                                  |
| ward      | string      |                                                  |
| isActive  | boolean     |                                                  |
| createdAt | timestamp   |                                                  |

Example:

```json
{
  "areaId": "area_neighborhood_tho_quang_to_12",
  "name": "Tổ 12",
  "type": "neighborhood",
  "parentId": "area_ward_tho_quang",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "isActive": true,
  "createdAt": "2026-06-01T00:00:00Z"
}
```

### 4.3 `waste_types`

| Field       | Type        | Description                           |
| ----------- | ----------- | ------------------------------------- |
| wasteTypeId | string (PK) |                                       |
| name        | string      |                                       |
| code        | string      | ORGANIC, RECYCLABLE, HAZARDOUS, BULKY |
| description | string      |                                       |
| color       | string      | Màu UI                                |
| isActive    | boolean     |                                       |
| createdAt   | timestamp   |                                       |

Example:

```json
{
  "wasteTypeId": "waste_organic",
  "name": "Rác hữu cơ",
  "code": "ORGANIC",
  "description": "Rác dễ phân hủy như thức ăn thừa, rau củ.",
  "color": "green",
  "isActive": true,
  "createdAt": "2026-06-01T00:00:00Z"
}
```

### 4.4 `collection_companies`

| Field        | Type        | Description                                 |
| ------------ | ----------- | ------------------------------------------- |
| companyId    | string (PK) |                                             |
| companyName  | string      |                                             |
| phone        | string      |                                             |
| email        | string      |                                             |
| address      | string      |                                             |
| managerId    | string      | FK → `users.uid`                            |
| serviceAreas | array       | Danh sách phường phục vụ (7 phường Sơn Trà) |
| status       | string      | `active` \| `inactive`                      |
| createdAt    | timestamp   |                                             |
| updatedAt    | timestamp   |                                             |

Example:

```json
{
  "companyId": "company_001",
  "companyName": "Công ty Môi Trường Đô Thị Sơn Trà",
  "phone": "02363888888",
  "email": "contact@moitruongsontra.vn",
  "address": "123 Võ Văn Kiệt, Quận Sơn Trà, Đà Nẵng",
  "managerId": "user_manager_001",
  "serviceAreas": [
    "Phường An Hải Bắc",
    "Phường An Hải Đông",
    "Phường An Hải Tây",
    "Phường Mân Thái",
    "Phường Nại Hiên Đông",
    "Phường Phước Mỹ",
    "Phường Thọ Quang"
  ],
  "status": "active",
  "createdAt": "2026-06-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

### 4.5 `routes`

| Field         | Type        | Description                 |
| ------------- | ----------- | --------------------------- |
| routeId       | string (PK) |                             |
| routeName     | string      |                             |
| companyId     | string      | FK → `collection_companies` |
| city          | string      |                             |
| district      | string      |                             |
| wards         | array       |                             |
| neighborhoods | array       |                             |
| startPoint    | map         | `{ lat, lng, address }`     |
| endPoint      | map         | `{ lat, lng, address }`     |
| status        | string      | `active` \| `inactive`      |
| createdBy     | string      | FK → `users.uid`            |
| createdAt     | timestamp   |                             |
| updatedAt     | timestamp   |                             |

Example:

```json
{
  "routeId": "route_son_tra_nam",
  "routeName": "Tuyến Nam Sơn Trà",
  "companyId": "company_001",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "wards": ["Phường Thọ Quang"],
  "neighborhoods": ["Tổ 7", "Tổ 12", "Tổ 15"],
  "startPoint": {
    "lat": 16.1123,
    "lng": 108.2456,
    "address": "Điểm bắt đầu - Thọ Quang"
  },
  "endPoint": {
    "lat": 16.1179,
    "lng": 108.2496,
    "address": "Điểm kết thúc - Thọ Quang"
  },
  "status": "active",
  "createdBy": "user_manager_001",
  "createdAt": "2026-06-02T00:00:00Z",
  "updatedAt": "2026-06-02T00:00:00Z"
}
```

### 4.6 `route_assignments`

| Field        | Type           | Description                                                            |
| ------------ | -------------- | ---------------------------------------------------------------------- |
| assignmentId | string (PK)    |                                                                        |
| routeId      | string         | FK → `routes`                                                          |
| collectorId  | string         | FK → `users.uid`                                                       |
| companyId    | string         | FK → `collection_companies`                                            |
| assignedDate | timestamp      |                                                                        |
| startTime    | string         | VD: `17:00`                                                            |
| endTime      | string         |                                                                        |
| vehicleCode  | string         |                                                                        |
| status       | string         | `assigned` \| `in_progress` \| `completed` \| `delayed` \| `cancelled` |
| startedAt    | timestamp/null |                                                                        |
| completedAt  | timestamp/null |                                                                        |
| createdBy    | string         | manager hoặc admin                                                     |
| createdAt    | timestamp      |                                                                        |
| updatedAt    | timestamp      |                                                                        |

### 4.7 `collection_schedules`

| Field        | Type        | Description                                         |
| ------------ | ----------- | --------------------------------------------------- |
| scheduleId   | string (PK) |                                                     |
| areaId       | string      | FK → `areas`                                        |
| routeId      | string      | FK → `routes`                                       |
| wasteTypeId  | string      | FK → `waste_types`                                  |
| city         | string      |                                                     |
| district     | string      |                                                     |
| ward         | string      |                                                     |
| neighborhood | string      |                                                     |
| scheduleDate | timestamp   |                                                     |
| startTime    | string      |                                                     |
| endTime      | string      |                                                     |
| repeatType   | string      | `none` \| `daily` \| `weekly` \| `monthly`          |
| repeatDays   | array       |                                                     |
| status       | string      | `active` \| `delayed` \| `cancelled` \| `completed` |
| note         | string      |                                                     |
| createdBy    | string      |                                                     |
| updatedBy    | string      |                                                     |
| createdAt    | timestamp   |                                                     |
| updatedAt    | timestamp   |                                                     |

**Legacy fields** (tương thích `scheduleService` hiện tại): `schedule_date`, `trash_type`, `time_slot`.

Example:

```json
{
  "scheduleId": "schedule_001",
  "areaId": "area_neighborhood_tho_quang_to_12",
  "routeId": "route_son_tra_nam",
  "wasteTypeId": "waste_organic",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "scheduleDate": "2026-06-10T17:00:00Z",
  "startTime": "17:00",
  "endTime": "19:00",
  "repeatType": "weekly",
  "repeatDays": ["Monday", "Wednesday", "Friday"],
  "status": "active",
  "note": "Đặt rác trước cổng trước 17:00",
  "schedule_date": "2026-06-10T17:00:00.000Z",
  "trash_type": "Rác hữu cơ (Sinh hoạt)",
  "time_slot": "17:00 - 19:00",
  "createdBy": "user_manager_001",
  "updatedBy": "user_manager_001",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

### 4.8 `reports`

| Field        | Type           | Description                                                                                         |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------- |
| reportId     | string (PK)    |                                                                                                     |
| citizenId    | string         | FK → `users.uid` (người gửi phản ánh)                                                               |
| title        | string         |                                                                                                     |
| description  | string         |                                                                                                     |
| category     | string         | `garbage_overflow`, `illegal_dumping`, ...                                                          |
| severity     | string         | `low` \| `medium` \| `high` \| `urgent`                                                             |
| imageUrls    | array          |                                                                                                     |
| location     | map            | `{ lat, lng, address }`                                                                             |
| city         | string         |                                                                                                     |
| district     | string         |                                                                                                     |
| ward         | string         |                                                                                                     |
| neighborhood | string         |                                                                                                     |
| assignedTo   | string/null    | FK → `users.uid` (collector)                                                                        |
| assignedBy   | string/null    | manager hoặc admin                                                                                  |
| status       | string         | `submitted` \| `received` \| `assigned` \| `in_progress` \| `resolved` \| `rejected` \| `cancelled` |
| createdAt    | timestamp      |                                                                                                     |
| updatedAt    | timestamp      |                                                                                                     |
| resolvedAt   | timestamp/null |                                                                                                     |

Example:

```json
{
  "reportId": "report_001",
  "citizenId": "user_resident_001",
  "title": "Rác tồn đọng trước cổng trường",
  "description": "Rác chưa được thu gom trong 2 ngày tại Tổ 12, Thọ Quang.",
  "category": "garbage_overflow",
  "severity": "medium",
  "imageUrls": [],
  "location": {
    "lat": 16.1123,
    "lng": 108.2456,
    "address": "Tổ 12, Phường Thọ Quang, Quận Sơn Trà, Đà Nẵng"
  },
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "assignedTo": "user_collector_001",
  "assignedBy": "user_manager_001",
  "status": "assigned",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-05T09:00:00Z",
  "resolvedAt": null
}
```

### 4.9 `report_comments`

| Field     | Type        | Description                                |
| --------- | ----------- | ------------------------------------------ |
| commentId | string (PK) |                                            |
| reportId  | string      | FK → `reports`                             |
| userId    | string      | FK → `users.uid`                           |
| role      | string      | Role tại thời điểm comment                 |
| message   | string      |                                            |
| imageUrls | array       |                                            |
| action    | string      | `assigned`, `in_progress`, `resolved`, ... |
| createdAt | timestamp   |                                            |

### 4.10 `invoices`

| Field        | Type           | Description                                                  |
| ------------ | -------------- | ------------------------------------------------------------ |
| invoiceId    | string (PK)    |                                                              |
| userId       | string         | FK → `users.uid`                                             |
| billingMonth | number         |                                                              |
| billingYear  | number         |                                                              |
| amount       | number         |                                                              |
| currency     | string         | `VND`                                                        |
| feeType      | string         |                                                              |
| status       | string         | `unpaid` \| `paid` \| `overdue` \| `cancelled` \| `refunded` |
| dueDate      | timestamp      |                                                              |
| createdBy    | string         |                                                              |
| createdAt    | timestamp      |                                                              |
| updatedAt    | timestamp      |                                                              |
| paidAt       | timestamp/null |                                                              |

### 4.11 `payments`

| Field           | Type           | Description                                                     |
| --------------- | -------------- | --------------------------------------------------------------- |
| paymentId       | string (PK)    |                                                                 |
| invoiceId       | string         | FK → `invoices`                                                 |
| userId          | string         | FK → `users.uid`                                                |
| amount          | number         |                                                                 |
| currency        | string         |                                                                 |
| method          | string         | `VNPay` \| `MoMo` \| `BankTransfer` \| `Cash`                   |
| transactionCode | string         |                                                                 |
| status          | string         | `pending` \| `success` \| `failed` \| `cancelled` \| `refunded` |
| gatewayResponse | map            |                                                                 |
| createdAt       | timestamp      |                                                                 |
| paidAt          | timestamp/null |                                                                 |

### 4.12 `notifications`

| Field          | Type           | Description                                                  |
| -------------- | -------------- | ------------------------------------------------------------ |
| notificationId | string (PK)    |                                                              |
| userId         | string         | FK → `users.uid`                                             |
| title          | string         |                                                              |
| content        | string         |                                                              |
| type           | string         | `schedule` \| `payment` \| `report` \| `system` \| `warning` |
| link           | string         | Route frontend                                               |
| isRead         | boolean        |                                                              |
| senderId       | string         |                                                              |
| senderRole     | string         |                                                              |
| senderName     | string         |                                                              |
| createdAt      | timestamp      |                                                              |
| readAt         | timestamp/null |                                                              |

**Legacy fields** (tương thích code hiện tại): `user_id`, `is_read`, `sent_at`, `sender_role`, `sender_name`.

### 4.13 `notification_settings`

| Field            | Type        | Description      |
| ---------------- | ----------- | ---------------- |
| userId           | string (PK) | FK → `users.uid` |
| email            | boolean     |                  |
| sms              | boolean     |                  |
| push             | boolean     |                  |
| scheduleReminder | boolean     |                  |
| paymentReminder  | boolean     |                  |
| reportUpdate     | boolean     |                  |
| systemNews       | boolean     |                  |
| updatedAt        | timestamp   |                  |

### 4.14 `system_logs`

| Field            | Type        | Description      |
| ---------------- | ----------- | ---------------- |
| logId            | string (PK) |                  |
| userId           | string      | FK → `users.uid` |
| role             | string      |                  |
| action           | string      |                  |
| targetCollection | string      |                  |
| targetId         | string      |                  |
| description      | string      |                  |
| createdAt        | timestamp   |                  |

---

## 5. Database Relationships

| Relationship                                                   | Description                         |
| -------------------------------------------------------------- | ----------------------------------- |
| `users.companyId` → `collection_companies.companyId`           | collector/manager thuộc một công ty |
| `collection_companies.managerId` → `users.uid`                 | Một công ty có một manager          |
| `routes.companyId` → `collection_companies.companyId`          | Một công ty có nhiều tuyến          |
| `route_assignments.routeId` → `routes.routeId`                 | Một tuyến có nhiều phân công        |
| `route_assignments.collectorId` → `users.uid`                  | Một collector có nhiều phân công    |
| `collection_schedules.areaId` → `areas.areaId`                 | Một khu vực có nhiều lịch           |
| `collection_schedules.routeId` → `routes.routeId`              | Một tuyến có nhiều lịch             |
| `collection_schedules.wasteTypeId` → `waste_types.wasteTypeId` | Một loại rác xuất hiện ở nhiều lịch |
| `reports.citizenId` → `users.uid`                              | Một resident gửi nhiều phản ánh     |
| `reports.assignedTo` → `users.uid`                             | Một collector xử lý nhiều phản ánh  |
| `report_comments.reportId` → `reports.reportId`                | Một phản ánh có nhiều comment       |
| `invoices.userId` → `users.uid`                                | Một user có nhiều hóa đơn           |
| `payments.invoiceId` → `invoices.invoiceId`                    | Một hóa đơn có nhiều giao dịch      |
| `notifications.userId` → `users.uid`                           | Một user nhận nhiều thông báo       |
| `notification_settings.userId` → `users.uid`                   | Một user có một cài đặt thông báo   |

---

## 6. Enum Values

### User Role

```text
resident
collector
manager
admin
```

### User Status

```text
active
blocked
inactive
```

### Schedule Status

```text
active
delayed
cancelled
completed
```

### Route Assignment Status

```text
assigned
in_progress
completed
delayed
cancelled
```

### Report Category

```text
garbage_overflow
missed_collection
illegal_dumping
bad_smell
hazardous_waste
other
```

### Report Severity

```text
low
medium
high
urgent
```

### Report Status

```text
submitted
received
assigned
in_progress
resolved
rejected
cancelled
```

### Invoice Status

```text
unpaid
paid
overdue
cancelled
refunded
```

### Payment Method

```text
VNPay
MoMo
BankTransfer
Cash
```

### Payment Status

```text
pending
success
failed
cancelled
refunded
```

### Notification Type

```text
schedule
payment
report
system
warning
```

---

## 7. Seed Database

Script: `.src/backend/scripts/seedDatabase.js`

```bash
cd .src/backend
npm run seed:full
```

Tài khoản demo (mật khẩu: `EcoSchedule@2026`):

| Role      | Email                         |
| --------- | ----------------------------- |
| resident  | `resident@ecoschedule.test`   |
| resident  | `resident2@ecoschedule.test`  |
| collector | `collector@ecoschedule.test`  |
| collector | `collector2@ecoschedule.test` |
| manager   | `manager@ecoschedule.test`    |
| admin     | `admin@ecoschedule.test`      |

Triển khai rules và indexes (chạy từ **thư mục gốc repo**):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Chi tiết: xem `docs/DATABASE_SEED.md`.

---

## 8. Notes for Frontend Team

Frontend nên gọi Backend API thay vì truy cập Firestore trực tiếp khi có thể.

Success response:

```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message"
}
```

Quy tắc quan trọng:

1. Dùng đúng role values trong tài liệu này.
2. Dùng đúng status/enum values đã định nghĩa.
3. Không tự tạo status string mới nếu chưa thống nhất với backend.
4. API cần auth: gửi Firebase token trong header `Authorization`.
5. UI hiển thị tiếng Việt, nhưng gửi enum tiếng Anh/snake_case lên backend.

Ví dụ: UI hiển thị `Đang xử lý`, backend nhận `in_progress`.

---

## 9. Naming Conventions

- Collection: `snake_case` (`collection_schedules`, `route_assignments`)
- Document ID field: `camelCase` (`scheduleId`, `reportId`)
- Role values: lowercase (`resident`, `collector`, `manager`, `admin`)
- Status/enum: `snake_case` (`in_progress`, `garbage_overflow`)

---

## 10. Important Notes

- Chỉ dùng collection `users` cho người dùng. Không dùng collection `người dùng`.
- Phạm vi dữ liệu hiện tại: **Quận Sơn Trà, Đà Nẵng** trên project `swp391-database`.
- Trường `reports.citizenId` tham chiếu user có `role = resident` (giữ tên theo ERD gốc).
