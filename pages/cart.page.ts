import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Cart screen. Lists everything the user added, supports remove, and
 * exposes Checkout / Continue Shopping links.
 */
export class CartPage extends BasePage {
  readonly title: Locator;
  readonly cartList: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = this.byTestId('title');
    this.cartList = this.byTestId('cart-list');
    this.checkoutButton = this.byTestId('checkout');
    this.continueShoppingButton = this.byTestId('continue-shopping');
  }

  async waitUntilReady(): Promise<void> {
    await expect(this.title).toHaveText(/Your Cart/i, { timeout: 10_000 });
  }

  async itemCount(): Promise<number> {
    return this.page.locator('[data-test="inventory-item"]').count();
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

  async removeItem(productId: string): Promise<void> {
    await this.page.locator(`[data-test="remove-${productId}"]`).click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
