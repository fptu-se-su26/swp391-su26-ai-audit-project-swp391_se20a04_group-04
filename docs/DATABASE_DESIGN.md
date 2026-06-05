# EcoSchedule Database Design

## 1. Database Overview

EcoSchedule uses **Firebase Firestore** as the main database. Firestore is a NoSQL cloud database that stores data using the structure:

```text
Collection → Document → Fields
```

This database design supports four main roles in the system:

- resident
- collector
- manager
- admin

The database is designed to support the following core features:

- User registration and authentication
- Waste collection schedule lookup
- Waste collection route management
- Collector route assignment
- Environmental issue reporting
- Invoice and payment management
- User notifications
- Notification settings
- System activity logging

---

## 2. User Roles


| Role      | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| resident  | Resident who can search schedules, submit reports, receive notifications, and pay sanitation fees |
| collector | Waste collection staff who can view assigned routes and update collection status                  |
| manager   | Company manager who can create schedules, assign collectors, manage reports, and monitor routes   |
| admin     | System administrator who can manage users, companies, areas, fees, and system data                |


Allowed role values:

```text
resident
collector
manager
admin
```

---

## 3. Collection List


| Collection              | Purpose                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| `users`                 | Stores user account and profile information                                |
| `areas`                 | Stores administrative areas such as city, district, ward, and neighborhood |
| `waste_types`           | Stores waste category information                                          |
| `collection_companies`  | Stores waste collection company information                                |
| `routes`                | Stores waste collection route information                                  |
| `route_assignments`     | Stores collector assignments for routes                                    |
| `collection_schedules`  | Stores waste collection schedules                                          |
| `reports`               | Stores environmental reports submitted by residents                        |
| `report_comments`       | Stores report processing history and comments                              |
| `invoices`              | Stores sanitation fee invoices                                             |
| `payments`              | Stores payment transaction records                                         |
| `notifications`         | Stores user notifications                                                  |
| `notification_settings` | Stores user notification preferences                                       |
| `system_logs`           | Stores important system actions                                            |


---

## 4. Collection Schemas

---

## 4.1. `users`

Purpose: Store all user accounts and profile information.


| Field         | Type        | Description                                |
| ------------- | ----------- | ------------------------------------------ |
| uid           | string      | Firebase user ID, used as document ID      |
| fullName      | string      | User full name                             |
| email         | string      | User email address                         |
| phone         | string      | User phone number                          |
| role          | string      | User role                                  |
| status        | string      | Account status                             |
| emailVerified | boolean     | Whether the user has verified email        |
| city          | string      | User city                                  |
| district      | string      | User district                              |
| ward          | string      | User ward                                  |
| neighborhood  | string      | User neighborhood                          |
| address       | string      | Full user address                          |
| companyId     | string/null | Company ID if user is collector or manager |
| avatarUrl     | string      | User avatar URL                            |
| createdAt     | timestamp   | Created time                               |
| updatedAt     | timestamp   | Last updated time                          |


Example:

