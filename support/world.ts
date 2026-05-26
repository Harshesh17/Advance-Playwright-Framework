import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

import { LoginPage } from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';

/**
 * Shape of the data each scenario receives via `this`. Hooks attach the
 * browser/context/page, and page objects are lazily constructed when a
 * step first needs them.
 */
export interface ICustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  baseURL: string;
  env: string;

  loginPage?: LoginPage;
  productsPage?: ProductsPage;
  cartPage?: CartPage;
  checkoutPage?: CheckoutPage;

  // Free-form bag of values steps can share within a scenario (e.g. cart
  // totals, captured product names, etc.) without polluting page objects.
  testData: Record<string, unknown>;
}

class CustomWorld extends World implements ICustomWorld {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;
  public baseURL: string;
  public env: string;
  public testData: Record<string, unknown> = {};

  public loginPage?: LoginPage;
  public productsPage?: ProductsPage;
  public cartPage?: CartPage;
  public checkoutPage?: CheckoutPage;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseURL =
      process.env.BASE_URL ||
      'https://app.thetestingacademy.com/playwright/ttacart/index.html';
    this.env = process.env.NODE_ENV || 'dev';
  }
}

setWorldConstructor(CustomWorld);
