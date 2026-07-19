const { defineConfig, devices } = require('@playwright/test');
const { readConfig } = require('./utils/ConfigReader');
const { createProjectUse } = require('./utils/DriverFactory');

const envConfig = readConfig();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: createProjectUse(envConfig),
  webServer: [
    {
      command: 'npm run frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      command: 'npm run admin-frontend',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
});
