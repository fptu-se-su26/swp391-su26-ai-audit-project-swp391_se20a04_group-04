# Kết nối Database Firebase chung (EcoSchedule)

Nhóm sử dụng **một Firebase project / Firestore chung**. Không chạy script seed cục bộ — dữ liệu do nhóm quản trị trên Firebase Console hoặc qua backend deploy chung.

| | |
|---|---|
| **Project ID** | Lấy từ leader nhóm (ví dụ `swp391-database`) |
| **Database** | Cloud Firestore |

## Cấu hình backend (bắt buộc)

1. Nhận từ leader nhóm:
   - File **service account JSON** (hoặc biến môi trường tương đương)
   - **Web API Key** (`FIREBASE_API_KEY`)
   - **Project ID**

2. Tạo `.src/backend/.env` (copy từ `.env.example`):

```env
FIREBASE_PROJECT_ID=<project-id-cua-nhom>
FIREBASE_API_KEY=<web-api-key-cua-nhom>
PORT=5001
```

3. Đặt credentials (chọn **một** cách):

- **Cách A:** Lưu file service account tại `.src/backend/serviceAccountKey.json` (đã có trong `.gitignore`)
- **Cách B:** Biến môi trường `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
- **Cách C:** `SERVICE_ACCOUNT_PATH` hoặc `SERVICE_ACCOUNT_JSON`

4. Chạy backend:

```powershell
cd .src/backend
npm install
npm run dev
```

Backend kết nối trực tiếp Firestore của nhóm qua `firebaseAdmin.js` — **không ghi/xóa dữ liệu seed tự động**.

## Cấu hình frontend

Tạo `.src/frontend/.env` (copy từ `.env.example`):

```env
VITE_API_URL=http://localhost:5001/api/auth
```

Firebase client config (`src/services/firebase.js`) phải trỏ cùng **project ID** với backend. Nếu nhóm đổi project, cập nhật config theo hướng dẫn leader.

## Tài khoản & dữ liệu

- Tài khoản demo và dữ liệu mẫu do **leader / người quản lý DB nhóm** tạo trên Firebase Auth + Firestore.
- Mỗi thành viên chỉ cần credentials đúng project — **không** chạy `seed:full` hay script xóa collections.

## Triển khai Security Rules (một lần / khi leader yêu cầu)

```bash
firebase login
firebase use <project-id-cua-nhom>
firebase deploy --only firestore
```

Files: `firestore.rules`, `firestore.indexes.json` (root repo).

## Lưu ý

- **Không commit** `serviceAccountKey.json` hoặc `.env`.
- **Không** chạy lệnh xóa toàn bộ collections trên DB chung.
- Nếu thiếu dữ liệu test, liên hệ leader để được cấp tài khoản hoặc bổ sung dữ liệu trên Firestore chung.
