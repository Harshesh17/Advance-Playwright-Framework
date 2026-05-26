/**
 * tests/crud/e2e-chain.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 1 - end-to-end CRUD chain in a single test. This is the "did the
 * journey work?" test: create -> read -> update -> patch -> delete -> 404.
 *
 * The CRUD-per-test spec verifies each verb in isolation. This spec verifies
 * the *interactions* between them, e.g. that the ID returned by POST is the
 * same one PUT, PATCH, and DELETE can target.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import bookingSchema from '../../schemas/booking.schema.json';

test.describe('@e2e Restful Booker - full CRUD chain', () => {
    test('create -> read -> put -> patch -> delete -> verify 404', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        // ---------- 1. CREATE ----------
        const createPayload = bookerHelpers.samplePayload({
            firstname: 'Chain',
            lastname: 'Original',
            totalprice: 150,
        });

        const createRes = await bookerRequest.post('/booking', { data: createPayload });
        expect(createRes.status()).toBe(200);
        const createBody = await createRes.json();
        const bookingId = createBody.bookingid as number;
        expect(bookingId).toBeGreaterThan(0);
        expect(createBody.booking).toMatchSchema(bookingSchema);

        // ---------- 2. READ ----------
        const readRes = await bookerRequest.get(`/booking/${bookingId}`);
        expect(readRes.status()).toBe(200);
        const readBody = await readRes.json();
        expect(readBody).toMatchSchema(bookingSchema);
        expect(readBody.firstname).toBe('Chain');
        expect(readBody.totalprice).toBe(150);

        // ---------- 3. PUT (full replace) ----------
        const putRes = await bookerRequest.put(`/booking/${bookingId}`, {
            data: bookerHelpers.samplePayload({
                firstname: 'Chain',
                lastname: 'Replaced',
                totalprice: 300,
                depositpaid: true,
            }),
        });
        expect(putRes.status()).toBe(200);
        const putBody = await putRes.json();
        expect(putBody.lastname).toBe('Replaced');
        expect(putBody.totalprice).toBe(300);

        // ---------- 4. PATCH (partial) ----------
        const patchRes = await bookerRequest.patch(`/booking/${bookingId}`, {
            data: { totalprice: 999 },
        });
        expect(patchRes.status()).toBe(200);
        const patchBody = await patchRes.json();
        expect(patchBody.totalprice).toBe(999);
        // Last name from the PUT step should survive the PATCH because PATCH
        // is partial.
        expect(patchBody.lastname).toBe('Replaced');

        // ---------- 5. DELETE ----------
        const delRes = await bookerRequest.delete(`/booking/${bookingId}`);
        expect(delRes.status()).toBe(201);

        // ---------- 6. VERIFY 404 ----------
        const ghostRes = await bookerRequest.get(`/booking/${bookingId}`);
        expect(ghostRes.status()).toBe(404);
    });
});
