import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: 1000, // Slows down Playwright operations by 1000ms so you can see what is happening
    },
  },

  projects: [
    {
      name: 'frontend',
      testMatch: /.*\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },

    },
  ],

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
