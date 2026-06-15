/**
 * tests/01-raw-request/get-booking.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 1 - RAW Playwright `request`.
 *
 * GET /booking/{id} -> read a single booking.
 *
 * We create one first (Arrange) so the id is guaranteed to exist, then read it.
 */
import { test, expect } from '@playwright/test';

test.describe('@P1 @smoke Level 1 (raw) - GET single booking', () => {
    test('GET /booking/{id} returns the booking body', async ({ request }) => {
        // Arrange: create a booking to read back.
        const create = await request.post('/booking', {
            data: {
                firstname: 'Read',
                lastname: 'Me',
                totalprice: 200,
                depositpaid: false,
                bookingdates: { checkin: '2026-03-01', checkout: '2026-03-08' },
                additionalneeds: 'Late checkout',
            },
        });
        const { bookingid } = await create.json();

        // Act
        const response = await request.get(`/booking/${bookingid}`);

        // Assert
        expect(response.status()).toBe(200);
        const booking = await response.json();
        expect(booking.firstname).toBe('Read');
        expect(booking.lastname).toBe('Me');
        expect(booking.totalprice).toBe(200);
        expect(booking.bookingdates).toMatchObject({
            checkin: '2026-03-01',
            checkout: '2026-03-08',
        });
    });

    test('GET /booking/{id} for a missing id returns 404', async ({ request }) => {
        const response = await request.get('/booking/99999999');
        expect(response.status()).toBe(404);
    });
});
