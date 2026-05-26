import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared functionality for every page object: navigation helpers,
 * wait wrappers, and a screenshot helper that hooks can also call.
 */
export class BasePage {
  protected readonly defaultTimeout = 15_000;

  constructor(protected readonly page: Page) {}

  /**
   * Navigates to the supplied URL or, if a path is provided, joins it to
   * BASE_URL. Waits for the DOM to be ready before returning so steps do
   * not race against initial paint.
   */
  async goto(target?: string): Promise<void> {
    const base = process.env.BASE_URL || 'https://app.thetestingacademy.com/playwright/ttacart/index.html';
    const url = target ? this.resolve(target, base) : base;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  protected resolve(target: string, base: string): string {
    if (/^https?:\/\//i.test(target)) return target;
    try {
      return new URL(target, base).toString();
    } catch {
      return target;
    }
  }

  async waitForSelector(selector: string, timeout: number = this.defaultTimeout): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.first().waitFor({ state: 'visible', timeout });
    return locator;
  }

  async waitForUrlIncludes(fragment: string, timeout: number = this.defaultTimeout): Promise<void> {
    await this.page.waitForURL((url) => url.toString().includes(fragment), { timeout });
  }

  /**
   * Snapshot the current page to disk and return the buffer so hooks can
   * attach it to the Cucumber report.
   */
  async screenshot(name: string): Promise<Buffer> {
    const dir = path.resolve(process.cwd(), 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const safe = name.replace(/[^a-z0-9-_]+/gi, '_');
    const file = path.join(dir, `${safe}__${Date.now()}.png`);
    return this.page.screenshot({ path: file, fullPage: true });
  }

  async expectVisible(testId: string): Promise<void> {
    await expect(this.page.locator(`[data-test="${testId}"]`)).toBeVisible();
  }

  byTestId(testId: string): Locator {
    return this.page.locator(`[data-test="${testId}"]`);
  }

  /** Returns the browser tab title for the current page. */
  getDocumentTitle(): Promise<string> {
    return this.page.title();
  }
}
