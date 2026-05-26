// Cucumber.js configuration for the TTACart BDD framework.
// Loads ts-node so the runner can execute step definitions and support
// files written in TypeScript without a separate build step.

// Bootstrap environment variables synchronously. We cannot require() the
// TypeScript env-loader here without first having ts-node registered, so
// we replicate the .env.<NODE_ENV> resolution inline.
(function bootstrapEnv() {
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');

  const envName = process.env.NODE_ENV || 'dev';
  const envFile = path.resolve(process.cwd(), `.env.${envName}`);
  const fallback = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envFile)) dotenv.config({ path: envFile });
  else if (fs.existsSync(fallback)) dotenv.config({ path: fallback });

  const upper = envName.toUpperCase();
  const perEnv = process.env[`${upper}_BASE_URL`];
  if (perEnv) process.env.BASE_URL = perEnv;
  if (!process.env.BASE_URL) {
    process.env.BASE_URL =
      'https://app.thetestingacademy.com/playwright/ttacart/index.html';
  }
})();

const common = {
  requireModule: ['ts-node/register'],
  require: ['support/**/*.ts', 'step-definitions/**/*.ts'],
  paths: ['features/**/*.feature'],
  format: [
    'progress-bar',
    'summary',
    'html:reports/cucumber-report.html',
    'json:reports/cucumber-report.json'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  parallel: 2,
  retry: 0
};

module.exports = {
  default: common,
  smoke: {
    ...common,
    tags: '@smoke'
  },
  regression: {
    ...common,
    tags: '@regression'
  },
  wip: {
    ...common,
    tags: '@wip',
    parallel: 1
  }
};
