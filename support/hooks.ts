import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  ITestCaseHookParameter
} from '@cucumber/cucumber';
import { Browser, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { ICustomWorld } from './world';
import { LoginPage } from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';

setDefaultTimeout(60_000);

let browser: Browser;
const screenshotDir = path.resolve(process.cwd(), 'screenshots');

BeforeAll(async function () {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const slowMo = Number(process.env.SLOW_MO || 0);
  browser = await chromium.launch({
    headless: process.env.HEADED !== 'true',
    slowMo: Number.isFinite(slowMo) ? slowMo : 0
  });
});

Before(async function (this: ICustomWorld) {
  this.browser = browser;
  this.context = await browser.newContext({
    viewport: { width: 1366, height: 820 },
    baseURL: this.baseURL
  });
  this.page = await this.context.newPage();

  // Lazy page-object wiring so steps can just say `this.loginPage`.
  this.loginPage = new LoginPage(this.page);
  this.productsPage = new ProductsPage(this.page);
  this.cartPage = new CartPage(this.page);
  this.checkoutPage = new CheckoutPage(this.page);
});

After(async function (this: ICustomWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    const safeName = (scenario.pickle.name || 'scenario').replace(/[^a-z0-9-_]+/gi, '_');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(screenshotDir, `${safeName}__${ts}.png`);
    try {
      const buffer = await this.page.screenshot({ path: file, fullPage: true });
      await this.attach(buffer, 'image/png');
    } catch {
      // ignore screenshot errors so they do not mask the underlying failure
    }
  }
  await this.page?.close().catch(() => undefined);
  await this.context?.close().catch(() => undefined);
});

AfterAll(async function () {
  await browser?.close().catch(() => undefined);
});
