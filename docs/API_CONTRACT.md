# API Contract - EcoSchedule

## 1. Overview

This document describes all backend APIs available for the EcoSchedule project.

Frontend should call these APIs and send/receive data as described in this document.  
The project uses Firebase Authentication and Firebase Firestore through backend APIs.

The system roles are standardized as:

```text
resident
collector
manager
admin
```

---

## 2. Common Rules

### 2.1 Base URL

For local development:

```text
http://localhost:5000/api
```

Example:

```text
http://localhost:5000/api/auth/login
```

---

### 2.2 Authentication Header

For protected APIs, frontend must send Firebase token in the request header:

```http
Authorization: Bearer <firebase_token>
```

---

### 2.3 Standard Success Response

```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": {}
}
```

---

### 2.4 Standard Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

---

### 2.5 Standard Role Values

```text
resident
collector
manager
admin
```

---

## 3. Authentication APIs

---

### 3.1 Register

Create a new user account.

```http
POST /api/auth/register
```

Allowed role:

```text
all
```

Request body:

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "resident@example.com",
  "phone": "0909123456",
  "password": "123456",
  "role": "resident",
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "ward": "Thọ Quang",
  "neighborhood": "Tổ 12",
  "address": "Tổ 12, Phường Thọ Quang"
}
```

Success response:

```json
{
  "success": true,
  "message": "Register successfully. Please verify your email.",
  "data": {
    "uid": "firebase_uid_001",
    "email": "resident@example.com",
    "role": "resident"
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### 3.2 Login

Login using email and password.

```http
POST /api/auth/login
```

Allowed role:

```text
all
```

Request body:

```json
{
  "email": "resident@example.com",
  "password": "123456"
}
```

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "firebase_uid_001",
    "fullName": "Nguyễn Văn A",
    "email": "resident@example.com",
    "role": "resident",
    "token": "firebase_token_here"
  }
}
```

---

### 3.3 Google Login

Login or register using Google account.

```http
POST /api/auth/google-login
```

Allowed role:

```text
all
```

Request body:

```json
{
  "idToken": "firebase_google_id_token"
}
```

Success response:

```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "uid": "firebase_uid_001",
    "fullName": "Nguyễn Văn A",
    "email": "resident@example.com",
    "role": "resident",
    "token": "firebase_token_here"
  }
}
```

---

## 4. User APIs

---

### 4.1 Get Current User Profile

```http
GET /api/users/me
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "data": {
    "uid": "resident_001",
    "fullName": "Nguyễn Văn A",
    "email": "resident@example.com",
    "phone": "0909123456",
    "role": "resident",
    "status": "active",
    "city": "Đà Nẵng",
    "district": "Sơn Trà",
    "ward": "Thọ Quang",
    "neighborhood": "Tổ 12",
    "address": "Tổ 12, Phường Thọ Quang"
  }
}
```

---

### 4.2 Get User By ID

```http
GET /api/users/{uid}
```

Allowed role:

```text
manager, admin
```

Success response:

```json
{
  "success": true,
  "data": {
    "uid": "collector_001",
    "fullName": "Trần Văn B",
    "email": "collector@example.com",
    "phone": "0912345678",
    "role": "collector",
    "status": "active",
    "companyId": "company_001"
  }
}
```

---

### 4.3 Update User Profile

```http
PUT /api/users/{uid}
```

Allowed role:

```text
resident can update own account
collector can update own account
manager can update users in their company
admin can update all users
```

Request body:

```json
{
  "fullName": "Nguyễn Văn A Updated",
  "phone": "0909000000",
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "ward": "Thọ Quang",
  "neighborhood": "Tổ 12",
  "address": "Tổ 12, Phường Thọ Quang"
}
```

Success response:

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "uid": "resident_001",
    "fullName": "Nguyễn Văn A Updated",
    "phone": "0909000000"
  }
}
```

---

### 4.4 Update User Role

```http
PATCH /api/users/{uid}/role
```

Allowed role:

```text
admin
```

Request body:

```json
{
  "role": "collector"
}
```

Success response:

```json
{
  "success": true,
  "message": "User role updated successfully"
}
```

---

### 4.5 Update User Status

