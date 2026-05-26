import type { PlaywrightTestConfig } from '@playwright/test';

/**
 * Playwright configuration consumed by the BasePage helper and by anyone
 * who wants to run a standalone Playwright sanity check. The Cucumber
 * runner uses these values via support/world.ts.
 */
const config: PlaywrightTestConfig = {
  testDir: './features',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 2,
  use: {
    baseURL: process.env.BASE_URL || 'https://app.thetestingacademy.com/playwright/ttacart/index.html',
    headless: process.env.HEADED !== 'true',
    viewport: { width: 1366, height: 820 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  }
};

export default config;
