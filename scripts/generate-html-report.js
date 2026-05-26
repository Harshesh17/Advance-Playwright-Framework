#!/usr/bin/env node
/**
 * Lightweight wrapper that ensures the reports directory exists and then
 * tells the user where the Cucumber HTML report lives. Cucumber writes
 * the actual HTML at reports/cucumber-report.html (configured in
 * cucumber.js), so this script is mostly a convenience pointer + a
 * sanity check for CI.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(process.cwd(), 'reports');
const htmlPath = path.join(reportsDir, 'cucumber-report.html');
const jsonPath = path.join(reportsDir, 'cucumber-report.json');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const htmlExists = fs.existsSync(htmlPath);
const jsonExists = fs.existsSync(jsonPath);

if (!htmlExists && !jsonExists) {
  console.log('No Cucumber reports yet. Run "npm test" first.');
  process.exit(0);
}

if (htmlExists) {
  console.log('Cucumber HTML report: ' + htmlPath);
}
if (jsonExists) {
  console.log('Cucumber JSON report: ' + jsonPath);
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let scenarios = 0;
    let passed = 0;
    let failed = 0;
    data.forEach((feature) => {
      (feature.elements || []).forEach((scenario) => {
        scenarios += 1;
        const failedStep = (scenario.steps || []).some(
          (step) => step.result && step.result.status === 'failed'
        );
        if (failedStep) failed += 1;
        else passed += 1;
      });
    });
    console.log('Scenarios: ' + scenarios + ' | passed: ' + passed + ' | failed: ' + failed);
  } catch (err) {
    console.error('Could not parse JSON report: ' + err.message);
  }
}
