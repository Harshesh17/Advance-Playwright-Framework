import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ICustomWorld } from '../support/world';

When(
  'I login as {string} with password {string}',
  async function (this: ICustomWorld, user: string, pass: string) {
    if (!this.loginPage) throw new Error('Login page not initialised.');
    await this.loginPage.login(user, pass);
  }
);

/**
 * Builds a regex that matches either `<page>` or `<page>.html` at the end
 * of the URL pathname. The TTACart production host (Cloudflare Pages)
 * strips the trailing `.html`, but the local dev build keeps it.
 */
function pageMatcher(name: string): RegExp {
  const slug = name.toLowerCase();
  const target = slug === 'products' ? 'inventory' : slug;
  return new RegExp(`${target}(\\.html)?$`, 'i');
}

Then('I should land on the {string} page', async function (this: ICustomWorld, name: string) {
  if (!this.page) throw new Error('Page not initialised.');
  const re = pageMatcher(name);
  await this.page.waitForURL((url) => re.test(url.pathname), { timeout: 15_000 });
});

Then(
  'I should land on the {string} page within {int} seconds',
  async function (this: ICustomWorld, name: string, seconds: number) {
    if (!this.page) throw new Error('Page not initialised.');
    const re = pageMatcher(name);
    await this.page.waitForURL((url) => re.test(url.pathname), {
      timeout: seconds * 1000
    });
  }
);

Then('I should see the login error {string}', async function (this: ICustomWorld, message: string) {
  if (!this.loginPage) throw new Error('Login page not initialised.');
  const text = await this.loginPage.getErrorText();
  expect(text).toBe(message);
});

Then('I should remain on the {string} page', async function (this: ICustomWorld, name: string) {
  if (!this.page) throw new Error('Page not initialised.');
  // For TTACart, the login page sits at the root path (index.html is
  // stripped by Cloudflare Pages). A short wait gives any in-flight
  // navigation a chance to happen so we are not asserting prematurely.
  await this.page.waitForTimeout(500);
  const slug = name.toLowerCase();
  const pathname = new URL(this.page.url()).pathname;
  if (slug === 'login') {
    expect(/\/(index\.html)?$/.test(pathname) || pathname.endsWith('/ttacart/')).toBeTruthy();
  } else {
    expect(pathname).toContain(slug);
  }
});