```http
PATCH /api/users/{uid}/status
```

Allowed role:

```text
admin
```

Request body:

```json
{
  "status": "blocked"
}
```

Success response:

```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

---

## 5. Address / Area APIs

---

### 5.1 Get Provinces / Cities

```http
GET /api/address/provinces
```

Allowed role:

```text
all
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "code": "48",
      "name": "Thành phố Đà Nẵng"
    }
  ]
}
```

---

### 5.2 Get Wards By Province

```http
GET /api/address/wards?provinceCode=48
```

Allowed role:

```text
all
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "code": "20194",
      "name": "Phường Thọ Quang"
    }
  ]
}
```

---

### 5.3 Create Area

```http
POST /api/areas
```

Allowed role:

```text
admin
```

Request body:

```json
{
  "name": "Tổ 12",
  "type": "neighborhood",
  "parentId": "ward_tho_quang",
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "ward": "Thọ Quang",
  "neighborhood": "Tổ 12"
}
```

Success response:

```json
{
  "success": true,
  "message": "Area created successfully",
  "data": {
    "areaId": "area_to_12"
  }
}
```

---

## 6. Collection Schedule APIs

---

### 6.1 Get Collection Schedules

Resident uses this API to search collection schedules by area.

```http
GET /api/schedules?city=Đà Nẵng&ward=Thọ Quang&neighborhood=Tổ 12
```

Allowed role:

```text
all
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "scheduleId": "schedule_001",
      "areaId": "area_to_12",
      "routeId": "route_001",
      "wasteTypeId": "waste_organic",
      "trashTypeName": "Rác hữu cơ",
      "city": "Đà Nẵng",
      "district": "Sơn Trà",
      "ward": "Thọ Quang",
      "neighborhood": "Tổ 12",
      "scheduleDate": "2026-06-10",
      "startTime": "17:00",
      "endTime": "19:00",
      "status": "active",
      "note": "Đặt rác trước cổng trước 17:00"
    }
  ]
}
```

---

### 6.2 Create Schedule

Manager or admin creates a new waste collection schedule.

```http
POST /api/schedules
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "areaId": "area_to_12",
  "routeId": "route_001",
  "wasteTypeId": "waste_organic",
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "ward": "Thọ Quang",
  "neighborhood": "Tổ 12",
  "scheduleDate": "2026-06-10",
  "startTime": "17:00",
  "endTime": "19:00",
  "repeatType": "weekly",
  "repeatDays": ["Monday", "Wednesday", "Friday"],
  "note": "Đặt rác trước cổng trước 17:00"
}
```

Success response:

```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "scheduleId": "schedule_001"
  }
}
```

---

### 6.3 Update Schedule

```http
PATCH /api/schedules/{scheduleId}
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "scheduleDate": "2026-06-11",
  "startTime": "18:00",
  "endTime": "20:00",
  "status": "delayed",
  "note": "Lịch thu gom bị trì hoãn do thời tiết."
}
```

Success response:

```json
{
  "success": true,
  "message": "Schedule updated successfully"
}
```

---

### 6.4 Delete Schedule

```http
DELETE /api/schedules/{scheduleId}
```

Allowed role:

```text
manager, admin
```

Success response:

```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

## 7. Waste Type APIs

---

### 7.1 Get Waste Types

```http
GET /api/waste-types
```

Allowed role:

```text
all
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "wasteTypeId": "waste_organic",
      "name": "Rác hữu cơ",
      "code": "ORGANIC",
      "description": "Rác dễ phân hủy như thức ăn thừa, rau củ.",
      "color": "green"
    }
  ]
}
```

---

### 7.2 Create Waste Type

```http
POST /api/waste-types
```

Allowed role:

```text
admin
```

Request body:

```json
{
  "name": "Rác hữu cơ",
  "code": "ORGANIC",
  "description": "Rác dễ phân hủy như thức ăn thừa, rau củ.",
  "color": "green"
}
```

Success response:

```json
{
  "success": true,
  "message": "Waste type created successfully",
  "data": {
    "wasteTypeId": "waste_organic"
  }
}
```

---

## 8. Company APIs

---

### 8.1 Get Collection Companies

