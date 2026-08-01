const router = require('express').Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendCode);

module.exports = router;
