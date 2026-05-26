import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Login screen for TTACart. The app exposes a `data-test="..."` hook on
 * every interactive element, so locators stay short and resilient.
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.byTestId('username');
    this.passwordInput = this.byTestId('password');
    this.loginButton = this.byTestId('login-button');
    this.errorBanner = this.byTestId('error');
  }

  async open(): Promise<void> {
    await this.goto();
  }

  async login(user: string, pass: string): Promise<void> {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.loginButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.byTestId('login-container')).toBeVisible();
  }

  async getErrorText(): Promise<string> {
    await this.errorBanner.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.errorBanner.textContent())?.trim() ?? '';
  }

  /**
   * Convenience wrapper that performs a login and waits for either the
   * products grid or the error banner so callers do not have to. The
   * URL match is intentionally permissive because the production host
   * (Cloudflare Pages) strips the trailing `.html`.
   */
  async loginAndWait(user: string, pass: string): Promise<void> {
    await this.login(user, pass);
    await Promise.race([
      this.page.waitForURL((url) => /inventory(\.html)?$/i.test(url.pathname), {
        timeout: 20_000
      }),
      this.errorBanner.waitFor({ state: 'visible', timeout: 20_000 })
    ]);
  }
}
