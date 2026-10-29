import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/mobile-browser',
  outputDir: 'test-results/mobile-preview',
  workers: 2,
  use: {
    baseURL: 'http://localhost:5177',
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
    command:
      'pnpm --filter @agendaflex/web mobile:preview && pnpm --filter @agendaflex/web exec vite preview --port 5177 --strictPort',
    url: 'http://localhost:5177',
    reuseExistingServer: false,
  },
});
