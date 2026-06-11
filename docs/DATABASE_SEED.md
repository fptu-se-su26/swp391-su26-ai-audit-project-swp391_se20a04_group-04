# Hướng dẫn khởi tạo Database Firebase (EcoSchedule)

| | |
|---|---|
| **Project ID** | `swp391-database` |
| **Phạm vi** | Quận Sơn Trà, Đà Nẵng (7 phường) |

## Yêu cầu trước khi chạy

1. **Firebase Project** đã tạo và bật **Firestore Database** (chế độ Production hoặc Test).
2. **Service Account Key** từ Firebase Console:
   - Project Settings → Service accounts → Generate new private key
   - Lưu file tại: `.src/backend/serviceAccountKey.json` (không commit lên Git)
3. Hoặc cấu hình biến môi trường trong `.src/backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_API_KEY=your-web-api-key
PORT=5000
```

## Chạy seed

```bash
cd .src/backend
npm install
npm run seed:full
```

| Lệnh | Mô tả |
|------|-------|
| `npm run seed` | Ghi dữ liệu (không xóa cũ, không tạo Auth) |
| `npm run seed:clear` | Xóa toàn bộ 14 collections rồi seed lại |
| `npm run seed:full` | Xóa + seed + tạo 4 tài khoản Firebase Auth demo |

## Dữ liệu được tạo (Quận Sơn Trà)

| Collection | Số document | Ghi chú |
|------------|-------------|---------|
| waste_types | 4 | Hữu cơ, tái chế, nguy hại, cồng kềnh |
| areas | ~30 | 1 TP + 1 quận + 7 phường + ~18 tổ dân phố |
| users | 6 | 2 resident, 2 collector, 1 manager, 1 admin |
| collection_companies | 1 | Công ty Môi Trường Đô Thị Sơn Trà |
| routes | 4 | Bắc / Tây / Đông / Nam Sơn Trà |
| route_assignments | 4 | Phân công 2 collector |
| collection_schedules | ~21 | Lịch theo phường + tổ (7 phường) |
| reports | 3 | Phản ánh tại Thọ Quang, Phước Mỹ, An Hải Bắc |
| report_comments | 3 | Lịch sử xử lý |
| invoices | 3 | Phí vệ sinh Quận Sơn Trà |
| payments | 1 | Thanh toán VNPay |
| notifications | 3 | Thông báo residents |
| notification_settings | 4 | Cài đặt users |
| system_logs | 2 | Audit log mẫu |

### Tài khoản demo thêm

| Role | Email |
|------|-------|
| resident | resident2@ecoschedule.test |
| collector | collector2@ecoschedule.test |

Mật khẩu chung: `EcoSchedule@2026`

## Triển khai Security Rules & Indexes

```bash
# Cài Firebase CLI (nếu chưa có)
npm install -g firebase-tools
firebase login
firebase init firestore   # chọn project, trỏ tới firestore.rules và firestore.indexes.json ở root repo
firebase deploy --only firestore
```

Files cấu hình nằm tại root repo:
- `firestore.rules`
- `firestore.indexes.json`

## Kiểm tra sau seed

1. Mở Firebase Console → Firestore → xác nhận 14 collections có dữ liệu.
2. Đăng nhập app với `resident@ecoschedule.test` / `EcoSchedule@2026`.
3. Tra cứu lịch: Tỉnh **Đà Nẵng**, Phường **Thọ Quang**, Tổ **12**.

## Lưu ý production

- Đổi mật khẩu tài khoản demo trước khi deploy.
- Không commit `serviceAccountKey.json`.
- Chạy `seed:clear` chỉ trên môi trường dev/test.
