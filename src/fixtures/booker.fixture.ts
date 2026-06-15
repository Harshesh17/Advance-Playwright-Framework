/**
 * src/fixtures/booker.fixture.ts
 * -----------------------------------------------------------------------------
 * Standalone Restful Booker fixture for the "Level 3" lessons. Its whole job is
 * to GENERATE THE TOKEN FOR YOU so specs never POST /auth by hand:
 *
 *   import { test, expect } from '../../src/fixtures/booker.fixture';
 *
 *   test('update needs a token', async ({ bookingApi, bookerToken }) => {
 *     await bookingApi.updateBooking(id, payload, bookerToken);
 *   });
 *
 * Fixtures exposed:
 *   - bookingApi   : a BookingApi bound to Playwright's `request` context
 *                    (the api-restful-booker project already sets baseURL +
 *                    JSON headers, so relative paths "just work").
 *   - bookerToken  : a fresh admin token, fetched once per test via the fixture.
 *
 * This is intentionally separate from `fixtures/api-fixtures.ts` (which is the
 * AJV/schema flavour). Here we keep it plain so beginners can read it top to
 * bottom with zero extra concepts.
 */
import { test as base, expect } from '@playwright/test';
import { BookingApi } from '../api/BookingApi';

export type BookerFixtures = {
    bookingApi: BookingApi;
    bookerToken: string;
};

export const test = base.extend<BookerFixtures>({
    // Build the service object once and hand it to the test.
    bookingApi: async ({ request }, use) => {
        await use(new BookingApi(request));
    },

    // Generate a token via POST /auth and expose it to the test. This is the
    // "token generation lives in a fixture" requirement.
    bookerToken: async ({ bookingApi }, use) => {
        const token = await bookingApi.auth();
        await use(token);
    },
});

export { expect };
