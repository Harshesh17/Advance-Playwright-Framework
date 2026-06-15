/**
 * tests/02-api-helper/get-booking.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 2 - using the shared `ApiHelper`.
 *
 * GET /booking/{id} -> read a single booking with typed parsing.
 */
import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../src/utils/ApiHelper';

interface Booking {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: { checkin: string; checkout: string };
    additionalneeds?: string;
}

test.describe('@P1 @smoke Level 2 (ApiHelper) - GET single booking', () => {
    test('GET /booking/{id} returns the typed booking body', async ({ request }) => {
        const api = new ApiHelper(request);

        // Arrange: create a booking to read.
        const created = await api.post('/booking', {
            firstname: 'Helper',
            lastname: 'Reader',
            totalprice: 410,
            depositpaid: true,
            bookingdates: { checkin: '2026-03-01', checkout: '2026-03-08' },
        });
        const { bookingid } = await api.parseJsonResponse<{ bookingid: number }>(created);

        // Act
        const response = await api.get(`/booking/${bookingid}`);

        // Assert
        expect(api.isSuccess(response)).toBe(true);
        const booking = await api.parseJsonResponse<Booking>(response);
        expect(booking.firstname).toBe('Helper');
        expect(booking.lastname).toBe('Reader');
        expect(booking.totalprice).toBe(410);
    });
});
