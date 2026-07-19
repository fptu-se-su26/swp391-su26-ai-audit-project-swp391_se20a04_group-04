const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { ResidentSchedulePage } = require('../pages/ResidentSchedulePage');

test.describe('EcoSchedule Resident – POM', () => {
  test('Resident login và tra cứu lịch thu gom', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const schedulePage = new ResidentSchedulePage(page);

    await page.route('**/api/auth/login', (route) => route.fulfill({
      json: {
        user: { uid: 'mock-resident-id', email: 'resident@test.com', fullName: 'Test Resident', role: 'resident' },
        token: 'mock-jwt-token-resident'
      }
    }));
    await page.route('**/api/address/provinces', (route) => route.fulfill({
      json: [{ code: '48', name: 'Thành phố Đà Nẵng' }]
    }));
    await page.route('**/api/address/wards*', (route) => route.fulfill({
      json: [{ code: '123', name: 'Phường An Hải Tây', districtName: 'Quận Sơn Trà' }]
    }));
    await page.route('**/api/schedules*', (route) => route.fulfill({
      json: [{ id: 1, schedule_date: '2026-07-20T17:00:00Z', time_slot: '17:00 - 19:00', ward: 'Phường An Hải Tây', status: 'Hoàn thành' }]
    }));
    await page.route('**/api/resident/upcoming-schedules', (route) => route.fulfill({ json: [] }));

    await loginPage.navigateTo('/login');
    await loginPage.fillCredentials('resident@test.com', 'AnyPassword123');
    await loginPage.submitBtn.first().click();
    await page.waitForURL('**/');
    await expect(page.getByText('Test Resident').first()).toBeVisible();

    await schedulePage.open();
    await schedulePage.selectProvince('Thành phố Đà Nẵng');
    await schedulePage.selectWardContaining('Sơn Trà');
    await schedulePage.search();
    await schedulePage.verifyScheduleFound();
  });
});