```http
GET /api/companies
```

Allowed role:

```text
manager, admin
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "companyId": "company_001",
      "companyName": "Công ty Môi Trường Đô Thị Đà Nẵng",
      "phone": "0236xxxxxxx",
      "email": "contact@company.com",
      "address": "Đà Nẵng",
      "managerId": "manager_uid_001",
      "status": "active"
    }
  ]
}
```

---

### 8.2 Create Company

```http
POST /api/companies
```

Allowed role:

```text
admin
```

Request body:

```json
{
  "companyName": "Công ty Môi Trường Đô Thị Đà Nẵng",
  "phone": "0236xxxxxxx",
  "email": "contact@company.com",
  "address": "Đà Nẵng",
  "managerId": "manager_uid_001",
  "serviceAreas": ["Thọ Quang", "Mân Thái"]
}
```

Success response:

```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "companyId": "company_001"
  }
}
```

---

## 9. Route APIs

---

### 9.1 Get Routes

```http
GET /api/routes
```

Allowed role:

```text
collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "routeId": "route_001",
      "routeName": "Tuyến Sơn Trà 01",
      "companyId": "company_001",
      "city": "Đà Nẵng",
      "district": "Sơn Trà",
      "wards": ["Thọ Quang", "Mân Thái"],
      "neighborhoods": ["Tổ 12", "Tổ 7"],
      "status": "active"
    }
  ]
}
```

---

### 9.2 Create Route

```http
POST /api/routes
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "routeName": "Tuyến Sơn Trà 01",
  "companyId": "company_001",
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "wards": ["Thọ Quang", "Mân Thái"],
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
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Route created successfully",
  "data": {
    "routeId": "route_001"
  }
}
```

---

### 9.3 Update Route

```http
PATCH /api/routes/{routeId}
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "routeName": "Tuyến Sơn Trà 02",
  "status": "active"
}
```

Success response:

```json
{
  "success": true,
  "message": "Route updated successfully"
}
```

---

### 9.4 Delete Route

```http
DELETE /api/routes/{routeId}
```

Allowed role:

```text
manager, admin
```

Success response:

