import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/world';
import { SortOption } from '../pages/products.page';

const VALID_SORTS: SortOption[] = ['az', 'za', 'lohi', 'hilo'];

function isSortOption(value: string): value is SortOption {
  return (VALID_SORTS as string[]).includes(value);
}

Then('I should see {int} products in the grid', async function (this: ICustomWorld, expected: number) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await this.productsPage.waitUntilReady();
  const count = await this.productsPage.itemCount();
  expect(count).toBe(expected);
});

When('I sort the products by {string}', async function (this: ICustomWorld, opt: string) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  if (!isSortOption(opt)) {
    throw new Error(`Unknown sort option "${opt}". Use one of: ${VALID_SORTS.join(', ')}`);
  }
  await this.productsPage.waitUntilReady();
  await this.productsPage.sortBy(opt);
  // The DOM re-renders synchronously after the change, but we add a tiny
  // wait so any animation/JS settles before the assertion.
  await this.page!.waitForTimeout(150);
});

Then(
  'the products should be ordered {string} by {string}',
  async function (this: ICustomWorld, direction: string, key: string) {
    if (!this.productsPage) throw new Error('Products page not initialised.');
    if (key === 'name') {
      const names = await this.productsPage.productNames();
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      if (direction === 'ascending') expect(names).toEqual(sorted);
      else expect(names).toEqual(sorted.reverse());
    } else if (key === 'price') {
      const prices = await this.productsPage.productPrices();
      const sorted = [...prices].sort((a, b) => a - b);
      if (direction === 'ascending') expect(prices).toEqual(sorted);
      else expect(prices).toEqual([...sorted].reverse());
    } else {
      throw new Error(`Unsupported sort key "${key}".`);
    }
  }
);

Then(
  'the catalog should contain a product whose name includes {string}',
  async function (this: ICustomWorld, query: string) {
    if (!this.productsPage) throw new Error('Products page not initialised.');
    const matches = this.productsPage.filterByName(query);
    await expect(matches.first()).toBeVisible();
  }
);

// Single step definition; Cucumber matches Given/When/And against the
// same pool, so a When binding covers Given/And usage too.
When('I add product {string} to the cart', async function (this: ICustomWorld, id: string) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await this.productsPage.addToCart(id);
});

When('I remove product {string} from the cart', async function (this: ICustomWorld, id: string) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await this.productsPage.removeFromCart(id);
});

Then('the cart badge should show {string}', async function (this: ICustomWorld, value: string) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await expect(this.productsPage.cartBadge).toHaveText(value, { timeout: 5_000 });
});

Then('the cart badge should not be visible', async function (this: ICustomWorld) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await expect(this.productsPage.cartBadge).toHaveCount(0, { timeout: 5_000 });
});

When('I open the cart', async function (this: ICustomWorld) {
  if (!this.productsPage) throw new Error('Products page not initialised.');
  await this.productsPage.goToCart();
});
