import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, timeout: 45_000,
  use: { baseURL, trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run preview -- --port 4173', url: baseURL, reuseExistingServer: !process.env.CI },
});
