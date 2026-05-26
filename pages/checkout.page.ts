import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postal: string;
}

/**
 * Drives all three checkout screens (info form, overview, success).
 */
export class CheckoutPage extends BasePage {
  // Step one (info form)
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorBanner: Locator;
  readonly cancelButton: Locator;

  // Step two (overview)
  readonly finishButton: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;

  // Step three (success)
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  // Page identity
  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.title = this.byTestId('title');
    this.firstNameInput = this.byTestId('firstName');
    this.lastNameInput = this.byTestId('lastName');
    this.postalCodeInput = this.byTestId('postalCode');
    this.continueButton = this.byTestId('continue');
    this.errorBanner = this.byTestId('error');
    this.cancelButton = this.byTestId('cancel');
    this.finishButton = this.byTestId('finish');
    this.subtotalLabel = this.byTestId('subtotal-label');
    this.taxLabel = this.byTestId('tax-label');
    this.totalLabel = this.byTestId('total-label');
    this.completeHeader = this.byTestId('complete-header');
    this.completeText = this.byTestId('complete-text');
    this.backHomeButton = this.byTestId('back-to-products');
  }

  // --- Step one ---
  async fillInformation(info: CheckoutInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postal);
  }

  async continueToOverview(): Promise<void> {
    await this.continueButton.click();
  }

  async getErrorText(): Promise<string> {
    await this.errorBanner.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.errorBanner.textContent())?.trim() ?? '';
  }

  async expectInfoFormVisible(): Promise<void> {
    await expect(this.title).toHaveText(/Checkout: Your Information/i, { timeout: 10_000 });
  }

  // --- Step two ---
  async expectOverviewVisible(): Promise<void> {
    await expect(this.title).toHaveText(/Checkout: Overview/i, { timeout: 10_000 });
  }

  async finishOrder(): Promise<void> {
    await this.finishButton.click();
  }

  async getTotal(): Promise<number> {
    const text = (await this.totalLabel.textContent()) ?? '';
    const n = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
    return Number.isNaN(n) ? 0 : n;
  }

  // --- Step three ---
  async expectSuccess(): Promise<void> {
    await expect(this.title).toHaveText(/Checkout: Complete/i, { timeout: 10_000 });
    await expect(this.completeHeader).toBeVisible();
  }

  async getSuccessMessage(): Promise<string> {
    return (await this.completeHeader.textContent())?.trim() ?? '';
  }
}
