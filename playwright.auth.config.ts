import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth-browser',
  outputDir: 'test-results/auth-browser',
  workers: 2,
  use: {
    baseURL: 'http://localhost:5175',
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
  webServer: {
    command: 'pnpm --filter @agendaflex/web dev --port 5175',
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://auth-fixture.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-fixture',
      VITE_API_URL: 'http://127.0.0.1:3002',
    },
    url: 'http://localhost:5175',
    reuseExistingServer: false,
  },
});
