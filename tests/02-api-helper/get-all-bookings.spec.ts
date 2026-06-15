/**
 * tests/02-api-helper/get-all-bookings.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 2 - using the shared `ApiHelper` (src/utils/ApiHelper.ts).
 *
 * Same scenario as Level 1, but the raw `request.get(...)` calls are replaced
 * by `apiHelper.get(...)` + `parseJsonResponse<T>()` + `isSuccess()`. Notice the
 * specs get shorter and typed.
 */
import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../src/utils/ApiHelper';

interface BookingId {
    bookingid: number;
}

test.describe('@P1 @smoke Level 2 (ApiHelper) - GET all bookings', () => {
    test('GET /booking returns an array of booking ids', async ({ request }) => {
        const api = new ApiHelper(request);

        const response = await api.get('/booking');
        expect(api.isSuccess(response)).toBe(true);

        const bookings = await api.parseJsonResponse<BookingId[]>(response);
        expect(Array.isArray(bookings)).toBe(true);
        expect(bookings.length).toBeGreaterThan(0);
        expect(typeof bookings[0].bookingid).toBe('number');
    });

    test('GET /booking with query params filters the list', async ({ request }) => {
        const api = new ApiHelper(request);
        const firstname = `Helper${Date.now()}`;

        // Arrange: create a uniquely-named booking.
        const created = await api.post('/booking', {
            firstname,
            lastname: 'Filter',
            totalprice: 321,
            depositpaid: true,
            bookingdates: { checkin: '2026-02-01', checkout: '2026-02-05' },
        });
        const { bookingid } = await api.parseJsonResponse<{ bookingid: number }>(created);

        // Act: ApiHelper builds the ?firstname=...&lastname=... query for us.
        const response = await api.get('/booking', {
            params: { firstname, lastname: 'Filter' },
        });

        // Assert
        expect(api.isSuccess(response)).toBe(true);
        const ids = await api.parseJsonResponse<BookingId[]>(response);
        expect(ids.map((b) => b.bookingid)).toContain(bookingid);
    });
});
