import authService from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authService.getToken()}`,
  };
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type');
  const responseBody = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw responseBody || new Error('Request failed');
  }

  return responseBody;
}

export async function fetchCurrentInvoice() {
  const response = await fetch(`${API_BASE}/api/invoices/current`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function createInvoice(invoiceData) {
  const response = await fetch(`${API_BASE}/api/invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(invoiceData),
  });
  return parseJsonResponse(response);
}

export async function createManagerInvoice(invoiceData) {
  const response = await fetch(`${API_BASE}/api/manager/invoices`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(invoiceData),
  });
  return parseJsonResponse(response);
}

export async function createPaymentRequest(invoiceId, paymentMethod = 'payos') {
  const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/payment-request`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ paymentMethod }),
  });
  return parseJsonResponse(response);
}

export async function verifyPaymentStatus(invoiceId) {
  const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}/verify-payment`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function fetchInvoiceById(invoiceId) {
  const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function fetchInvoiceHistory() {
  const response = await fetch(`${API_BASE}/api/invoices/history`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function getAdminTransactions(roleFilter = '') {
  let url = `${API_BASE}/api/admin/transactions`;
  if (roleFilter) {
    url += `?role=${roleFilter}`;
  }
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function searchResidents(query) {
  const response = await fetch(`${API_BASE}/api/manager/residents/search?q=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}

export async function getResidentInvoices(userId) {
  const response = await fetch(`${API_BASE}/api/manager/residents/${encodeURIComponent(userId)}/invoices`, {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(response);
}
