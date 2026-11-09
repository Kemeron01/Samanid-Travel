import { defineConfig, devices } from '@playwright/test';

/**
 * E2E по сценариям 06 Prototype (63:2) + смоук админки.
 * Сайт и админка работают на моках (packages/api), поэтому тесты детерминированы и не требуют бэкенда.
 * Локально: dev-серверы переиспользуются; в CI поднимаются автоматически.
 */
const WEB = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
const ADMIN = process.env.E2E_ADMIN_URL ?? 'http://localhost:5174';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'ru-RU', timezoneId: 'Asia/Tashkent' },
  projects: [
    { name: 'desktop', testMatch: /(booking|waitlist)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: WEB } },
    { name: 'mobile', testMatch: /mobile\.spec\.ts/, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, baseURL: WEB } },
    { name: 'admin', testMatch: /admin\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: ADMIN } },
  ],
  webServer: [
    { command: 'pnpm --filter @samanid/web dev', url: WEB, reuseExistingServer: true, timeout: 180_000 },
    { command: 'pnpm --filter @samanid/admin dev', url: ADMIN, reuseExistingServer: true, timeout: 120_000 },
  ],
});
