/**
 * tests/01-raw-request/update-booking.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 1 - RAW Playwright `request`.
 *
 * PUT /booking/{id} -> full replace. THIS ONE NEEDS AUTH.
 *
 * Restful Booker quirk: the token rides in a Cookie header (`token=<token>`),
 * NOT `Authorization: Bearer`. Here we fetch the token by hand with POST /auth
 * so you can see every step. Level 3 moves this into a fixture.
 */
import { test, expect } from '@playwright/test';

const ADMIN = { username: 'admin', password: 'password123' };

test.describe('@P0 @regression Level 1 (raw) - PUT update booking', () => {
    test('PUT /booking/{id} replaces the booking when a token is supplied', async ({
        request,
    }) => {
        // Step 1: get a token.
        const authRes = await request.post('/auth', { data: ADMIN });
        expect(authRes.status()).toBe(200);
        const { token } = await authRes.json();
        expect(token).toBeTruthy();

        // Step 2: create a booking to update.
        const create = await request.post('/booking', {
            data: {
                firstname: 'Before',
                lastname: 'Update',
                totalprice: 100,
                depositpaid: false,
                bookingdates: { checkin: '2026-05-01', checkout: '2026-05-05' },
                additionalneeds: 'None',
            },
        });
        const { bookingid } = await create.json();

        // Step 3: PUT with the Cookie token.
        const response = await request.put(`/booking/${bookingid}`, {
            headers: { Cookie: `token=${token}` },
            data: {
                firstname: 'After',
                lastname: 'Replaced',
                totalprice: 750,
                depositpaid: true,
                bookingdates: { checkin: '2026-05-02', checkout: '2026-05-09' },
                additionalneeds: 'Extra bed',
            },
        });

        expect(response.status()).toBe(200);
        const updated = await response.json();
        expect(updated.firstname).toBe('After');
        expect(updated.lastname).toBe('Replaced');
        expect(updated.totalprice).toBe(750);
        expect(updated.depositpaid).toBe(true);
    });

    test('PUT /booking/{id} WITHOUT a token is rejected with 403', async ({ request }) => {
        const create = await request.post('/booking', {
            data: {
                firstname: 'NoAuth',
                lastname: 'Update',
                totalprice: 100,
                depositpaid: false,
                bookingdates: { checkin: '2026-05-01', checkout: '2026-05-05' },
            },
        });
        const { bookingid } = await create.json();

        // No Cookie header -> Booker forbids the write.
        const response = await request.put(`/booking/${bookingid}`, {
            data: {
                firstname: 'Should',
                lastname: 'Fail',
                totalprice: 1,
                depositpaid: false,
                bookingdates: { checkin: '2026-05-01', checkout: '2026-05-05' },
            },
        });

        expect(response.status()).toBe(403);
    });
});
