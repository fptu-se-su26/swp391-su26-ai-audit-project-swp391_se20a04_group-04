# ERD Diagram - EcoSchedule

## 1. Overview

This document contains the ERD / database diagram description for the EcoSchedule project.

EcoSchedule uses **Firebase Firestore**, so the database is designed using:

```text
Collection → Document → Fields
```

Although Firestore is a NoSQL database, this ERD shows the logical relationships between the main collections so that backend and frontend teams can understand how the data connects.

---

## 2. Main Collections

| Collection | Purpose |
|---|---|
| `users` | Stores user accounts and profile information |
| `areas` | Stores city, district, ward, and neighborhood information |
| `waste_types` | Stores waste category data |
| `collection_companies` | Stores waste collection company information |
| `routes` | Stores waste collection route information |
| `route_assignments` | Stores collector assignment data |
| `collection_schedules` | Stores garbage collection schedules |
| `reports` | Stores environmental reports submitted by residents |
| `report_comments` | Stores report processing history |
| `invoices` | Stores sanitation fee invoices |
| `payments` | Stores payment transaction records |
| `notifications` | Stores user notifications |
| `notification_settings` | Stores user notification preferences |
| `system_logs` | Stores important system activity logs |

---

## 3. ERD Code for Eraser

Copy the code below into Eraser to generate the database diagram.

```text
users [icon: user, color: blue] {
  uid string pk
  fullName string
  email string
  phone string
  role string
  status string
  emailVerified boolean
  city string
  district string
  ward string
  neighborhood string
  companyId string
  createdAt timestamp
  updatedAt timestamp
}

areas [icon: map-pin, color: orange] {
  areaId string pk
  name string
  type string
  parentId string
  city string
  district string
  ward string
  neighborhood string
  isActive boolean
  createdAt timestamp
}

waste_types [icon: trash, color: green] {
  wasteTypeId string pk
  name string
  code string
  description string
  color string
  isActive boolean
  createdAt timestamp
}

collection_companies [icon: building, color: purple] {
  companyId string pk
  companyName string
  phone string
  email string
  address string
  managerId string
  serviceAreas array
  status string
  createdAt timestamp
  updatedAt timestamp
}

routes [icon: map, color: orange] {
  routeId string pk
  routeName string
  companyId string
  city string
  district string
  wards array
  neighborhoods array
  startPoint map
  endPoint map
  status string
  createdBy string
  createdAt timestamp
  updatedAt timestamp
}

route_assignments [icon: truck, color: red] {
  assignmentId string pk
  routeId string
  collectorId string
  companyId string
  assignedDate date
  startTime string
  endTime string
  vehicleCode string
  status string
  startedAt timestamp
  completedAt timestamp
  createdBy string
  createdAt timestamp
  updatedAt timestamp
}

collection_schedules [icon: calendar, color: yellow] {
  scheduleId string pk
  areaId string
  routeId string
  wasteTypeId string
  city string
  district string
  ward string
  neighborhood string
  scheduleDate date
  startTime string
  endTime string
  repeatType string
  repeatDays array
  status string
  note string
  createdBy string
  updatedBy string
  createdAt timestamp
  updatedAt timestamp
}

reports [icon: alert-circle, color: red] {
  reportId string pk
  residentId string
  title string
  description string
  category string
  severity string
  imageUrls array
  location map
  city string
  district string
  ward string
  neighborhood string
  assignedTo string
  assignedBy string
  status string
  createdAt timestamp
  updatedAt timestamp
  resolvedAt timestamp
}

report_comments [icon: message-circle, color: orange] {
  commentId string pk
  reportId string
  userId string
  role string
  message string
  imageUrls array
  action string
  createdAt timestamp
}

invoices [icon: file-text, color: purple] {
  invoiceId string pk
  userId string
  billingMonth number
  billingYear number
  amount number
  currency string
  feeType string
  status string
  dueDate date
  createdBy string
  createdAt timestamp
  updatedAt timestamp
  paidAt timestamp
}

payments [icon: credit-card, color: green] {
  paymentId string pk
  invoiceId string
  userId string
  amount number
  currency string
  method string
  transactionCode string
  status string
  gatewayResponse map
  createdAt timestamp
  paidAt timestamp
}

notifications [icon: bell, color: blue] {
  notificationId string pk
  userId string
  title string
  content string
  type string
  link string
  isRead boolean
  senderId string
  senderRole string
  senderName string
  createdAt timestamp
  readAt timestamp
}

notification_settings [icon: settings, color: green] {
  userId string pk
  email boolean
  sms boolean
  push boolean
  scheduleReminder boolean
  paymentReminder boolean
  reportUpdate boolean
  systemNews boolean
  updatedAt timestamp
}

system_logs [icon: activity, color: red] {
  logId string pk
  userId string
  role string
  action string
  targetCollection string
  targetId string
  description string
  createdAt timestamp
}

users.companyId > collection_companies.companyId
collection_companies.managerId > users.uid
routes.companyId > collection_companies.companyId
routes.createdBy > users.uid
route_assignments.routeId > routes.routeId
route_assignments.collectorId > users.uid
route_assignments.companyId > collection_companies.companyId
route_assignments.createdBy > users.uid
collection_schedules.areaId > areas.areaId
collection_schedules.routeId > routes.routeId
collection_schedules.wasteTypeId > waste_types.wasteTypeId
collection_schedules.createdBy > users.uid
collection_schedules.updatedBy > users.uid
reports.residentId > users.uid
reports.assignedTo > users.uid
reports.assignedBy > users.uid
report_comments.reportId > reports.reportId
report_comments.userId > users.uid
invoices.userId > users.uid
invoices.createdBy > users.uid
payments.invoiceId > invoices.invoiceId
payments.userId > users.uid
notifications.userId > users.uid
notifications.senderId > users.uid
notification_settings.userId > users.uid
system_logs.userId > users.uid
```

