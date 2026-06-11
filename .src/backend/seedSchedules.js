/**
 * @deprecated Dùng `npm run seed:full` thay thế (scripts/seedDatabase.js).
 * Script cũ - chỉ seed collection_schedules, phạm vi Quận Sơn Trà.
 */
const { db } = require('./firebaseAdmin');

const mockSchedules = [
  // ---- Đà Nẵng - Phường Thọ Quang ----
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
    ward: 'Phường Thọ Quang',
    neighborhood: 'Tổ 7',
    schedule_date: '2026-05-29T16:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '16:00 - 18:00',
    status: 'đúng hạn'
  },
  // Lịch áp dụng cho toàn phường (không ghi tổ cụ thể)
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Thọ Quang',
    neighborhood: '',
    schedule_date: '2026-06-01T07:00:00.000Z',
    trash_type: 'Rác cồng kềnh (Đồ nội thất cũ)',
    time_slot: '07:00 - 11:00',
    status: 'đúng hạn'
  },

  // ---- Đà Nẵng - Phường Khuê Mỹ ----
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Khuê Mỹ',
    neighborhood: 'Tổ 5',
    schedule_date: '2026-05-29T18:00:00.000Z',
    trash_type: 'Rác hữu cơ (Sinh hoạt)',
    time_slot: '18:00 - 20:00',
    status: 'đúng hạn'
  },
  // Lịch áp dụng cho toàn phường Khuê Mỹ
  {
    city: 'Thành phố Đà Nẵng',
    ward: 'Phường Khuê Mỹ',
    neighborhood: '',
    schedule_date: '2026-05-30T08:00:00.000Z',
    trash_type: 'Rác tái chế (Nhựa, kim loại)',
    time_slot: '08:00 - 10:30',
    status: 'đúng hạn'
  },

  // ---- Hà Nội - Phường Hàng Trống ----
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
  // Lịch áp dụng cho toàn phường Hàng Trống
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Hàng Trống',
    neighborhood: '',
    schedule_date: '2026-06-02T06:30:00.000Z',
    trash_type: 'Rác cồng kềnh (Đồ nội thất cũ)',
    time_slot: '06:30 - 10:00',
    status: 'đúng hạn'
  },

  // ---- Hà Nội - Phường Phúc Xá ----
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
  },
  // Lịch áp dụng cho toàn phường Phúc Xá
  {
    city: 'Thành phố Hà Nội',
    ward: 'Phường Phúc Xá',
    neighborhood: '',
    schedule_date: '2026-05-29T07:00:00.000Z',
    trash_type: 'Rác nguy hại (Pin, điện tử)',
    time_slot: '07:00 - 09:00',
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
