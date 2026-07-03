const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureManager } = require('../middleware/roleGuard');
const managerController = require('../controllers/managerController');

// Tất cả routes trong module này yêu cầu token + vai trò Manager
router.use(verifyToken, ensureManager);

router.get('/collectors', managerController.getCollectors);
router.get('/schedules', managerController.getSchedules);
router.post('/schedules', managerController.createSchedule);
router.put('/schedules/:scheduleId', managerController.updateSchedule);
router.delete('/schedules/:scheduleId', managerController.deleteSchedule);
router.post('/assign-route', managerController.assignRoute);
router.post('/confirm-route', managerController.confirmRoute);
router.get('/complaints', managerController.getComplaints);
router.patch('/complaints/:complaintId/status', managerController.updateComplaintStatus);
router.get('/feedback-reports', managerController.getFeedbackReports);
router.get('/feedback-reports/:reportId/comments', managerController.getReportComments);
router.patch('/feedback-reports/:reportId/approve', managerController.approveReport);
router.get('/reports', managerController.getReports);
router.post('/invoices', managerController.createInvoice);

module.exports = router;