```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

---

## 10. Route Assignment APIs

---

### 10.1 Get My Assignments

Collector gets assigned routes.

```http
GET /api/route-assignments/my
```

Allowed role:

```text
collector
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "assignmentId": "assignment_001",
      "routeId": "route_001",
      "routeName": "Tuyến Sơn Trà 01",
      "collectorId": "collector_uid_001",
      "assignedDate": "2026-06-10",
      "startTime": "17:00",
      "endTime": "19:00",
      "vehicleCode": "DN-TRUCK-01",
      "status": "assigned"
    }
  ]
}
```

---

### 10.2 Create Route Assignment

Manager assigns route to collector.

```http
POST /api/route-assignments
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "routeId": "route_001",
  "collectorId": "collector_uid_001",
  "assignedDate": "2026-06-10",
  "startTime": "17:00",
  "endTime": "19:00",
  "vehicleCode": "DN-TRUCK-01"
}
```

Success response:

```json
{
  "success": true,
  "message": "Route assigned successfully",
  "data": {
    "assignmentId": "assignment_001"
  }
}
```

---

### 10.3 Update Assignment Status

Collector updates route assignment status.

```http
PATCH /api/route-assignments/{assignmentId}/status
```

Allowed role:

```text
collector
```

Request body:

```json
{
  "status": "in_progress"
}
```

Success response:

```json
{
  "success": true,
  "message": "Assignment status updated successfully"
}
```

---

## 11. Report APIs

---

### 11.1 Submit Report

Resident submits an environmental report.

```http
POST /api/reports
```

Allowed role:

```text
resident
```

Request body:

```json
{
  "title": "Rác tồn đọng",
  "description": "Rác chưa được thu gom trong 2 ngày",
  "category": "garbage_overflow",
  "severity": "medium",
  "imageUrls": [],
  "location": {
    "lat": 16.1123,
    "lng": 108.2456,
    "address": "Tổ 12, Thọ Quang"
  },
  "city": "Đà Nẵng",
  "district": "Sơn Trà",
  "ward": "Thọ Quang",
  "neighborhood": "Tổ 12"
}
```

Success response:

```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "reportId": "report_001",
    "status": "submitted"
  }
}
```

---

### 11.2 Get My Reports

```http
GET /api/reports/my
```

Allowed role:

```text
resident
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "reportId": "report_001",
      "title": "Rác tồn đọng",
      "category": "garbage_overflow",
      "severity": "medium",
      "status": "submitted",
      "createdAt": "2026-06-04T10:00:00Z"
    }
  ]
}
```

---

### 11.3 Get All Reports

```http
GET /api/reports
```

Allowed role:

```text
manager, admin
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "reportId": "report_001",
      "citizenId": "resident_uid_001",
      "title": "Rác tồn đọng",
      "category": "garbage_overflow",
      "severity": "medium",
      "status": "submitted"
    }
  ]
}
```

---

### 11.4 Assign Report

```http
PATCH /api/reports/{reportId}/assign
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "collectorId": "collector_uid_001"
}
```

Success response:

```json
{
  "success": true,
  "message": "Report assigned successfully"
}
```

---

### 11.5 Update Report Status

```http
PATCH /api/reports/{reportId}/status
```

Allowed role:

```text
collector, manager, admin
```

Request body:

```json
{
  "status": "resolved",
  "message": "Đã thu gom và dọn sạch khu vực.",
  "imageUrls": ["https://example.com/image.jpg"]
}
```

Success response:

```json
{
  "success": true,
  "message": "Report status updated successfully"
}
```

---

### 11.6 Get Report Comments

```http
GET /api/reports/{reportId}/comments
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "data": [
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
  ]
}
```

---

## 12. Invoice APIs

---

### 12.1 Get My Invoices

```http
GET /api/invoices/my
```

Allowed role:

```text
resident
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "invoiceId": "invoice_001",
      "billingMonth": 6,
      "billingYear": 2026,
      "amount": 50000,
      "currency": "VND",
      "status": "unpaid",
      "dueDate": "2026-06-25"
    }
  ]
}
```

---

### 12.2 Create Invoice

```http
POST /api/invoices
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "userId": "resident_uid_001",
  "billingMonth": 6,
  "billingYear": 2026,
  "amount": 50000,
  "currency": "VND",
  "feeType": "monthly_sanitation_fee",
  "dueDate": "2026-06-25"
}
```

Success response:

```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoiceId": "invoice_001"
  }
}
```

---

### 12.3 Update Invoice Status

```http
PATCH /api/invoices/{invoiceId}/status
```

Allowed role:

```text
manager, admin
```

Request body:

```json
{
  "status": "paid"
}
```

Success response:

```json
{
  "success": true,
  "message": "Invoice status updated successfully"
}
```

---

## 13. Payment APIs

---

### 13.1 Create Payment

Create payment transaction and return payment URL.

```http
POST /api/payments/create
```

Allowed role:

```text
resident
```

Request body:

```json
{
  "invoiceId": "invoice_001",
  "method": "VNPay"
}
```

Success response:

```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "paymentId": "payment_001",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

---

### 13.2 Get My Payments

```http
GET /api/payments/my
```

Allowed role:

```text
resident
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "paymentId": "payment_001",
      "invoiceId": "invoice_001",
      "amount": 50000,
      "currency": "VND",
      "method": "VNPay",
      "status": "success",
      "paidAt": "2026-06-10T10:00:00Z"
    }
  ]
}
```

---

### 13.3 Payment Callback

Payment gateway calls this API after payment.

```http
GET /api/payments/vnpay-return
```

Allowed role:

```text
payment gateway
```

Success response:

```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

## 14. Notification APIs

---

### 14.1 Get My Notifications

```http
GET /api/notifications/my
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "data": [
    {
      "notificationId": "noti_001",
      "userId": "resident_uid_001",
      "title": "Lịch thu gom rác ngày mai",
      "content": "Ngày mai xe sẽ thu gom rác hữu cơ tại Tổ 12.",
      "type": "schedule",
      "link": "/tra-cuu",
      "isRead": false,
      "createdAt": "2026-06-04T10:00:00Z"
    }
  ]
}
```

---

### 14.2 Mark Notification As Read

```http
PATCH /api/notifications/{notificationId}/read
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 14.3 Mark All Notifications As Read

