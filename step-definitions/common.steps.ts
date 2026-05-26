import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/world';

/**
 * Map of friendly page names to the relative URL inside the TTACart app.
 */
const PAGE_PATHS: Record<string, string> = {
  login: 'index.html',
  products: 'inventory.html',
  inventory: 'inventory.html',
  cart: 'cart.html',
  'checkout-one': 'checkout-step-one.html',
  'checkout-two': 'checkout-step-two.html',
  'checkout-complete': 'checkout-complete.html'
};

function resolvePagePath(name: string): string {
  const key = name.toLowerCase();
  const target = PAGE_PATHS[key];
  if (!target) {
    throw new Error(`Unknown page name "${name}". Known: ${Object.keys(PAGE_PATHS).join(', ')}`);
  }
  return target;
}

Given('I am on the {string} page', async function (this: ICustomWorld, name: string) {
  if (!this.page || !this.loginPage) throw new Error('Browser was not initialised.');
  const path = resolvePagePath(name);
  await this.loginPage.goto(path);
});

Given('I am logged in as {string}', async function (this: ICustomWorld, user: string) {
  if (!this.loginPage) throw new Error('Login page not initialised.');
  await this.loginPage.goto();
  await this.loginPage.loginAndWait(user, process.env.TTA_PASSWORD || 'tta_secret');
});

Then('I see {string}', async function (this: ICustomWorld, text: string) {
  if (!this.page) throw new Error('Page not initialised.');
  await expect(this.page.getByText(text, { exact: false }).first()).toBeVisible();
});

Then('I should see the page title {string}', async function (this: ICustomWorld, title: string) {
  if (!this.page) throw new Error('Page not initialised.');
  const heading = this.page.locator('[data-test="title"]');
  await expect(heading).toHaveText(new RegExp(title, 'i'), { timeout: 10_000 });
});