---

## 4. Relationship Explanation

### 4.1 User Relationships

| Relationship | Meaning |
|---|---|
| `users.companyId` → `collection_companies.companyId` | A collector or manager belongs to one collection company |
| `collection_companies.managerId` → `users.uid` | One company has one manager |
| `notifications.userId` → `users.uid` | One user can receive many notifications |
| `notification_settings.userId` → `users.uid` | One user has one notification setting document |
| `system_logs.userId` → `users.uid` | One user can perform many system actions |

---

### 4.2 Route and Schedule Relationships

| Relationship | Meaning |
|---|---|
| `routes.companyId` → `collection_companies.companyId` | One company can manage many routes |
| `route_assignments.routeId` → `routes.routeId` | One route can have many assignments |
| `route_assignments.collectorId` → `users.uid` | One collector can have many assigned routes |
| `collection_schedules.routeId` → `routes.routeId` | One route can appear in many schedules |
| `collection_schedules.areaId` → `areas.areaId` | One area can have many collection schedules |
| `collection_schedules.wasteTypeId` → `waste_types.wasteTypeId` | One waste type can appear in many schedules |

---

### 4.3 Report Relationships

| Relationship | Meaning |
|---|---|
| `reports.residentId` → `users.uid` | One resident can submit many reports |
| `reports.assignedTo` → `users.uid` | One collector can be assigned to many reports |
| `reports.assignedBy` → `users.uid` | One manager/admin can assign many reports |
| `report_comments.reportId` → `reports.reportId` | One report can have many processing comments |
| `report_comments.userId` → `users.uid` | One user can write many report comments |

---

### 4.4 Invoice and Payment Relationships

| Relationship | Meaning |
|---|---|
| `invoices.userId` → `users.uid` | One resident can have many invoices |
| `payments.invoiceId` → `invoices.invoiceId` | One invoice can have many payment attempts |
| `payments.userId` → `users.uid` | One user can make many payments |

---

## 5. Role-Based Data Flow

### 5.1 Resident

A resident can:

- Register and login
- Search collection schedules
- Submit environmental reports
- View invoices
- Make payments
- Receive notifications

Related collections:

```text
users
collection_schedules
reports
invoices
payments
notifications
notification_settings
```

---

### 5.2 Collector

A collector can:

- View assigned routes
- Update route assignment status
- Handle assigned reports
- Add report comments
- Receive notifications

Related collections:

```text
users
routes
route_assignments
reports
report_comments
notifications
```

---

### 5.3 Manager

A manager can:

- Create and update collection schedules
- Create routes
- Assign collectors to routes
- Manage environmental reports
- Create invoices
- Monitor collectors and schedules

Related collections:

```text
users
collection_companies
routes
route_assignments
collection_schedules
reports
report_comments
invoices
notifications
system_logs
```

---

### 5.4 Admin

An admin can:

- Manage all users
- Manage companies
- Manage areas
- Manage waste types
- Manage schedules and routes
- Manage invoices and payments
- View system logs

Related collections:

```text
users
areas
waste_types
collection_companies
routes
route_assignments
collection_schedules
reports
invoices
payments
notifications
system_logs
```

---

## 6. Important Notes

1. This ERD is a logical database diagram for Firestore.
2. Firestore does not enforce foreign keys like SQL databases.
3. The relationships are handled by storing reference IDs such as `userId`, `routeId`, `companyId`, and `invoiceId`.
4. Backend must validate whether the referenced document exists before creating or updating records.
5. Frontend should not directly depend on Firestore relationships. Frontend should call backend APIs based on `API_CONTRACT.md`.
6. The agreed role values are:

```text
resident
collector
manager
admin
```

7. The collection named `người dùng` should not be used in the final database design. The standard collection name is:

```text
users
```
