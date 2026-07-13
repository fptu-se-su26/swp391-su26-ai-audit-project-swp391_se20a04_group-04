const { BasePage } = require('./BasePage');
const { expect } = require('@playwright/test');

class HomePage extends BasePage {
  constructor(page) {
    super(page);
    this.logoText = page.locator('header').locator('text=EcoSchedule');
    this.rootDiv = page.locator('#root');
    this.header = page.locator('header');
    this.loginBtn = page.getByRole('button', { name: 'Đăng nhập', exact: true });
  }

  async verifyLogoVisible() {
    await expect(this.logoText).toBeVisible();
    await expect(this.rootDiv).toBeVisible();
  }

  async verifyHeaderVisible() {
    await expect(this.header).toBeVisible();
  }
  
  async clickLogin() {
    await expect(this.loginBtn).toBeVisible();
    await this.loginBtn.click();
  }
}

module.exports = { HomePage };
