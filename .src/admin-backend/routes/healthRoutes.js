const router = require('express').Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

module.exports = router;
