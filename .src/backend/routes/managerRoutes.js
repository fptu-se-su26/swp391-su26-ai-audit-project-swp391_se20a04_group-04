const router = require('express').Router();
const verifyToken = require('../middleware/auth');
const { ensureManager } = require('../middleware/roleGuard');
const managerController = require('../controllers/managerController');

// Tất cả routes trong module này yêu cầu token + vai trò Manager
router.use(verifyToken, ensureManager);

router.get('/collectors', managerController.getCollectors);
router.get('/schedules/completion-pending', managerController.getPendingCompletions);
router.post('/schedules/approve-day', managerController.approveDayCompletions);
router.patch('/schedules/:scheduleId/approve-completion', managerController.approveScheduleCompletion);
router.patch('/schedules/:scheduleId/reject-completion', managerController.rejectScheduleCompletion);
router.get('/schedules', managerController.getSchedules);
router.post('/schedules', managerController.createSchedule);
router.put('/schedules/:scheduleId', managerController.updateSchedule);
router.patch('/schedules/:scheduleId', managerController.updateSchedule);
router.delete('/schedules/:scheduleId', managerController.deleteSchedule);
router.post('/assign-route', managerController.assignRoute); // Might be deprecated later
router.post('/confirm-route', managerController.confirmRoute);

router.get('/routes', managerController.getRoutes);
router.post('/routes', managerController.createRoute);
router.put('/routes/:routeId', managerController.updateRoute);
router.delete('/routes/:routeId', managerController.deleteRoute);

router.get('/teams', managerController.getTeams);
router.post('/teams', managerController.createTeam);
router.put('/teams/:teamId', managerController.updateTeam);
router.delete('/teams/:teamId', managerController.deleteTeam);

router.get('/complaints', managerController.getComplaints);
router.patch('/complaints/:complaintId/status', managerController.updateComplaintStatus);
router.get('/feedback-reports', managerController.getFeedbackReports);
router.get('/feedback-reports/:reportId/comments', managerController.getReportComments);
router.patch('/feedback-reports/:reportId/approve', managerController.approveReport);
router.get('/reports', managerController.getReports);
router.get('/dashboard/stats', managerController.getDashboardStats);
router.get('/invoice-templates', managerController.getInvoiceTemplates);
router.post('/invoice-templates', managerController.createInvoiceTemplate);
router.delete('/invoice-templates/:templateId', managerController.deleteInvoiceTemplate);
router.get('/residents/search', managerController.searchResidents);
router.get('/residents/:userId/invoices', managerController.getResidentInvoices);
router.post('/invoices', managerController.createInvoice);

// Salary management
router.get('/team-performance', managerController.getTeamPerformance);
router.get('/collector-salaries', managerController.getCollectorSalaries);
router.post('/collector-salaries', managerController.setCollectorSalary);

// Attendance management
router.get('/attendances', managerController.getAttendanceSummary);

module.exports = router;
