const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/roleGuard');
const adminController = require('../controllers/adminController');

// Tất cả routes yêu cầu token + vai trò Admin
router.use(verifyToken, ensureAdmin);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:uid', adminController.updateUser);
router.delete('/users/:uid', adminController.deleteUser);

// Transactions
router.get('/transactions', adminController.getTransactions);

// Complaints
router.get('/complaints', adminController.getComplaints);

module.exports = router;
