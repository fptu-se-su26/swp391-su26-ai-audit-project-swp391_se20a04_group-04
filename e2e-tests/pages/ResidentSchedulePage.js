const { expect } = require('@playwright/test');
const { BasePage } = require('../base/BasePage');

class ResidentSchedulePage extends BasePage {
  constructor(page) {
    super(page);
    this.provinceSelect = page.locator('select').first();
    this.wardSelect = page.locator('select').nth(1);
    this.searchButton = page.locator('button[type="submit"]');
    this.resultTitle = page.getByText('Lịch thu gom rác tìm thấy', { exact: false }).first();
  }

  async open() {
    await this.navigateTo('/tra-cuu');
    await expect(this.page).toHaveURL(/.*\/tra-cuu/);
  }

  async selectProvince(label) {
    await this.provinceSelect.selectOption({ label });
  }

  async selectWardContaining(keyword) {
    await expect(this.wardSelect).toBeEnabled();
    const options = await this.wardSelect.locator('option').allTextContents();
    const label = options.find((option) => option.includes(keyword));
    if (!label) throw new Error(`Không tìm thấy ward chứa: ${keyword}`);
    await this.wardSelect.selectOption({ label });
  }

  async search() {
    await this.searchButton.click();
  }

  async verifyScheduleFound() {
    await expect(this.resultTitle).toBeVisible({ timeout: 10000 });
  }
}

module.exports = { ResidentSchedulePage };
