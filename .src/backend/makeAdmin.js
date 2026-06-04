const { db } = require('./firebaseAdmin');

async function makeAdmin(email) {
  try {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    if (usersSnap.empty) {
      console.log('Không tìm thấy người dùng với email:', email);
      
      // Tìm trong USERS_COLLECTION
      const usersSnap2 = await db.collection('người dùng').where('email', '==', email).get();
      if (usersSnap2.empty) {
        console.log('Cũng không tìm thấy trong collection "người dùng"');
        return;
      }
      
      for (const doc of usersSnap2.docs) {
        await doc.ref.update({ role: 'Admin' });
        console.log(`Đã cấp quyền Admin cho ${email} trong collection "người dùng" (UID: ${doc.id})`);
      }
      return;
    }

    for (const doc of usersSnap.docs) {
      await doc.ref.update({ role: 'Admin' });
      console.log(`Đã cấp quyền Admin cho ${email} trong collection "users" (UID: ${doc.id})`);
    }
  } catch (err) {
    console.error('Lỗi:', err);
  }
}

makeAdmin('dinhbao16888@gmail.com');
