import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/billing-browser',
  outputDir: 'test-results/billing-browser',
  workers: 1,
  use: {
    baseURL: 'http://localhost:5178',
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          launchOptions: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          },
        }
      : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'pnpm exec tsx tests/fixtures/billing-server.ts',
      url: 'http://127.0.0.1:3003/health',
      reuseExistingServer: false,
      env: { BILLING_BROWSER_FIXTURE: '1' },
    },
    {
      command: 'pnpm --filter @agendaflex/web dev --port 5178',
      url: 'http://localhost:5178',
      reuseExistingServer: false,
      env: {
        VITE_SUPABASE_URL: 'https://billing-fixture.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
        VITE_API_URL: 'http://127.0.0.1:3003',
      },
    },
  ],
});
