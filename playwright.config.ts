import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Resolve baseURL from TTA_ENV.
 *
 *   TTA_ENV=qa     -> https://app.thetestingacademy.com         (default)
 *   TTA_ENV=stage  -> https://stage.thetestingacademy.com
 *   TTA_ENV=local  -> http://localhost:3000
 *
 * BASE_URL is still honoured for backwards compatibility with the
 * pre-existing non-TTA specs in this repo.
 */
function resolveBaseURL(): string {
    if (process.env.BASE_URL) return process.env.BASE_URL;
    const env = (process.env.TTA_ENV || 'qa').toLowerCase();
    switch (env) {
        case 'local':
            return 'http://localhost:3000';
        case 'stage':
            return 'https://stage.thetestingacademy.com';
        case 'qa':
        default:
            return 'https://app.thetestingacademy.com';
    }
}

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './src/tests',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 4 : 6,

    reporter: [
        ['./src/utils/CustomTTAReporter.ts'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['allure-playwright', { outputFolder: 'allure-results' }],
        ['list'],
    ],

    use: {
        baseURL: resolveBaseURL(),
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },

    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ],
});
