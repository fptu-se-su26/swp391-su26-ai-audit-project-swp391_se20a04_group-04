# EcoSchedule Backend

Backend Express kết nối **Firebase Auth + Firestore chung của nhóm**. Không dùng script seed cục bộ.

## Thiết lập nhanh

1. Copy `.env.example` → `.env` và điền thông tin từ leader nhóm:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_API_KEY`
   - `PORT=5001` (khớp với frontend)

2. Credentials Firebase Admin (một trong các cách):
   - `serviceAccountKey.json` tại thư mục này (file local, không commit)
   - Hoặc `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` trong `.env`
   - Hoặc `SERVICE_ACCOUNT_PATH` / `SERVICE_ACCOUNT_JSON`

3. Chạy:

```powershell
npm install
npm run dev
```

API: `http://localhost:5001`

## Chi tiết

Xem [docs/DATABASE_SEED.md](../../docs/DATABASE_SEED.md) — hướng dẫn kết nối DB chung, **không** seed local.

## Lưu ý bảo mật

- Không commit `serviceAccountKey.json` hoặc `.env`.
- Không chạy lệnh xóa/ghi đè toàn bộ collections trên Firestore chung của nhóm.
