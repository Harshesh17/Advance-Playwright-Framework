import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/world';

Then('I should see {int} items in the cart', async function (this: ICustomWorld, expected: number) {
  if (!this.cartPage) throw new Error('Cart page not initialised.');
  await this.cartPage.waitUntilReady();
  const count = await this.cartPage.itemCount();
  expect(count).toBe(expected);
});

When('I proceed to checkout', async function (this: ICustomWorld) {
  if (!this.cartPage) throw new Error('Cart page not initialised.');
  await this.cartPage.proceedToCheckout();
});

When(
  'I fill in checkout details with first name {string} last name {string} and postal code {string}',
  async function (this: ICustomWorld, first: string, last: string, postal: string) {
    if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
    await this.checkoutPage.expectInfoFormVisible();
    await this.checkoutPage.fillInformation({ firstName: first, lastName: last, postal });
  }
);

When('I continue to the overview', async function (this: ICustomWorld) {
  if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
  await this.checkoutPage.continueToOverview();
});

Then('I should see the checkout error {string}', async function (this: ICustomWorld, message: string) {
  if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
  const text = await this.checkoutPage.getErrorText();
  expect(text).toBe(message);
});

Then('I should see the order overview', async function (this: ICustomWorld) {
  if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
  await this.checkoutPage.expectOverviewVisible();
});

When('I finish the order', async function (this: ICustomWorld) {
  if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
  await this.checkoutPage.finishOrder();
});

Then('I should see the success message {string}', async function (this: ICustomWorld, message: string) {
  if (!this.checkoutPage) throw new Error('Checkout page not initialised.');
  await this.checkoutPage.expectSuccess();
  const headline = await this.checkoutPage.getSuccessMessage();
  expect(headline).toBe(message);
});

Then('the overview total should equal subtotal plus tax', async function (this: ICustomWorld) {
  if (!this.page || !this.checkoutPage) throw new Error('Checkout page not initialised.');
  await this.checkoutPage.expectOverviewVisible();

  const subtotalText = (await this.page.locator('[data-test="subtotal-label"]').textContent()) || '';
  const taxText = (await this.page.locator('[data-test="tax-label"]').textContent()) || '';
  const totalText = (await this.page.locator('[data-test="total-label"]').textContent()) || '';

  const num = (t: string) => Number.parseFloat(t.replace(/[^0-9.]/g, ''));
  const subtotal = num(subtotalText);
  const tax = num(taxText);
  const total = num(totalText);

  // TTACart rounds each component, so allow a 1-cent rounding tolerance.
  expect(Math.abs(total - (subtotal + tax))).toBeLessThanOrEqual(0.01);
});
