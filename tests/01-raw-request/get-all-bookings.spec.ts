/**
 * tests/01-raw-request/get-all-bookings.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 1 - RAW Playwright `request`, no helper, no fixture.
 *
 * GET /booking            -> list every booking id
 * GET /booking?firstname= -> filtered list
 *
 * `request` is Playwright's built-in APIRequestContext fixture. The
 * `api-restful-booker` project already sets baseURL + JSON headers in
 * playwright.config.ts, so we can use relative paths like '/booking'.
 */
import { test, expect } from '@playwright/test';

test.describe('@P1 @smoke Level 1 (raw) - GET all bookings', () => {
    test('GET /booking returns an array of booking ids', async ({ request }) => {
        const response = await request.get('/booking');

        expect(response.status()).toBe(200);

        const bookings = await response.json();
        expect(Array.isArray(bookings)).toBe(true);
        expect(bookings.length).toBeGreaterThan(0);

        // Every item is an object with a numeric bookingid.
        expect(bookings[0]).toHaveProperty('bookingid');
        expect(typeof bookings[0].bookingid).toBe('number');
    });

    test('GET /booking?firstname=&lastname= filters the list', async ({ request }) => {
        // Arrange: create a booking with a unique name so the filter is exact.
        const firstname = `Raw${Date.now()}`;
        const lastname = 'Filter';
        const create = await request.post('/booking', {
            data: {
                firstname,
                lastname,
                totalprice: 123,
                depositpaid: true,
                bookingdates: { checkin: '2026-02-01', checkout: '2026-02-05' },
                additionalneeds: 'Breakfast',
            },
        });
        const { bookingid } = await create.json();

        // Act: query the list filtered by that name.
        const response = await request.get('/booking', {
            params: { firstname, lastname },
        });

        // Assert: our new id is in the filtered result.
        expect(response.status()).toBe(200);
        const ids = (await response.json()) as Array<{ bookingid: number }>;
        expect(ids.map((b) => b.bookingid)).toContain(bookingid);
    });
});
