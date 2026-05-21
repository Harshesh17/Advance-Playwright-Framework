# TTACart - Playwright TypeScript suite

This branch (`ttacart`) ships an end-to-end Playwright TypeScript suite that exercises the **TTACart** demo at
[`https://app.thetestingacademy.com/playwright/ttacart/`](https://app.thetestingacademy.com/playwright/ttacart/).

It follows the 10-box architecture diagram on the [TTA Advance Framework page](https://app.thetestingacademy.com/playwright/advance-framework.html):
Page Objects + Fixtures + Util layer + Data factory + File reader + Logger + CI sharding + Allure + HTML report + GitHub Pages.

---

## Quick start

```bash
git clone https://github.com/PramodDutta/Advance-Playwright-Framework.git
cd Advance-Playwright-Framework
git checkout ttacart

npm install
npx playwright install --with-deps

# default target - the live TTA QA environment
npx playwright test src/tests/ttacart
```

### Switch environment

| Variable        | Resolves to                                |
| --------------- | ------------------------------------------ |
| `TTA_ENV=qa`    | `https://app.thetestingacademy.com` (default) |
| `TTA_ENV=stage` | `https://stage.thetestingacademy.com`         |
| `TTA_ENV=local` | `http://localhost:3000`                       |
| `BASE_URL=...`  | overrides everything                          |

```bash
TTA_ENV=qa    npx playwright test src/tests/ttacart
TTA_ENV=local npx playwright test src/tests/ttacart
```

### Useful scripts

```bash
npm run test:smoke        # only specs tagged @smoke
npm run test:regression   # only specs tagged @regression
npm run test:e2e          # only specs tagged @e2e
npm run test:ttacart      # all TTACart specs across all projects
npm run typecheck         # tsc --noEmit
npm run report            # open HTML report from last run
npm run report:allure     # generate + open Allure report
```

### Shard locally

```bash
SHARD=1/4 npm run test:shard
SHARD=2/4 npm run test:shard
SHARD=3/4 npm run test:shard
SHARD=4/4 npm run test:shard
```

---

## Test users

Password for all users: `tta_secret`

| Username                  | Behaviour                                                                |
| ------------------------- | ------------------------------------------------------------------------ |
| `standard_user`           | Happy path                                                                |
| `locked_out_user`         | Login fails with "Epic sadface: Sorry, this user has been locked out."   |
| `problem_user`            | Images swap, sort dropdown ignored, first-name auto-clears on continue   |
| `performance_glitch_user` | Login takes 4 seconds                                                    |
| `error_user`              | Random 30% no-op on Add-to-cart                                          |
| `visual_user`             | Cart badge shifted 8px, button color drifted                             |

---

## Tags

Specs are tagged for quick filtering. A spec can carry more than one tag.

| Tag           | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `@smoke`      | Critical happy-path coverage, must pass on every PR               |
| `@regression` | Broader edge-case coverage, runs nightly + on release branches    |
| `@e2e`        | Full multi-page user journeys                                     |

Run with `--grep @smoke` (or the matching npm script).

---

## TTACart pages and their `data-test` selectors

| Page             | Path                                                  | Key selectors                                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login            | `/playwright/ttacart/index.html`                      | `username`, `password`, `login-button`, `error`                                                                                                                                                                                     |
| Inventory        | `/playwright/ttacart/inventory.html`                  | `product-sort-container`, `inventory-item`, `inventory-item-name`, `inventory-item-price`, `add-to-cart-<id>`, `remove-<id>`, `shopping-cart-badge`, `shopping-cart-link`                                                            |
| Item detail      | `/playwright/ttacart/inventory-item.html?id=<id>`     | `inventory-item-name`, `inventory-item-price`, `add-to-cart`, `remove`, `back-to-products`                                                                                                                                          |
| Cart             | `/playwright/ttacart/cart.html`                       | `inventory-item`, `inventory-item-name`, `continue-shopping`, `checkout`, `remove-<id>`                                                                                                                                             |
| Checkout step 1  | `/playwright/ttacart/checkout-step-one.html`          | `firstName`, `lastName`, `postalCode`, `cancel`, `continue`, `error`                                                                                                                                                                |
| Checkout step 2  | `/playwright/ttacart/checkout-step-two.html`          | `subtotal-label`, `tax-label`, `total-label`, `cancel`, `finish`                                                                                                                                                                    |
| Checkout complete| `/playwright/ttacart/checkout-complete.html`          | `complete-header`, `complete-text`, `pony-express`, `back-to-products`                                                                                                                                                              |
| Side menu        | injected on every page                                | `open-menu`, `close-menu`, `logout-sidebar-link`, `reset-sidebar-link`, `inventory-sidebar-link`, `about-sidebar-link`                                                                                                              |

---

## Project layout

```
src/
  config/                # AppConfig (env loader, kept from main)
  fixtures/
    test-base.ts         # extends @playwright/test with POM fixtures
  pages/
    ttacart/             # one file per page + BasePage + barrel index
  testdata/
    ttacart/
      users.json
      products.csv
  tests/
    ttacart/
      login.spec.ts
      inventory.spec.ts
      cart.spec.ts
      checkout.spec.ts
      negative.spec.ts
      data-driven.spec.ts
  utils/
    UtilElementLocator.ts   # thin wrapper for actions + timeouts
    Logger.ts               # console + file transport (logs/run-*.log)
    DataFactory.ts          # Faker-based generators
    FileReader.ts           # JSON / CSV / XLSX readers
```

---

## Reports

| Reporter      | Where it lands                                                                |
| ------------- | ----------------------------------------------------------------------------- |
| HTML          | `playwright-report/index.html` (open via `npm run report`)                    |
| JSON          | `test-results/results.json`                                                   |
| Allure        | `allure-results/` (open via `npm run report:allure`)                           |
| Console list  | streams to stdout                                                              |
| Custom TTA    | streams structured step logs - implemented in `src/utils/CustomTTAReporter.ts` |

In CI, every shard uploads its HTML, raw results, and Allure inputs as separate artefacts, and the
`merge-reports` job stitches them back into a single navigable report. When run on the `ttacart`
branch, that merged HTML report is also published to GitHub Pages.

---

## Architecture diagram

The 10-box reference architecture is hosted at
[https://app.thetestingacademy.com/playwright/advance-framework.html](https://app.thetestingacademy.com/playwright/advance-framework.html).
Each box in that diagram has a 1:1 file under `src/`. Walk the diagram top-down while reading
this branch and the layers will line up.
