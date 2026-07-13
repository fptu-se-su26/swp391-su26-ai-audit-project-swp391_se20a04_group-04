import { test, expect } from '@playwright/test';
const { HomePage } = require('../pages/HomePage');
const { LoginPage } = require('../pages/LoginPage');

test.describe('EcoSchedule Resident Role Mock', () => {

  test('Execute Resident mock login and schedule lookup', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    await test.step('Step 1: Setup Resident Login Mock', async () => {
      // Intercept the login API request and return a mock Resident user
      await page.route('**/api/auth/login', async route => {
        const json = {
          user: {
            uid: 'mock-resident-id',
            email: 'resident@test.com',
            fullName: 'Test Resident',
            role: 'resident',
            address: 'Đà Nẵng'
          },
          token: 'mock-jwt-token-resident'
        };
        await route.fulfill({ json });
      });

      await loginPage.navigateTo('/login');
      await loginPage.fillCredentials('resident@test.com', 'AnyPassword123');
      await loginPage.submitBtn.first().click();

      // Ensure redirection off the login page
      await page.waitForURL('**/');
      
      // The user name should appear somewhere in the DOM after successful login (usually Header)
      await expect(page.locator('text=Test Resident').first()).toBeVisible();
    });

    await test.step('Step 2: Resident Schedule Lookup (Đà Nẵng - Sơn Trà)', async () => {
      // Mock the address and schedules APIs since backend might be offline
      await page.route('**/api/address/provinces', async route => {
        await route.fulfill({ json: [{ code: '48', name: 'Thành phố Đà Nẵng' }] });
      });

      await page.route('**/api/address/wards*', async route => {
        await route.fulfill({ json: [{ code: '123', name: 'Phường An Hải Tây', districtName: 'Quận Sơn Trà' }] });
      });

      await page.route('**/api/schedules*', async route => {
        await route.fulfill({ json: [{ 
          id: 1, 
          schedule_date: "2026-07-20T17:00:00Z", 
          time_slot: "17:00 - 19:00", 
          neighborhood: "Khu vực thử nghiệm", 
          ward: "Phường An Hải Tây", 
          status: "Hoàn thành", 
          service_type: "General" 
        }] });
      });
      
      // Also mock the upcoming schedules API to prevent errors
      await page.route('**/api/resident/upcoming-schedules', async route => {
        await route.fulfill({ json: [] });
      });

      await page.goto('/tra-cuu');
      await expect(page).toHaveURL(/.*\/tra-cuu/);

      // Select "Thành phố Đà Nẵng" from the first dropdown
      const provinceSelect = page.locator('select').first();
      await provinceSelect.selectOption({ label: 'Thành phố Đà Nẵng' });

      // Wait a moment for wards to load (simulating network)
      await page.waitForTimeout(1000);

      const wardSelect = page.locator('select').nth(1);
      
      const options = await wardSelect.locator('option').allTextContents();
      const sonTraOption = options.find(opt => opt.includes('Sơn Trà'));
      
      if (sonTraOption) {
        await wardSelect.selectOption({ label: sonTraOption });
      }

      // Click "Tra cứu lịch"
      const searchButton = page.locator('button[type="submit"]');
      await searchButton.click();

      await expect(page.locator('text=Lịch thu gom rác tìm thấy').first()).toBeVisible({ timeout: 10000 });

      // Pause for 2 seconds to let the user view the result
      await page.waitForTimeout(2000);
    });
  });
});
