const { devices } = require('@playwright/test');

/** Playwright equivalent of DriverFactory. */
function createProjectUse(config) {
  const deviceName = config.device || 'Desktop Chrome';
  const device = devices[deviceName];
  if (!device) throw new Error(`Unsupported Playwright device: ${deviceName}`);

  return {
    ...device,
    baseURL: config.baseURL,
    headless: config.headless,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    launchOptions: { slowMo: Number(config.slowMo || 0) },
  };
}

module.exports = { createProjectUse };
