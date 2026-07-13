const { BasePage } = require('./BasePage');
const { expect } = require('@playwright/test');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.submitBtn = page.locator('button[type="submit"]');
    this.form = page.locator('form');
  }

  async verifyFormVisible() {
    await expect(this.form).toBeVisible();
    await expect(this.emailInput.first()).toBeVisible();
    await expect(this.passwordInput.first()).toBeVisible();
  }

  async fillCredentials(email, password) {
    await this.emailInput.first().fill(email);
    await this.passwordInput.first().fill(password);
  }

  async verifySubmitButtonExists() {
    await expect(this.submitBtn.first()).toBeVisible();
  }
}

module.exports = { LoginPage };