```http
PATCH /api/notifications/read-all
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 14.4 Get Notification Settings

```http
GET /api/notification-settings
```

Allowed role:

```text
resident, collector, manager, admin
```

Success response:

```json
{
  "success": true,
  "data": {
    "userId": "resident_uid_001",
    "email": true,
    "sms": false,
    "push": true,
    "scheduleReminder": true,
    "paymentReminder": true,
    "reportUpdate": true,
    "systemNews": true
  }
}
```

---

### 14.5 Update Notification Settings

```http
PATCH /api/notification-settings
```

Allowed role:

```text
resident, collector, manager, admin
```

Request body:

```json
{
  "email": true,
  "sms": false,
  "push": true,
  "scheduleReminder": true,
  "paymentReminder": true,
  "reportUpdate": true,
  "systemNews": true
}
```

Success response:

```json
{
  "success": true,
  "message": "Notification settings updated successfully"
}
```

---

## 15. Dashboard APIs

---

### 15.1 Resident Dashboard

```http
GET /api/dashboard/resident
```

Allowed role:

```text
resident
```

Success response:

```json
{
  "success": true,
  "data": {
    "upcomingSchedules": 2,
    "unpaidInvoices": 1,
    "openReports": 1,
    "unreadNotifications": 3
  }
}
```

---

### 15.2 Collector Dashboard

```http
GET /api/dashboard/collector
```

Allowed role:

```text
collector
```

Success response:

```json
{
  "success": true,
  "data": {
    "todayAssignments": 3,
    "completedAssignments": 1,
    "pendingReports": 2
  }
}
```

---

### 15.3 Manager Dashboard

```http
GET /api/dashboard/manager
```

Allowed role:

```text
manager
```

Success response:

```json
{
  "success": true,
  "data": {
    "totalRoutes": 10,
    "activeCollectors": 20,
    "pendingReports": 5,
    "todaySchedules": 8
  }
}
```

---

### 15.4 Admin Dashboard

```http
GET /api/dashboard/admin
```

Allowed role:

```text
admin
```

Success response:

```json
{
  "success": true,
  "data": {
    "totalUsers": 500,
    "totalCompanies": 10,
    "totalReports": 120,
    "totalPayments": 300
  }
}
```

---

## 16. Enum Values Reference

### 16.1 Role Values

```text
resident
collector
manager
admin
```

---

### 16.2 User Status

```text
active
blocked
inactive
```

---

### 16.3 Schedule Status

```text
active
delayed
cancelled
completed
```

---

### 16.4 Route Assignment Status

```text
assigned
in_progress
completed
delayed
cancelled
```

---

### 16.5 Report Category

```text
garbage_overflow
missed_collection
illegal_dumping
bad_smell
hazardous_waste
other
```

---

### 16.6 Report Severity

```text
low
medium
high
urgent
```

---

### 16.7 Report Status

```text
submitted
received
assigned
in_progress
resolved
rejected
cancelled
```

---

### 16.8 Invoice Status

```text
unpaid
paid
overdue
cancelled
refunded
```

---

### 16.9 Payment Method

```text
VNPay
MoMo
BankTransfer
Cash
```

---

### 16.10 Payment Status

```text
pending
success
failed
cancelled
refunded
```

---

### 16.11 Notification Type

```text
schedule
payment
report
system
warning
```

---

## 17. Frontend Notes

Frontend should follow these rules:

1. Use exact role values:
   - `resident`
   - `collector`
   - `manager`
   - `admin`

2. Use exact enum/status values defined in this document.

3. Do not create new role or status strings without confirming with backend.

4. Use Vietnamese labels on UI, but send English enum values to backend.

Example:

Frontend displays:

```text
Đang xử lý
```

Frontend sends to backend:

```text
in_progress
```

5. For protected APIs, always send token:

```http
Authorization: Bearer <firebase_token>
```

6. Frontend should not directly access Firestore for protected data. Frontend should call backend APIs.

7. Backend will handle:
   - Firestore access
   - Role permission
   - Data validation
   - Security checks
   - Payment verification
