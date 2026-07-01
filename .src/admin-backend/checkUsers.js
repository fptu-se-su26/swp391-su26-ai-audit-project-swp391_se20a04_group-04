const { db } = require('./firebaseAdmin');

async function test() {
  try {
    const snapshot = await db.collection('users').get();
    console.log(`Found ${snapshot.size} users.`);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch (err) {
    console.error(err);
  }
}
test();
