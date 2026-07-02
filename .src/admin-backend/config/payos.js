require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const payosConfig = {
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  apiBaseUrl: (process.env.PAYOS_API_BASE_URL && !process.env.PAYOS_API_BASE_URL.includes('example.com'))
    ? process.env.PAYOS_API_BASE_URL
    : 'https://api-merchant.payos.vn',
};

/**
 * Kiểm tra xem PayOS đã được cấu hình đầy đủ chưa.
 */
function isPayOSConfigured() {
  return (
    payosConfig.clientId &&
    payosConfig.clientId !== 'YOUR_PAYOS_CLIENT_ID' &&
    payosConfig.apiKey &&
    payosConfig.apiKey !== 'YOUR_PAYOS_API_KEY' &&
    payosConfig.checksumKey &&
    payosConfig.checksumKey !== 'YOUR_PAYOS_CHECKSUM_KEY'
  );
}

module.exports = { payosConfig, isPayOSConfigured };
