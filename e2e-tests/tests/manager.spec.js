import { test, expect } from '@playwright/test';
const { LoginPage } = require('../pages/LoginPage');

test.describe('EcoSchedule Manager Role Mock', () => {

  test('Execute Manager mock login and view complaints', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Step 1: Setup Manager Login Mock and Dashboard', async () => {
      // 1. Mock Login API
      await page.route('**/api/auth/login', async route => {
        const json = {
          user: { uid: 'mock-manager-id', email: 'manager@test.com', fullName: 'Test Manager', role: 'manager' },
          token: 'mock-jwt-token-manager'
        };
        await route.fulfill({ json });
      });

      // 2. Mock Manager APIs to prevent dashboard errors
      await page.route('**/api/manager/schedules', async route => {
        await route.fulfill({ json: [] });
      });
      await page.route('**/api/manager/reports', async route => {
        await route.fulfill({ json: { summary: { total_schedules: 10, assigned_routes: 8, open_complaints: 1 } } });
      });
      await page.route('**/api/manager/collectors', async route => {
        await route.fulfill({ json: [] });
      });
      let mockFeedbackReports = [
        {
          id: 'report-101',
          title: 'Thùng rác hỏng tại ngã tư',
          description: 'Đã thay mới thùng rác bị cháy.',
          status: 'resolved_pending_approval',
          ward: 'Phường Mỹ An',
          neighborhood: 'Tổ 15'
        }
      ];

      await page.route('**/api/manager/feedback-reports*', async route => {
        await route.fulfill({ json: { data: mockFeedbackReports } });
      });

      await page.route('**/api/manager/feedback-reports/*/approve', async route => {
        // When manager approves, empty the list so it disappears from the UI
        mockFeedbackReports = [];
        await route.fulfill({ json: { message: 'Approved successfully' } });
      });
      await page.route('**/api/manager/schedules/completion-pending', async route => {
        await route.fulfill({ json: { data: { pending: [], groups: [] } } });
      });
      await page.route('**/api/manager/routes', async route => {
        await route.fulfill({ json: [] });
      });
      await page.route('**/api/manager/teams', async route => {
        await route.fulfill({ json: [] });
      });

      // 3. Mock Complaints API for Manager
      await page.route('**/api/manager/complaints', async route => {
        await route.fulfill({ json: [
          {
            id: 'complaint-301',
            title: 'Rác ngập tràn chưa dọn',
            description: 'Rác bốc mùi hôi thối ở đầu hẻm',
            type: 'Rác chưa dọn',
            city: 'Đà Nẵng',
            ward: 'Phường Mỹ An',
            neighborhood: 'Tổ 12',
            status: 'open',
            created_at: new Date().toISOString()
          }
        ] });
      });

      // Log in
      await loginPage.navigateTo('/login');
      await loginPage.fillCredentials('manager@test.com', 'AnyPassword123');
      await loginPage.submitBtn.first().click();

      // Wait for navigation to /dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify Manager Dashboard loaded
      await expect(page.locator('text=Test Manager').first()).toBeVisible();

      // Verify Complaint section loaded
      await expect(page.locator('text=Phản ánh cư dân').first()).toBeVisible();
      await expect(page.locator('text=Rác ngập tràn chưa dọn').first()).toBeVisible();
      
    });

    await test.step('Step 2: Review and Approve Collector Feedback', async () => {
      // Scroll the Feedback Report section into view so the user can see it
      const reportTitle = page.locator('text=Phản ánh chờ duyệt').first();
      await reportTitle.scrollIntoViewIfNeeded();

      // Verify the Feedback Report is visible in the list
      await expect(reportTitle).toBeVisible();
      await expect(page.locator('text=Thùng rác hỏng tại ngã tư').first()).toBeVisible();

      // Pause for 2 seconds BEFORE clicking so the user can see the item is there
      await page.waitForTimeout(2000);

      // Click the "Duyệt" (Approve) button
      const approveButton = page.locator('button:has-text("Duyệt")').first();
      await approveButton.click();

      // Verify the success message appears
      await expect(page.locator('text=Đã duyệt phản ánh. Cư dân sẽ nhận thông báo.').first()).toBeVisible();

      // Verify that the report actually disappeared from the UI!
      await expect(page.locator('text=Thùng rác hỏng tại ngã tư').first()).toBeHidden();

      // Pause for 5 seconds to let the user view the result
      await page.waitForTimeout(5000);
    });
  });
});
