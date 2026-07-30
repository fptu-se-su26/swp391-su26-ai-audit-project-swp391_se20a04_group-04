const scheduleService = require('../services/scheduleService');

/**
 * GET /api/schedules
 * Tra cứu lịch thu gom rác theo khu vực (public).
 */
async function getSchedules(req, res) {
  const { city, ward, neighborhood } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'Vui lòng cung cấp Tỉnh/Thành phố để tra cứu.' });
  }
  try {
    const schedules = await scheduleService.getSchedules({ city, ward, neighborhood });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('[API] Lỗi tra cứu lịch thu gom:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getSchedules };
