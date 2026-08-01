const express = require('express');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { getCorsMiddleware } = require('./config/cors');
const mountRoutes = require('./routes');
const { startPaymentReminderJob } = require('./services/paymentReminderJob');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware chung
app.use(getCorsMiddleware());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount tất cả routes
mountRoutes(app);

// Khởi chạy Server Express
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`==================================================`);
    console.log(`  EcoSchedule Secure Backend is running on ${HOST}:${PORT}`);
    console.log(`  API Base URL: http://${HOST}:${PORT}`);
    console.log(`==================================================`);
    startPaymentReminderJob();
  });
}

module.exports = app;
