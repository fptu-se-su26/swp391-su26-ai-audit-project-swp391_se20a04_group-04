import { test, expect } from '@playwright/test';
const { LoginPage } = require('../pages/LoginPage');

test.describe('EcoSchedule Collector Role Mock', () => {

  test('Execute Collector mock login and view pages', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Step 1: Setup Collector Login Mock and View Pages', async () => {
      // 1. Mock Login API
      await page.route('**/api/auth/login', async route => {
        const json = {
          user: { uid: 'mock-collector-id', email: 'collector@test.com', fullName: 'Test Collector', role: 'collector' },
          token: 'mock-jwt-token-collector'
        };
        await route.fulfill({ json });
      });

      // 2. Mock Dashboard Stats API
      await page.route('**/api/dashboard/collector*', async route => {
        await route.fulfill({ json: { data: { todayTotal: 5, todayCompleted: 2, todayPending: 3 } } });
      });

      // 3. Mock Schedules API (Lịch làm việc)
      await page.route('**/api/collector/schedules*', async route => {
        await route.fulfill({ json: { data: {
          items: [
            { 
              id: 101, 
              sourceType: 'route',
              routeName: 'Tuyến Sơn Trà 1', 
              startTime: '08:00',
              endTime: '10:00',
              status: 'assigned', 
              date: new Date().toISOString().slice(0, 10),
              ward: 'Phường An Hải Bắc'
            }
          ]
        } } });
      });

      // 4. Mock Assigned Reports API (Phản ánh chỉ định)
      await page.route('**/api/collector/reports', async route => {
        await route.fulfill({ json: { data: [
          { id: 201, title: 'Rác ngập tràn hẻm 12', description: 'Cần dọn dẹp gấp', status: 'assigned', ward: 'Phường An Hải Bắc', severity: 'high', category: 'garbage_overflow' }
        ] } });
      });

      await page.route('**/api/reports/*/comments', async route => {
        await route.fulfill({ json: { data: [] } }); // Empty comments for the report
      });

      // Log in
      await loginPage.navigateTo('/login');
      await loginPage.fillCredentials('collector@test.com', 'AnyPassword123');
      await loginPage.submitBtn.first().click();

      // Wait for navigation to /collector (Lịch làm việc page)
      await page.waitForURL('**/collector');
      
      // Verify Dashboard/Schedule loaded
      await expect(page.locator('text=Test Collector').first()).toBeVisible();
      await expect(page.locator('text=Tuyến Sơn Trà 1').first()).toBeVisible();

      // Navigate to Phản ánh chỉ định
      await page.goto('/collector/reports');
      await expect(page).toHaveURL(/.*\/collector\/reports/);
      
      // Verify Assigned Reports loaded
      await expect(page.locator('text=Phản ánh được giao').first()).toBeVisible();
      await expect(page.locator('text=Rác ngập tràn hẻm 12').first()).toBeVisible();

      // Pause for 2 seconds to let the user view the result
      await page.waitForTimeout(2000);
    });
  });
});
