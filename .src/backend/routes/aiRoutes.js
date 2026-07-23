const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { ensureManager } = require('../middleware/roleGuard');
const { residentChat, complaintSummary } = require('../controllers/aiController');

// POST /api/ai/chat — any authenticated user (resident)
router.post('/chat', verifyToken, rateLimiter, residentChat);

// GET /api/ai/complaints/summary — manager only
router.get('/complaints/summary', verifyToken, ensureManager, complaintSummary);

module.exports = router;
