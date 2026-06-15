const { admin } = require('../firebaseAdmin');

const BATCH_LIMIT = 450;

function ts(isoString) {
  return admin.firestore.Timestamp.fromDate(new Date(isoString));
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp();
}

async function clearCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  [skip] ${collectionName}: đã rỗng`);
    return 0;
  }

  let deleted = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    ops += 1;
    deleted += 1;

    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`  [clear] ${collectionName}: đã xóa ${deleted} document`);
  return deleted;
}

async function seedCollection(db, collectionName, documents, { useAutoId = false } = {}) {
  if (!documents.length) {
    console.log(`  [skip] ${collectionName}: không có dữ liệu`);
    return 0;
  }

  let batch = db.batch();
  let ops = 0;
  let written = 0;

  for (const item of documents) {
    const { _id, ...data } = item;
    const ref = useAutoId || !_id
      ? db.collection(collectionName).doc()
      : db.collection(collectionName).doc(_id);

    batch.set(ref, data, { merge: false });
    ops += 1;
    written += 1;

    if (ops >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`  [seed] ${collectionName}: đã ghi ${written} document`);
  return written;
}

module.exports = {
  ts,
  now,
  clearCollection,
  seedCollection,
};
