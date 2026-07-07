const admin = require('firebase-admin');
const serviceAccount = require('/Users/mac/Downloads/Môn kỳ 5/SWP391/swp391-su26-ai-audit-project-swp391_se20a04_group-04/.src/backend/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('notifications').orderBy('created_at', 'desc').limit(10).get();
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(`Title: ${doc.data().title}`);
    console.log(`Type: ${doc.data().type}`);
    console.log('---');
  });
  process.exit(0);
}
run();
