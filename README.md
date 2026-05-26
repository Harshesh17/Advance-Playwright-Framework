# Cucumber BDD + Playwright + POM (TypeScript)

End-to-end framework targeting **TTACart** by The Testing Academy at
`https://app.thetestingacademy.com/playwright/ttacart/index.html`.

- BDD with Cucumber.js 10
- Playwright 1.49 for the browser driver
- Strict TypeScript (ES2022, `strict: true`)
- Page Object Model with a shared `BasePage`
- Screenshot-on-failure attached to the HTML report
- Multi-environment config via `.env.<NODE_ENV>` files
- GitHub Actions matrix on `smoke` and `regression`

---

## Quick start

```bash
git clone https://github.com/PramodDutta/Advance-Playwright-Framework.git
cd Advance-Playwright-Framework
git checkout cucumber-bdd-pom
cp .env.example .env
npm install
npm test
```

`postinstall` automatically downloads the Chromium browser binary the first
time you run `npm install`.

---

## Layout

```
.
+-- features/                Gherkin specs
+-- step-definitions/        Cucumber glue code (TypeScript)
+-- pages/                   Page Object Model
+-- support/                 World, hooks, env loader
+-- scripts/                 Report helpers
+-- cucumber.js              Cucumber runner config
+-- playwright.config.ts     Playwright defaults consumed by hooks
+-- tsconfig.json            Strict TS, ES2022 target
+-- .github/workflows/       CI matrix
```

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm test` | Run every feature with the default profile (parallel 2). |
| `npm run test:smoke` | Run only `@smoke` scenarios. |
| `npm run test:regression` | Run only `@regression` scenarios. |
| `npm run test:wip` | Run only `@wip` scenarios (single worker). |
| `npm run test:dev` | `NODE_ENV=dev` (loads `.env.dev`). |
| `npm run test:staging` | `NODE_ENV=staging` (loads `.env.staging`). |
| `npm run test:prod` | `NODE_ENV=prod` (loads `.env.prod`). |
| `npm run typecheck` | `tsc --noEmit` - no compilation needed. |
| `npm run report` | Print paths and totals for the last HTML/JSON report. |

---

## Tag examples

```bash
# Quick smoke pass
npm run test:smoke

# Full regression
npm run test:regression

# Single feature
npx cucumber-js features/login.feature

# Tagged subset (built-in profile)
npx cucumber-js --profile smoke

# Custom tag expression
npx cucumber-js --tags "@checkout and not @wip"
```

---

## Multi-environment example

Create `.env.staging`:

```env
STAGING_BASE_URL=https://staging.example.com/playwright/ttacart/index.html
TTA_PASSWORD=tta_secret
```

Then:

```bash
NODE_ENV=staging npm test
# or
npm run test:staging
```

The env loader picks `.env.<NODE_ENV>` first, then falls back to `.env`.
`<ENV>_BASE_URL` overrides plain `BASE_URL` when `NODE_ENV` is set.

---

## TTACart users

All passwords are `tta_secret` (see TTACart source).

| Username | Behaviour |
| --- | --- |
| `standard_user` | Happy-path shopper |
| `locked_out_user` | Cannot sign in |
| `problem_user` | UI quirks (mis-aligned images, sort disabled) |
| `performance_glitch_user` | ~4s artificial delay on login |
| `error_user` | Random no-op on add-to-cart |
| `visual_user` | Visual regression style quirks |

---

## Reports

After a run:

- HTML report: `reports/cucumber-report.html`
- JSON report: `reports/cucumber-report.json`
- Screenshots on failure: `screenshots/*.png` (also attached to the HTML
  report so reviewers can hover and view them in-line).

Run `npm run report` to print summary counts.

---

## Continuous Integration

`.github/workflows/cucumber.yml` runs the suite on every push and PR with a
two-leg matrix (`smoke`, `regression`). Reports and failure screenshots are
uploaded as workflow artifacts.

---

Built by The Testing Academy.
