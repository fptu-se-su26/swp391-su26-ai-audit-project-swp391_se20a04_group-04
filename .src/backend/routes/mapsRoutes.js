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

router.get('/directions', verifyToken, async (req, res) => {
  const { origin, destination, waypoints } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  try {
    const params = new URLSearchParams({ origin, destination, key: apiKey });
    if (waypoints) params.set('waypoints', waypoints);
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

router.get('/geocode', verifyToken, async (req, res) => {
  const { address, latlng } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  try {
    const params = new URLSearchParams({ key: apiKey });
    if (address) params.set('address', address);
    if (latlng) params.set('latlng', latlng);
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch geocode' });
  }
});

router.get('/distance-matrix', verifyToken, async (req, res) => {
  const { origins, destinations } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  try {
    const params = new URLSearchParams({ origins, destinations, key: apiKey });
    const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distance matrix' });
  }
});

router.get('/places', verifyToken, async (req, res) => {
  const { query, location, radius } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  try {
    const params = new URLSearchParams({ query, key: apiKey });
    if (location) params.set('location', location);
    if (radius) params.set('radius', radius);
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

module.exports = router;
