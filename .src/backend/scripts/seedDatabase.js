/**
 * EcoSchedule - Firestore Database Seed Script
 *
 * Usage:
 *   node scripts/seedDatabase.js              # Seed tất cả collections
 *   node scripts/seedDatabase.js --clear      # Xóa dữ liệu cũ rồi seed lại
 *   node scripts/seedDatabase.js --auth       # Tạo thêm tài khoản Firebase Auth
 *   node scripts/seedDatabase.js --clear --auth
 *
 * Yêu cầu: serviceAccountKey.json hoặc biến môi trường Firebase Admin credentials.
 */
const { db, auth } = require('../firebaseAdmin');
const { PROJECT, AUTH_ACCOUNTS, SEED_ORDER, SON_TRA_WARDS } = require('./seedData');
const { clearCollection, seedCollection } = require('./seedHelpers');

const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const shouldCreateAuth = args.includes('--auth');

async function createAuthUsers() {
  console.log('\n=== Firebase Auth: tạo tài khoản demo ===');

  for (const account of AUTH_ACCOUNTS) {
    try {
      await auth.createUser({
        uid: account.uid,
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true,
      });
      console.log(`  [auth] Created: ${account.email} (${account.role})`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        await auth.updateUser(account.uid, {
          email: account.email,
          password: account.password,
          displayName: account.displayName,
          emailVerified: true,
        });
        console.log(`  [auth] Updated: ${account.email}`);
        continue;
      }

      if (error.code === 'auth/email-already-exists') {
        const existing = await auth.getUserByEmail(account.email);
        await auth.updateUser(existing.uid, {
          password: account.password,
          displayName: account.displayName,
          emailVerified: true,
        });
        console.log(`  [auth] Email exists, updated password: ${account.email}`);
        continue;
      }

      throw error;
    }
  }
}

async function seedFirestore() {
  console.log('\n=== Firestore: seed collections ===');

  if (shouldClear) {
    console.log('\n-- Xóa dữ liệu cũ (theo thứ tự ngược) --');
    const reversed = [...SEED_ORDER].reverse();
    for (const { name } of reversed) {
      await clearCollection(db, name);
    }
  }

  console.log('\n-- Ghi dữ liệu mới --');
  const summary = {};

  for (const { name, getter } of SEED_ORDER) {
    const documents = getter();
    summary[name] = await seedCollection(db, name, documents);
  }

  return summary;
}

function printSummary(summary) {
  console.log('\n========================================');
  console.log('  ECO SCHEDULE - DATABASE SEED COMPLETE');
  console.log('========================================\n');

  Object.entries(summary).forEach(([collection, count]) => {
    console.log(`  ${collection.padEnd(24)} ${count} docs`);
  });

  if (shouldCreateAuth) {
    console.log('\n--- Tài khoản demo (mật khẩu: EcoSchedule@2026) ---');
    AUTH_ACCOUNTS.forEach((account) => {
      console.log(`  ${account.role.padEnd(10)} ${account.email}`);
    });
  }

  console.log('\nLưu ý: Chạy với --auth để tạo tài khoản đăng nhập Firebase Auth.');
  console.log('Triển khai firestore.rules và firestore.indexes.json qua Firebase CLI.\n');
}

async function main() {
  console.log('EcoSchedule Database Seeder');
  console.log(`Project : ${PROJECT.id}`);
  console.log(`Scope   : ${PROJECT.district}, ${PROJECT.city}`);
  console.log(`Wards   : ${SON_TRA_WARDS.length} phường`);
  console.log(`Options : clear=${shouldClear}, auth=${shouldCreateAuth}`);

  try {
    if (shouldCreateAuth) {
      await createAuthUsers();
    }

    const summary = await seedFirestore();
    printSummary(summary);
    process.exit(0);
  } catch (error) {
    console.error('\n[ERROR] Seed thất bại:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    console.error('\nKiểm tra:');
    console.error('  1. File .src/backend/serviceAccountKey.json tồn tại');
    console.error('  2. Hoặc cấu hình SERVICE_ACCOUNT_PATH / FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY trong .env');
    console.error('  3. Firebase project đã bật Firestore Database');
    process.exit(1);
  }
}

main();
