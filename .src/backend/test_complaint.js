const admin = require('firebase-admin');
const serviceAccount = require('/Users/mac/Downloads/Môn kỳ 5/SWP391/swp391-su26-ai-audit-project-swp391_se20a04_group-04/.src/backend/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function run() {
  try {
    const newComplaint = {
      userId: 'test_user_id',
      userName: 'Test User',
      title: 'Test Complaint',
      description: 'Testing',
      type: 'Khác',
      city: '', ward: '', neighborhood: '',
      status: 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply: '', replied_by: '', replied_at: null
    };
    
    console.log("Adding complaint...");
    const docRef = await db.collection('complaints').add(newComplaint);
    
    console.log("Adding manager notification...");
    await db.collection('notifications').add({
      title: 'Phản ánh mới từ cư dân',
      content: `Cư dân Test User vừa gửi một phản ánh mới: "Test Complaint".`,
      type: 'complaint',
      targetRole: 'manager',
      sent_at: new Date(),
      created_at: new Date().toISOString(),
      is_read: false,
      sender_role: 'resident',
      sender_name: 'Test User',
      link: '/admin/complaints'
    });
    
    console.log("Adding resident notification...");
    await db.collection('notifications').add({
      title: 'Gửi phản ánh thành công',
      content: `Phản ánh "Test Complaint" của bạn đã được ghi nhận. Ban quản lý sẽ phản hồi trong thời gian sớm nhất.`,
      type: 'complaint',
      user_id: 'test_user_id',
      sent_at: new Date(),
      created_at: new Date().toISOString(),
      is_read: false,
      sender_role: 'system',
      sender_name: 'Hệ thống',
      link: '/complaints'
    });
    
    console.log("Success!");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
