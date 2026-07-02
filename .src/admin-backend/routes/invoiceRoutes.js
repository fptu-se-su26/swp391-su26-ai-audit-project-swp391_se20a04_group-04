const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureResident } = require('../middleware/roleGuard');
const invoiceController = require('../controllers/invoiceController');

// Tất cả routes yêu cầu token + vai trò Resident
router.use(verifyToken, ensureResident);

router.post('/', invoiceController.createInvoice);
router.get('/current', invoiceController.getCurrentInvoice);
router.get('/history', invoiceController.getInvoiceHistory);
router.get('/:invoiceId', invoiceController.getInvoiceById);
router.post('/:invoiceId/payment-request', invoiceController.createPaymentRequest);
router.post('/:invoiceId/verify-payment', invoiceController.verifyPayment);

module.exports = router;
