const { test } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ManagerDashboardPage } = require('../pages/ManagerDashboardPage');

test.describe('EcoSchedule Manager – POM', () => {
  test('Manager xem complaint và duyệt feedback của Collector', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const managerPage = new ManagerDashboardPage(page);
    let feedbackReports = [{
      id: 'report-101', title: 'Thùng rác hỏng tại ngã tư', description: 'Đã thay mới thùng rác bị cháy.', status: 'resolved_pending_approval'
    }];

    await page.route('**/api/auth/login', (route) => route.fulfill({
      json: { user: { uid: 'mock-manager-id', email: 'manager@test.com', fullName: 'Test Manager', role: 'manager' }, token: 'mock-manager-token' }
    }));
    await page.route('**/api/manager/schedules', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/manager/reports', (route) => route.fulfill({ json: { summary: { total_schedules: 10, assigned_routes: 8, open_complaints: 1 } } }));
    await page.route('**/api/manager/collectors', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/manager/feedback-reports*', (route) => route.fulfill({ json: { data: feedbackReports } }));
    await page.route('**/api/manager/feedback-reports/*/approve', (route) => {
      feedbackReports = [];
      return route.fulfill({ json: { message: 'Approved successfully' } });
    });
    await page.route('**/api/manager/schedules/completion-pending', (route) => route.fulfill({ json: { data: { pending: [], groups: [] } } }));
    await page.route('**/api/manager/routes', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/manager/teams', (route) => route.fulfill({ json: [] }));
    await page.route('**/api/manager/complaints', (route) => route.fulfill({ json: [{
      id: 'complaint-301', title: 'Rác ngập tràn chưa dọn', description: 'Rác bốc mùi hôi thối ở đầu hẻm', status: 'open'
    }] }));

    await loginPage.navigateTo('/login');
    await loginPage.fillCredentials('manager@test.com', 'AnyPassword123');
    await loginPage.submitBtn.first().click();
    await page.waitForURL('**/dashboard');

    await managerPage.verifyLoaded();
    await managerPage.approveFirstFeedback();
    await managerPage.verifyApprovalCompleted();
  });
});
