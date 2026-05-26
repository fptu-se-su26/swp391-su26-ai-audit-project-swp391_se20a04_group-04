const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Tải cấu hình từ .env
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let isInitialized = false;

if (fs.existsSync(serviceAccountPath)) {
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

if (!isInitialized) {
  // Cấu hình fallback sử dụng biến môi trường hoặc chế độ mặc định
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
      console.log('Successfully initialized Firebase Admin SDK via Environment Variables');
    } else {
      admin.initializeApp({
        projectId: projectId
      });
      console.warn('Initialized Firebase Admin SDK with Project ID only. Admin Firestore operations may fail if credentials are not configured.');
    }
  } catch (error) {
    console.error('Fatal error initializing Firebase Admin SDK:', error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
