const { admin, db } = require('./firebaseAdmin');

async function fixAdminRole() {
  const email = 'dinhbao16888@gmail.com';
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;
    console.log(`Found user in Auth: ${uid}`);

    // Update in users collection
    await db.collection('users').doc(uid).set({
      role: 'admin'
    }, { merge: true });

    // Update in USERS_COLLECTION if different
    // The server.js code checks both 'users' and USERS_COLLECTION
    console.log('Successfully updated role to admin in Firestore.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin role:', error);
    process.exit(1);
  }
}

fixAdminRole();
