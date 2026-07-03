const complaintService = require('../services/complaintService');

/**
 * POST /api/complaints
 * Cư dân gửi phản ánh mới.
 */
async function createComplaint(req, res) {
  try {
    const result = await complaintService.createComplaint(
      req.uid,
      req.userProfile.fullName,
      req.body
    );
    return res.status(201).json(result);
  } catch (error) {
    console.error('[API] Lỗi gửi phản ánh cư dân:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/complaints
 * Lấy danh sách các phản ánh của cư dân đang đăng nhập.
 */
async function getUserComplaints(req, res) {
  try {
    const result = await complaintService.getUserComplaints(req.uid);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[API] Lỗi lấy danh sách phản ánh cư dân:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { createComplaint, getUserComplaints };
