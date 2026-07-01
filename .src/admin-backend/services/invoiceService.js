const { db } = require('../firebaseAdmin');

function getTimestampMillis(value) {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

function serializeInvoice(invoice) {
  if (!invoice) return null;
  const serialized = { ...invoice };
  const dateFields = ['createdAt', 'dueDate', 'paidAt', 'updatedAt'];
  
  dateFields.forEach((field) => {
    if (serialized[field]) {
      if (typeof serialized[field].toDate === 'function') {
        serialized[field] = serialized[field].toDate().toISOString();
      } else if (serialized[field] instanceof Date) {
        serialized[field] = serialized[field].toISOString();
      } else if (typeof serialized[field] === 'object' && (serialized[field]._seconds !== undefined || serialized[field].seconds !== undefined)) {
        const seconds = serialized[field]._seconds !== undefined ? serialized[field]._seconds : serialized[field].seconds;
        serialized[field] = new Date(seconds * 1000).toISOString();
      } else {
        const d = new Date(serialized[field]);
        if (!Number.isNaN(d.getTime())) {
          serialized[field] = d.toISOString();
        }
      }
    }
  });
  
  return serialized;
}

async function getLatestInvoiceForUser(userId) {
  const snapshot = await db.collection('invoices')
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const invoices = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  invoices.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
  return serializeInvoice(invoices[0]) || null;
}

async function getInvoiceById(invoiceId) {
  const doc = await db.collection('invoices').doc(invoiceId).get();
  if (!doc.exists) {
    return null;
  }
  return serializeInvoice({ id: doc.id, ...doc.data() });
}

async function createOrUpdateInvoice(invoiceData) {
  const invoiceId = invoiceData.invoiceId;
  if (!invoiceId) {
    throw new Error('invoiceId is required');
  }

  const formattedInvoice = {
    ...invoiceData,
    amount: Number(invoiceData.amount) || 0,
    billingMonth: Number(invoiceData.billingMonth) || 0,
    billingYear: Number(invoiceData.billingYear) || 0,
    createdAt: invoiceData.createdAt ? new Date(invoiceData.createdAt) : new Date(),
    dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
    paidAt: invoiceData.paidAt ? new Date(invoiceData.paidAt) : null,
    updatedAt: invoiceData.updatedAt ? new Date(invoiceData.updatedAt) : new Date(),
  };

  await db.collection('invoices').doc(invoiceId).set(formattedInvoice, { merge: true });
  return getInvoiceById(invoiceId);
}

async function updateInvoice(invoiceId, updates) {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No invoice fields provided to update');
  }

  const formattedUpdates = {
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : undefined,
    billingMonth: updates.billingMonth !== undefined ? Number(updates.billingMonth) : undefined,
    billingYear: updates.billingYear !== undefined ? Number(updates.billingYear) : undefined,
    createdAt: updates.createdAt ? new Date(updates.createdAt) : undefined,
    dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    paidAt: Object.prototype.hasOwnProperty.call(updates, 'paidAt')
      ? (updates.paidAt ? new Date(updates.paidAt) : null)
      : undefined,
    updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : new Date(),
  };

  const cleaned = Object.fromEntries(
    Object.entries(formattedUpdates).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(cleaned).length === 0) {
    throw new Error('No invoice fields provided to update');
  }

  await db.collection('invoices').doc(invoiceId).update(cleaned);
  return getInvoiceById(invoiceId);
}

async function getPaidInvoicesForUser(userId) {
  const snapshot = await db.collection('invoices')
    .where('userId', '==', userId)
    .where('status', '==', 'paid')
    .get();

  if (snapshot.empty) {
    return [];
  }

  const invoices = snapshot.docs.map((doc) => serializeInvoice({ id: doc.id, ...doc.data() }));
  invoices.sort((a, b) => getTimestampMillis(b.paidAt) - getTimestampMillis(a.paidAt));
  return invoices;
}

module.exports = {
  getLatestInvoiceForUser,
  getInvoiceById,
  createOrUpdateInvoice,
  updateInvoice,
  getPaidInvoicesForUser,
};
