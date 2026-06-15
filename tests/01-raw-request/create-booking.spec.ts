/**
 * tests/01-raw-request/create-booking.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 1 - RAW Playwright `request`.
 *
 * POST /booking -> create a booking (no auth needed).
 *
 * The response wraps the booking: { bookingid: number, booking: {...} }.
 */
import { test, expect } from '@playwright/test';

test.describe('@P0 @regression Level 1 (raw) - POST create booking', () => {
    test('POST /booking creates a booking and echoes it back', async ({ request }) => {
        const payload = {
            firstname: 'Pramod',
            lastname: 'Dutta',
            totalprice: 555,
            depositpaid: true,
            bookingdates: { checkin: '2026-04-01', checkout: '2026-04-10' },
            additionalneeds: 'Breakfast',
        };

        const response = await request.post('/booking', { data: payload });

        expect(response.status()).toBe(200);
        const body = await response.json();

        // New id is a positive number.
        expect(typeof body.bookingid).toBe('number');
        expect(body.bookingid).toBeGreaterThan(0);

        // The echoed booking matches what we sent.
        expect(body.booking.firstname).toBe(payload.firstname);
        expect(body.booking.lastname).toBe(payload.lastname);
        expect(body.booking.totalprice).toBe(payload.totalprice);
        expect(body.booking.depositpaid).toBe(payload.depositpaid);
        expect(body.booking.bookingdates).toMatchObject(payload.bookingdates);
    });
});
