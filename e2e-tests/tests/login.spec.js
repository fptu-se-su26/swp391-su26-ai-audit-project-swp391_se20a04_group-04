import { test, expect } from '@playwright/test';
const { LoginPage } = require('../pages/LoginPage');

test.describe('EcoSchedule Login Page Scenarios', () => {

  test('Execute all login scenarios sequentially in one tab', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Scenario 1: Blank credentials validation', async () => {
      await loginPage.navigateTo('/login');
      // Click submit without filling anything
      await loginPage.submitBtn.first().click();

      // Verify client-side validation errors
      await expect(page.locator('text=Email không được bỏ trống').first()).toBeVisible();
      await expect(page.locator('text=Mật khẩu không được bỏ trống').first()).toBeVisible();
      
      // Pause briefly for user to see
      await page.waitForTimeout(1000);
    });

    await test.step('Scenario 2: Wrong email and password format', async () => {
      // Reload page to clear previous state
      await loginPage.navigateTo('/login');

      // Fill invalid email format (bypass HTML5 but fail custom regex) and short password
      await loginPage.fillCredentials('invalid@email', '12345');
      await loginPage.submitBtn.first().click();

      // Verify format validation errors
      await expect(page.locator('text=Định dạng email không hợp lệ').first()).toBeVisible();
      await expect(page.locator('text=Mật khẩu phải có tối thiểu 6 ký tự').first()).toBeVisible();
      
      await page.waitForTimeout(1000);
    });

    await test.step('Scenario 3: Invalid credentials API response', async () => {
      await loginPage.navigateTo('/login');

      // Mock the backend API to return a 401 Unauthorized error
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          json: { error: 'Tên đăng nhập hoặc mật khẩu không đúng.' }
        });
      });

      await loginPage.fillCredentials('wrong@test.com', 'wrongpassword');
      await loginPage.submitBtn.first().click();

      // Verify the error toast/banner appears at the top
      await expect(page.locator('text=Tên đăng nhập hoặc mật khẩu không đúng.').first()).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      // Unroute so it doesn't affect the next test
      await page.unroute('**/api/auth/login');
    });

    await test.step('Scenario 4: Successful login redirection', async () => {
      await loginPage.navigateTo('/login');

      // Mock the backend API to return a successful Resident login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          json: {
            user: { id: 1, email: 'resident@test.com', role: 'resident', fullName: 'Test Resident' },
            token: 'mock-valid-token'
          }
        });
      });

      await loginPage.fillCredentials('resident@test.com', 'CorrectPassword123!');
      await loginPage.submitBtn.first().click();

      // Verify the success message appears
      await expect(page.locator('text=Đăng nhập thành công').first()).toBeVisible();

      // Wait for the redirect to happen (wait for URL to not contain /login)
      await page.waitForURL(url => !url.href.includes('/login'));
      
      await page.waitForTimeout(1000);
    });
  });
});