```json
{
  "uid": "resident_001",
  "fullName": "Nguyễn Văn A",
  "email": "resident@example.com",
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
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.2. `areas`

Purpose: Store administrative area data.


| Field        | Type        | Description                           |
| ------------ | ----------- | ------------------------------------- |
| areaId       | string      | Area document ID                      |
| name         | string      | Area name                             |
| type         | string      | city, district, ward, or neighborhood |
| parentId     | string/null | Parent area ID                        |
| city         | string      | City name                             |
| district     | string      | District name                         |
| ward         | string      | Ward name                             |
| neighborhood | string      | Neighborhood name                     |
| isActive     | boolean     | Whether the area is active            |
| createdAt    | timestamp   | Created time                          |


Example:

```json
{
  "areaId": "area_to_12",
  "name": "Tổ 12",
  "type": "neighborhood",
  "parentId": "ward_tho_quang",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "isActive": true,
  "createdAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.3. `waste_types`

Purpose: Store different waste categories.


| Field       | Type      | Description                      |
| ----------- | --------- | -------------------------------- |
| wasteTypeId | string    | Waste type document ID           |
| name        | string    | Waste type name                  |
| code        | string    | Waste type code                  |
| description | string    | Waste type description           |
| color       | string    | UI display color                 |
| isActive    | boolean   | Whether the waste type is active |
| createdAt   | timestamp | Created time                     |


Example:

```json
{
  "wasteTypeId": "waste_organic",
  "name": "Rác hữu cơ",
  "code": "ORGANIC",
  "description": "Rác dễ phân hủy như thức ăn thừa, rau củ.",
  "color": "green",
  "isActive": true,
  "createdAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.4. `collection_companies`

Purpose: Store waste collection company information.


| Field        | Type      | Description                 |
| ------------ | --------- | --------------------------- |
| companyId    | string    | Company document ID         |
| companyName  | string    | Company name                |
| phone        | string    | Company phone number        |
| email        | string    | Company email               |
| address      | string    | Company address             |
| managerId    | string    | User ID of company manager  |
| serviceAreas | array     | Areas served by the company |
| status       | string    | Company status              |
| createdAt    | timestamp | Created time                |
| updatedAt    | timestamp | Last updated time           |


Example:

```json
{
  "companyId": "company_001",
  "companyName": "Công ty Môi Trường Đô Thị Đà Nẵng",
  "phone": "0236xxxxxxx",
  "email": "contact@company.com",
  "address": "Đà Nẵng",
  "managerId": "manager_uid_001",
  "serviceAreas": ["Phường Thọ Quang", "Phường Mân Thái"],
  "status": "active",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.5. `routes`

Purpose: Store waste collection routes.


| Field         | Type      | Description                        |
| ------------- | --------- | ---------------------------------- |
| routeId       | string    | Route document ID                  |
| routeName     | string    | Route name                         |
| companyId     | string    | Related collection company ID      |
| city          | string    | City name                          |
| district      | string    | District name                      |
| wards         | array     | List of wards in the route         |
| neighborhoods | array     | List of neighborhoods in the route |
| startPoint    | map       | Start point location               |
| endPoint      | map       | End point location                 |
| status        | string    | Route status                       |
| createdBy     | string    | User ID who created the route      |
| createdAt     | timestamp | Created time                       |
| updatedAt     | timestamp | Last updated time                  |


Example:

```json
{
  "routeId": "route_001",
  "routeName": "Tuyến Sơn Trà 01",
  "companyId": "company_001",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "wards": ["Phường Thọ Quang", "Phường Mân Thái"],
  "neighborhoods": ["Tổ 12", "Tổ 7"],
  "startPoint": {
    "lat": 16.1123,
    "lng": 108.2456,
    "address": "Điểm bắt đầu"
  },
  "endPoint": {
    "lat": 16.1199,
    "lng": 108.2500,
    "address": "Điểm kết thúc"
  },
  "status": "active",
  "createdBy": "manager_uid_001",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.6. `route_assignments`

Purpose: Store collector assignments for collection routes.


| Field        | Type           | Description                             |
| ------------ | -------------- | --------------------------------------- |
| assignmentId | string         | Assignment document ID                  |
| routeId      | string         | Related route ID                        |
| collectorId  | string         | Assigned collector user ID              |
| companyId    | string         | Related company ID                      |
| assignedDate | date           | Assigned date                           |
| startTime    | string         | Start time                              |
| endTime      | string         | End time                                |
| vehicleCode  | string         | Vehicle code                            |
| status       | string         | Assignment status                       |
| startedAt    | timestamp/null | Time when collector starts route        |
| completedAt  | timestamp/null | Time when collector completes route     |
| createdBy    | string         | manager or admin who created assignment |
| createdAt    | timestamp      | Created time                            |
| updatedAt    | timestamp      | Last updated time                       |


Example:

```json
{
  "assignmentId": "assignment_001",
  "routeId": "route_001",
  "collectorId": "collector_uid_001",
  "companyId": "company_001",
  "assignedDate": "2026-06-10",
  "startTime": "17:00",
  "endTime": "19:00",
  "vehicleCode": "DN-TRUCK-01",
  "status": "assigned",
  "startedAt": null,
  "completedAt": null,
  "createdBy": "manager_uid_001",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.7. `collection_schedules`

Purpose: Store waste collection schedules by area, route, and waste type.


| Field        | Type      | Description                           |
| ------------ | --------- | ------------------------------------- |
| scheduleId   | string    | Schedule document ID                  |
| areaId       | string    | Related area ID                       |
| routeId      | string    | Related route ID                      |
| wasteTypeId  | string    | Related waste type ID                 |
| city         | string    | City name                             |
| district     | string    | District name                         |
| ward         | string    | Ward name                             |
| neighborhood | string    | Neighborhood name                     |
| scheduleDate | date      | Collection date                       |
| startTime    | string    | Collection start time                 |
| endTime      | string    | Collection end time                   |
| repeatType   | string    | none, daily, weekly, monthly          |
| repeatDays   | array     | Repeated days                         |
| status       | string    | Schedule status                       |
| note         | string    | Schedule note                         |
| createdBy    | string    | User ID who created the schedule      |
| updatedBy    | string    | User ID who last updated the schedule |
| createdAt    | timestamp | Created time                          |
| updatedAt    | timestamp | Last updated time                     |


Example:

```json
{
  "scheduleId": "schedule_001",
  "areaId": "area_to_12",
  "routeId": "route_001",
  "wasteTypeId": "waste_organic",
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "scheduleDate": "2026-06-10",
  "startTime": "17:00",
  "endTime": "19:00",
  "repeatType": "weekly",
  "repeatDays": ["Monday", "Wednesday", "Friday"],
  "status": "active",
  "note": "Đặt rác trước cổng trước 17:00",
  "createdBy": "manager_uid_001",
  "updatedBy": "manager_uid_001",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.8. `reports`

Purpose: Store environmental reports submitted by residents.


| Field        | Type           | Description                                      |
| ------------ | -------------- | ------------------------------------------------ |
| reportId     | string         | Report document ID                               |
| residentId   | string         | User ID of the resident who submitted the report |
| title        | string         | Report title                                     |
| description  | string         | Report description                               |
| category     | string         | Report category                                  |
| severity     | string         | Report severity                                  |
| imageUrls    | array          | Uploaded image URLs                              |
| location     | map            | Report location                                  |
| city         | string         | City name                                        |
| district     | string         | District name                                    |
| ward         | string         | Ward name                                        |
| neighborhood | string         | Neighborhood name                                |
| assignedTo   | string/null    | Collector assigned to handle the report          |
| assignedBy   | string/null    | manager or admin who assigned the report         |
| status       | string         | Report status                                    |
| createdAt    | timestamp      | Created time                                     |
| updatedAt    | timestamp      | Last updated time                                |
| resolvedAt   | timestamp/null | Resolved time                                    |


Example:

```json
{
  "reportId": "report_001",
  "residentId": "resident_uid_001",
  "title": "Rác tồn đọng trước cổng trường",
  "description": "Rác chưa được thu gom trong 2 ngày, gây mùi hôi.",
  "category": "garbage_overflow",
  "severity": "medium",
  "imageUrls": [],
  "location": {
    "lat": 16.1123,
    "lng": 108.2456,
    "address": "Tổ 12, Phường Thọ Quang, Sơn Trà, Đà Nẵng"
  },
  "city": "Thành phố Đà Nẵng",
  "district": "Quận Sơn Trà",
  "ward": "Phường Thọ Quang",
  "neighborhood": "Tổ 12",
  "assignedTo": "collector_uid_001",
  "assignedBy": "manager_uid_001",
  "status": "submitted",
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z",
  "resolvedAt": null
}
```

---

## 4.9. `report_comments`

Purpose: Store processing history and comments for reports.


| Field     | Type      | Description                   |
| --------- | --------- | ----------------------------- |
| commentId | string    | Comment document ID           |
| reportId  | string    | Related report ID             |
| userId    | string    | User who commented or updated |
| role      | string    | User role                     |
| message   | string    | Comment message               |
| imageUrls | array     | Attached image URLs           |
| action    | string    | Action type                   |
| createdAt | timestamp | Created time                  |


Example:

```json
{
  "commentId": "comment_001",
  "reportId": "report_001",
  "userId": "manager_uid_001",
  "role": "manager",
  "message": "Đã tiếp nhận phản ánh và giao cho nhân viên xử lý.",
  "imageUrls": [],
  "action": "assigned",
  "createdAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.10. `invoices`

Purpose: Store sanitation fee invoices.


| Field        | Type           | Description              |
| ------------ | -------------- | ------------------------ |
| invoiceId    | string         | Invoice document ID      |
| userId       | string         | Related user ID          |
| billingMonth | number         | Billing month            |
| billingYear  | number         | Billing year             |
| amount       | number         | Invoice amount           |
| currency     | string         | Currency                 |
| feeType      | string         | Fee type                 |
| status       | string         | Invoice status           |
| dueDate      | date           | Payment due date         |
| createdBy    | string         | User who created invoice |
| createdAt    | timestamp      | Created time             |
| updatedAt    | timestamp      | Last updated time        |
| paidAt       | timestamp/null | Paid time                |


Example:

```json
{
  "invoiceId": "invoice_001",
  "userId": "resident_uid_001",
  "billingMonth": 6,
  "billingYear": 2026,
  "amount": 50000,
  "currency": "VND",
  "feeType": "monthly_sanitation_fee",
  "status": "unpaid",
  "dueDate": "2026-06-25",
  "createdBy": "admin_uid_001",
  "createdAt": "2026-06-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z",
  "paidAt": null
}
```

---

## 4.11. `payments`

Purpose: Store payment transactions.


| Field           | Type           | Description                      |
| --------------- | -------------- | -------------------------------- |
| paymentId       | string         | Payment document ID              |
| invoiceId       | string         | Related invoice ID               |
| userId          | string         | Related user ID                  |
| amount          | number         | Payment amount                   |
| currency        | string         | Currency                         |
| method          | string         | Payment method                   |
| transactionCode | string         | Payment gateway transaction code |
| status          | string         | Payment status                   |
| gatewayResponse | map            | Response from payment gateway    |
| createdAt       | timestamp      | Created time                     |
| paidAt          | timestamp/null | Paid time                        |


Example:

```json
{
  "paymentId": "payment_001",
  "invoiceId": "invoice_001",
  "userId": "resident_uid_001",
  "amount": 50000,
  "currency": "VND",
  "method": "VNPay",
  "transactionCode": "VNPAY_123456789",
  "status": "success",
  "gatewayResponse": {
    "code": "00",
    "message": "Success"
  },
  "createdAt": "2026-06-10T09:58:00Z",
  "paidAt": "2026-06-10T10:00:00Z"
}
```

---

## 4.12. `notifications`

Purpose: Store notifications sent to users.


| Field          | Type           | Description                      |
| -------------- | -------------- | -------------------------------- |
| notificationId | string         | Notification document ID         |
| userId         | string         | Receiver user ID                 |
| title          | string         | Notification title               |
| content        | string         | Notification content             |
| type           | string         | Notification type                |
| link           | string         | Related frontend page            |
| isRead         | boolean        | Whether the notification is read |
| senderId       | string         | Sender user ID                   |
| senderRole     | string         | Sender role                      |
| senderName     | string         | Sender display name              |
| createdAt      | timestamp      | Created time                     |
| readAt         | timestamp/null | Read time                        |


Example:

```json
{
  "notificationId": "noti_001",
  "userId": "resident_uid_001",
  "title": "Lịch thu gom rác ngày mai",
  "content": "Ngày mai xe sẽ thu gom rác hữu cơ tại Tổ 12.",
  "type": "schedule",
  "link": "/tra-cuu",
  "isRead": false,
  "senderId": "manager_uid_001",
  "senderRole": "manager",
  "senderName": "Công ty Môi Trường",
  "createdAt": "2026-06-04T10:00:00Z",
  "readAt": null
}
```

---

## 4.13. `notification_settings`

Purpose: Store notification preferences for each user.


| Field            | Type      | Description                       |
| ---------------- | --------- | --------------------------------- |
| userId           | string    | User document ID                  |
| email            | boolean   | Enable email notification         |
| sms              | boolean   | Enable SMS notification           |
| push             | boolean   | Enable push notification          |
| scheduleReminder | boolean   | Enable schedule reminder          |
| paymentReminder  | boolean   | Enable payment reminder           |
| reportUpdate     | boolean   | Enable report update notification |
| systemNews       | boolean   | Enable system news                |
| updatedAt        | timestamp | Last updated time                 |


Example:

```json
{
  "userId": "resident_uid_001",
  "email": true,
  "sms": false,
  "push": true,
  "scheduleReminder": true,
  "paymentReminder": true,
  "reportUpdate": true,
  "systemNews": true,
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

---

## 4.14. `system_logs`

Purpose: Store important system activities for auditing.


| Field            | Type      | Description                   |
| ---------------- | --------- | ----------------------------- |
| logId            | string    | Log document ID               |
| userId           | string    | User who performed the action |
| role             | string    | User role                     |
| action           | string    | Action name                   |
| targetCollection | string    | Affected collection           |
| targetId         | string    | Affected document ID          |
| description      | string    | Action description            |
| createdAt        | timestamp | Created time                  |


Example:

```json
{
  "logId": "log_001",
  "userId": "admin_uid_001",
  "role": "admin",
  "action": "CREATE_SCHEDULE",
  "targetCollection": "collection_schedules",
  "targetId": "schedule_001",
  "description": "admin created a schedule for Tổ 12, Phường Thọ Quang.",
  "createdAt": "2026-06-04T10:00:00Z"
}
```

---

## 5. Database Relationships

Although Firestore is NoSQL, the system still uses reference IDs to represent relationships between collections.


| Relationship                                                   | Description                                    |
| -------------------------------------------------------------- | ---------------------------------------------- |
| `users.companyId` → `collection_companies.companyId`           | A collector or manager belongs to one company  |
| `collection_companies.managerId` → `users.uid`                 | A company has one manager                      |
| `routes.companyId` → `collection_companies.companyId`          | One company has many routes                    |
| `route_assignments.routeId` → `routes.routeId`                 | One route can have many assignments            |
| `route_assignments.collectorId` → `users.uid`                  | One collector can have many assignments        |
| `collection_schedules.areaId` → `areas.areaId`                 | One area can have many schedules               |
| `collection_schedules.routeId` → `routes.routeId`              | One route can have many schedules              |
| `collection_schedules.wasteTypeId` → `waste_types.wasteTypeId` | One waste type can appear in many schedules    |
| `reports.residentId` → `users.uid`                             | One resident can submit many reports           |
| `reports.assignedTo` → `users.uid`                             | One collector can handle many reports          |
| `report_comments.reportId` → `reports.reportId`                | One report can have many comments              |
| `invoices.userId` → `users.uid`                                | One user can have many invoices                |
| `payments.invoiceId` → `invoices.invoiceId`                    | One invoice can have many payment attempts     |
| `notifications.userId` → `users.uid`                           | One user can receive many notifications        |
| `notification_settings.userId` → `users.uid`                   | One user has one notification setting document |


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

## 7. Notes for Frontend Team

Frontend should not directly depend on Firestore collection details when possible. Instead, frontend should call backend APIs.

General API response format:

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

Important rules for frontend:

1. Use exact role values defined in this document.
2. Use exact status values defined in this document.
3. Do not create new status strings without confirming with backend.
4. For authenticated APIs, send Firebase token in the Authorization header.
5. Display user-friendly Vietnamese labels on the UI, but send English enum values to backend.

Example:

Frontend displays:

```text
Đang xử lý
```

But sends to backend:

```text
in_progress
```

---

## 8. Naming Convention

Collection names use lowercase snake_case:

```text
collection_schedules
route_assignments
report_comments
notification_settings
system_logs
```

Document ID fields use camelCase:

```text
scheduleId
routeId
reportId
notificationId
```

Status and enum values use lowercase snake_case:

```text
in_progress
garbage_overflow
missed_collection
```

Role values use lowercase:

```text
resident
collector
manager
admin
```

---

## 9. Important Notes

The current project should use only one user collection:

```text
users
```

The collection named:

```text
người dùng
```

should not be used in the final database design because using Vietnamese collection names can cause inconsistency and maintenance issues.

The recommended final user collection is:

```text
users
```

