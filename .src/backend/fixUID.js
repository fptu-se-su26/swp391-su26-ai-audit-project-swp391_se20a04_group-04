const { db, admin } = require('./firebaseAdmin');

async function fixUID() {
  const correctUID = 'lv0r94lMlySx7VWIq5bwTUXmgu73';
  const corruptedUID = 'lvOr94lMlySx7VWlq5bwTUXmgu73';
  
  try {
    // 1. Lấy data từ corruptedUID
    const corruptedDoc = await db.collection('users').doc(corruptedUID).get();
    if (corruptedDoc.exists) {
      const data = corruptedDoc.data();
      data.role = 'Admin'; // Đảm bảo role là Admin
      
      // 2. Viết vào correctUID
      await db.collection('users').doc(correctUID).set(data);
      console.log('Đã tạo/cập nhật user với UID chuẩn xác:', correctUID);
      
      // 3. Xóa corruptedUID
      await db.collection('users').doc(corruptedUID).delete();
      console.log('Đã xóa UID bị lỗi:', corruptedUID);
    } else {
      console.log('Không tìm thấy corrupted doc, có thể đã được sửa.');
      
      // Nếu chưa có doc đúng, thì tạo luôn một cái đúng
      await db.collection('users').doc(correctUID).set({
        email: 'dinhbao16888@gmail.com',
        role: 'Admin',
        fullName: 'Dinh Bao',
        area: 'Quận Sơn Trà, Đà Nẵng',
        emailVerified: true
      });
      console.log('Đã tạo mới doc cho UID chuẩn xác:', correctUID);
    }
  } catch (err) {
    console.error('Lỗi khi sửa UID:', err);
  }
}

fixUID();
