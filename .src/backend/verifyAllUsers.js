const { admin } = require('./firebaseAdmin');

async function verifyAllUsers() {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    for (const user of users) {
      if (!user.emailVerified) {
        await admin.auth().updateUser(user.uid, { emailVerified: true });
        console.log(`Verified email for: ${user.email}`);
      }
    }
    console.log('Done verifying all users.');
  } catch (err) {
    console.error('Error verifying users:', err);
  }
}

verifyAllUsers();
