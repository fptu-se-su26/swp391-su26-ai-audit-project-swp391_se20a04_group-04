const router = require('express').Router();
const addressController = require('../controllers/addressController');

router.get('/provinces', addressController.getProvinces);
router.get('/wards', addressController.getWards);

module.exports = router;
