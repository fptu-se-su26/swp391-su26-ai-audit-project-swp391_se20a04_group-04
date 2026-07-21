const admin = require('firebase-admin');
const fs = require('fs');

// 1. Trỏ trực tiếp tới file serviceAccountKey.json có sẵn của bạn
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportFirestoreData() {
    console.log('🚀 Đang bắt đầu kết nối và quét dữ liệu Firestore...');

    // Lấy danh sách tất cả các Collections
    const collections = await db.listCollections();
    const allData = {};

    for (const col of collections) {
        console.log(`📦 Đang trích xuất collection: "${col.id}"...`);
        const snapshot = await col.get();
        allData[col.id] = {};

        snapshot.forEach(doc => {
            allData[col.id][doc.id] = doc.data();
        });
    }

    // 2. Ghi ra file JSON local
    fs.writeFileSync('firebase_database_export.json', JSON.stringify(allData, null, 2));
    console.log('\n✅ Xong! Dữ liệu đã được trích xuất thành công ra file "firebase_database_export.json"');
}

exportFirestoreData().catch(err => {
    console.error('❌ Có lỗi xảy ra:', err);
});