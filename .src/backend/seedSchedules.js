/**
 * Script gieo dữ liệu mẫu (seeding) lịch thu gom rác lên Firestore
 */
const { db } = require('./firebaseAdmin');

const mockSchedules = [
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Thọ Quang',
    neighborhood: 'Tổ 12',
    schedule_date: '2026-05-28T17:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '17:00 - 19:00',
    status: 'đúng hạn'
  },
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Thọ Quang',
    neighborhood: 'Tổ 12',
    schedule_date: '2026-05-31T08:00:00.000Z',
    trash_type: 'Rác tái chế (Nhựa, kim loại)',
    time_slot: '08:00 - 10:00',
    status: 'đúng hạn'
  },
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Khuê Mỹ',
    neighborhood: 'Tổ 5',
    schedule_date: '2026-05-29T18:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '18:00 - 20:00',
    status: 'đúng hạn'
  },
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Hàng Trống',
    neighborhood: 'Tổ dân phố 2',
    schedule_date: '2026-05-28T06:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '06:00 - 08:30',
    status: 'đúng hạn'
  },
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Hàng Trống',
    neighborhood: 'Tổ dân phố 2',
    schedule_date: '2026-05-30T09:00:00.000Z',
    trash_type: 'Rác nguy hại (Pin, điện tử)',
    time_slot: '09:00 - 11:30',
    status: 'trì hoãn'
  },
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Phúc Xá',
    neighborhood: 'Tổ 3',
    schedule_date: '2026-05-28T07:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '07:00 - 09:00',
    status: 'đúng hạn'
  },
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Phúc Xá',
    neighborhood: 'Tổ 3',
    schedule_date: '2026-05-31T08:00:00.000Z',
    trash_type: 'Rác tái chế (Nhựa, kim loại)',
    time_slot: '08:00 - 10:00',
    status: 'đúng hạn'
  }
];

async function seed() {
  try {
    console.log('Đang kiểm tra và xóa các dữ liệu mẫu cũ trong collection_schedules...');
    const snapshot = await db.collection('collection_schedules').get();
    
    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Đã dọn dẹp xong ${snapshot.size} lịch cũ.`);
    }

    console.log('Đang nạp dữ liệu mẫu mới lên Firestore...');
    for (const item of mockSchedules) {
      const docRef = await db.collection('collection_schedules').add(item);
      console.log(`- Thêm lịch: [${item.trash_type}] tại [${item.city} -> ${item.ward}] - ID: ${docRef.id}`);
    }
    
    console.log('\nChúc mừng! Gieo dữ liệu mẫu (Seeding) thành công mỹ mãn!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu mẫu:', error);
    process.exit(1);
  }
}

seed();
