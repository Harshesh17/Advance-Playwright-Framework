/**
 * Loads environment variables from .env.<NODE_ENV> first, then falls back
 * to plain .env. Imported once at the very top of cucumber.js so values
 * are present before step definitions evaluate.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const envName: string = process.env.NODE_ENV || 'dev';
const envFile = path.resolve(process.cwd(), `.env.${envName}`);
const fallback = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else if (fs.existsSync(fallback)) {
  dotenv.config({ path: fallback });
}

// Resolve a per-environment BASE_URL override (DEV_BASE_URL, STAGING_BASE_URL, etc.)
const upper = envName.toUpperCase();
const perEnv = process.env[`${upper}_BASE_URL`];
if (perEnv && !process.env.BASE_URL) {
  process.env.BASE_URL = perEnv;
} else if (perEnv) {
  // If a generic BASE_URL is also set, env-specific value wins when NODE_ENV is provided.
  process.env.BASE_URL = perEnv;
}

if (!process.env.BASE_URL) {
  process.env.BASE_URL = 'https://app.thetestingacademy.com/playwright/ttacart/index.html';
}

export const ACTIVE_ENV: string = envName;
export const BASE_URL: string = process.env.BASE_URL;
