const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Tải cấu hình từ .env
require('dotenv').config();

let isInitialized = false;

// 1) Nếu developer cung cấp trực tiếp JSON của service account qua biến môi trường
if (process.env.SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized from SERVICE_ACCOUNT_JSON environment variable');
    isInitialized = true;
  } catch (err) {
    console.error('Failed to parse SERVICE_ACCOUNT_JSON:', err.message);
  }
}

// 2) Nếu có đường dẫn chỉ định đến file JSON thông qua env var
if (!isInitialized && process.env.SERVICE_ACCOUNT_PATH) {
  const candidatePath = path.isAbsolute(process.env.SERVICE_ACCOUNT_PATH)
    ? process.env.SERVICE_ACCOUNT_PATH
    : path.join(__dirname, process.env.SERVICE_ACCOUNT_PATH);

  if (fs.existsSync(candidatePath)) {
    try {
      const serviceAccount = require(candidatePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`Firebase Admin initialized from SERVICE_ACCOUNT_PATH: ${candidatePath}`);
      isInitialized = true;
    } catch (err) {
      console.error('Error loading service account from SERVICE_ACCOUNT_PATH:', err.message);
    }
  } else {
    console.warn(`SERVICE_ACCOUNT_PATH set but file not found: ${candidatePath}`);
  }
}

// 3) Truyền thống: tìm file .src/backend/serviceAccountKey.json (bị .gitignore)
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!isInitialized && fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Successfully initialized Firebase Admin SDK with serviceAccountKey.json');
    isInitialized = true;
  } catch (error) {
    console.error('Error loading serviceAccountKey.json, trying fallback:', error.message);
  }
}

// 4) Fallback: sử dụng FIREBASE_* vars hoặc chỉ projectId (như trước)
if (!isInitialized) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'swp391-database';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      console.log('Successfully initialized Firebase Admin SDK via Environment Variables (CLIENT_EMAIL / PRIVATE_KEY)');
      isInitialized = true;
    } else {
      admin.initializeApp({
        projectId: projectId
      });
      console.warn('Initialized Firebase Admin SDK with Project ID only. Admin Firestore operations may fail if credentials are not configured.');
      isInitialized = true;
    }
  } catch (error) {
    console.error('Fatal error initializing Firebase Admin SDK:', error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
