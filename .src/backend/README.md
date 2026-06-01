Backend Firebase Admin setup

This repository intentionally keeps `serviceAccountKey.json` out of source control (see .gitignore).

Local developer setup:

1) Copy the example file to a local, non-committed filename:

   - Copy `.src/backend/serviceAccountKey.example.json` to `.src/backend/serviceAccountKey.json`
   - Fill in the actual values from your Firebase service account JSON
   - Start backend: `npm run dev` or `npm start`

2) Or use environment variables for secure CI/local environments:

   - `SERVICE_ACCOUNT_JSON` can contain the full JSON string of the service account.
   - `SERVICE_ACCOUNT_PATH` can point to a local JSON file path.

Notes:
- Do NOT commit real credentials to the repository.
- Keep `serviceAccountKey.json` local and ignored by Git.
- The code supports `SERVICE_ACCOUNT_JSON`, `SERVICE_ACCOUNT_PATH`, `serviceAccountKey.json`, or `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`.
