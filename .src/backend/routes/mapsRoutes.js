const express = require('express');
const verifyToken = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/maps/key
 * Returns the Google Maps API key for authenticated clients.
 */
router.get('/key', verifyToken, (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key chưa được cấu hình.' });
  }
  res.json({ apiKey });
});

module.exports = router;
