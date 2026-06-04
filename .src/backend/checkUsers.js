const { db, admin } = require('./firebaseAdmin');

async function checkUsers() {
  try {
    const authResult = await admin.auth().listUsers();
    console.log('--- Firebase Auth Users ---');
    console.log('Total:', authResult.users.length);
    authResult.users.forEach(u => console.log(u.email, u.uid));

    console.log('\n--- Firestore "users" Collection ---');
    const usersSnap = await db.collection('users').get();
    console.log('Total:', usersSnap.size);
    usersSnap.forEach(doc => console.log(doc.data().email, doc.id));
    
    console.log('\n--- Firestore "người dùng" Collection ---');
    const usersSnap2 = await db.collection('người dùng').get();
    console.log('Total:', usersSnap2.size);
    usersSnap2.forEach(doc => console.log(doc.data().email, doc.id));

  } catch (err) {
    console.error('Lỗi:', err);
  }
}

checkUsers();
