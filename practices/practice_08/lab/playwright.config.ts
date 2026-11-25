import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5178',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'python3 scripts/serve_api.py --port 8108 --temporary',
      url: 'http://127.0.0.1:8108/api/subscribers',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { PYTHONDONTWRITEBYTECODE: '1' },
    },
    {
      command: 'npm run dev -- --port 5178 --strictPort',
      url: 'http://127.0.0.1:5178',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { NOTIFY_API_TARGET: 'http://127.0.0.1:8108' },
    },
  ],
});
