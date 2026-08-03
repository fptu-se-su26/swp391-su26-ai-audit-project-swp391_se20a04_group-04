const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureCollector } = require('../middleware/roleGuard');
const collectorController = require('../controllers/collectorController');

// Routes collector — tất cả yêu cầu token + vai trò Collector
router.get('/dashboard/collector', verifyToken, ensureCollector, collectorController.getDashboard);
router.get('/collector/schedules', verifyToken, ensureCollector, collectorController.getSchedules);
router.patch('/collector/schedules/:sourceType/:id/status', verifyToken, ensureCollector, collectorController.updateScheduleStatus);
router.post('/collector/confirm-route', verifyToken, ensureCollector, collectorController.confirmRoute);
router.post('/collector/confirm-week', verifyToken, ensureCollector, collectorController.confirmWeek);
router.post('/collector/deny-week', verifyToken, ensureCollector, collectorController.denyWeek);
router.get('/collector/reports', verifyToken, ensureCollector, collectorController.getReports);
router.get('/collector/my-team', verifyToken, ensureCollector, collectorController.getMyTeam);
router.get('/collector/salary', verifyToken, ensureCollector, collectorController.getMySalary);
router.get('/collector/salary/history', verifyToken, ensureCollector, collectorController.getSalaryHistory);
router.get('/route-assignments/my', verifyToken, ensureCollector, collectorController.getMyAssignments);
router.patch('/route-assignments/:assignmentId/status', verifyToken, ensureCollector, collectorController.updateAssignmentStatus);
router.get('/reports/:reportId/comments', verifyToken, ensureCollector, collectorController.getReportComments);
router.patch('/reports/:reportId/status', verifyToken, ensureCollector, collectorController.updateReportStatus);

// Attendance routes
router.get('/collector/attendance/today', verifyToken, ensureCollector, collectorController.getTodayAttendance);
router.post('/collector/attendance/check-in', verifyToken, ensureCollector, collectorController.checkIn);
router.post('/collector/attendance/check-out', verifyToken, ensureCollector, collectorController.checkOut);
router.get('/collector/attendance/history', verifyToken, ensureCollector, collectorController.getAttendanceHistory);

module.exports = router;
