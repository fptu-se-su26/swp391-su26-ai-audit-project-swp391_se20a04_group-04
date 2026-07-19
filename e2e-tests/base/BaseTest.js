const { test: base, expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { LoginPage } = require('../pages/LoginPage');

/**
 * Playwright equivalent of BaseTest: provides reusable page objects through fixtures.
 */
const test = base.extend({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

module.exports = { test, expect };
