/**
 * tests/02-api-helper/create-booking.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 2 - using the shared `ApiHelper`.
 *
 * POST /booking -> create. `apiHelper.post(url, data, options)` takes the body
 * as the second arg, so there's no `{ data: ... }` wrapper to remember.
 */
import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../src/utils/ApiHelper';

interface CreateBookingResponse {
    bookingid: number;
    booking: {
        firstname: string;
        lastname: string;
        totalprice: number;
        depositpaid: boolean;
    };
}

test.describe('@P0 @regression Level 2 (ApiHelper) - POST create booking', () => {
    test('POST /booking creates a booking and echoes it back', async ({ request }) => {
        const api = new ApiHelper(request);

        const payload = {
            firstname: 'Helper',
            lastname: 'Creator',
            totalprice: 640,
            depositpaid: false,
            bookingdates: { checkin: '2026-04-01', checkout: '2026-04-10' },
            additionalneeds: 'Breakfast',
        };

        const response = await api.post('/booking', payload);

        expect(api.isSuccess(response)).toBe(true);
        const body = await api.parseJsonResponse<CreateBookingResponse>(response);

        expect(body.bookingid).toBeGreaterThan(0);
        expect(body.booking.firstname).toBe(payload.firstname);
        expect(body.booking.totalprice).toBe(payload.totalprice);
    });
});
