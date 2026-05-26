import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Inventory ("Products") page. Provides sort, add-to-cart, remove, and
 * a couple of helpers used by feature steps for assertions.
 */
export class ProductsPage extends BasePage {
  readonly title: Locator;
  readonly sortDropdown: Locator;
  readonly inventoryContainer: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = this.byTestId('title');
    this.sortDropdown = this.byTestId('product-sort-container');
    this.inventoryContainer = this.byTestId('inventory-container');
    this.cartBadge = this.byTestId('shopping-cart-badge');
    this.cartLink = this.byTestId('shopping-cart-link');
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.title).toHaveText(/Products/i, { timeout: 15_000 });
    await expect(this.inventoryContainer).toBeVisible();
  }

  async sortBy(opt: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(opt);
  }

  /**
   * Filters the visible items by their displayed name and returns the
   * matching locator. Pure DOM filter: TTACart does not have a server
   * search, so this just keeps tests readable.
   */
  filterByName(name: string): Locator {
    return this.page
      .locator('[data-test="inventory-item"]')
      .filter({ has: this.page.getByText(name, { exact: false }) });
  }

  productCard(productId: string): Locator {
    return this.page.locator(`[data-test="inventory-item"]`).filter({
      has: this.page.locator(`[data-test="add-to-cart-${productId}"], [data-test="remove-${productId}"]`)
    });
  }

  async addToCart(productId: string): Promise<void> {
    const addBtn = this.page.locator(`[data-test="add-to-cart-${productId}"]`);
    await addBtn.click();
  }

  async removeFromCart(productId: string): Promise<void> {
    const removeBtn = this.page.locator(`[data-test="remove-${productId}"]`);
    await removeBtn.click();
  }

  async itemCount(): Promise<number> {
    return this.page.locator('[data-test="inventory-item"]').count();
  }

  async cartCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible().catch(() => false))) return 0;
    const text = (await this.cartBadge.textContent())?.trim() ?? '0';
    return Number.parseInt(text, 10) || 0;
  }

  async productNames(): Promise<string[]> {
    const handles = await this.page.locator('[data-test="inventory-item-name"]').all();
    const names: string[] = [];
    for (const h of handles) {
      const t = (await h.textContent())?.trim();
      if (t) names.push(t);
    }
    return names;
  }

  async productPrices(): Promise<number[]> {
    const handles = await this.page.locator('[data-test="inventory-item-price"]').all();
    const prices: number[] = [];
    for (const h of handles) {
      const t = (await h.textContent())?.trim() ?? '';
      const n = Number.parseFloat(t.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(n)) prices.push(n);
    }
    return prices;
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
