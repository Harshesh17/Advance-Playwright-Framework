/**
 * tests/crud/booking-crud.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 1 - the full CRUD ladder for /booking. Each test is independent
 * (it creates its own booking and cleans up at the end) so the spec is safe
 * to run in parallel.
 *
 * Endpoints exercised:
 *   POST   /booking         -> create
 *   GET    /booking/{id}    -> read
 *   PUT    /booking/{id}    -> full replace
 *   PATCH  /booking/{id}    -> partial update
 *   DELETE /booking/{id}    -> delete + 404 verification
 */
import { test, expect, type BookingPayload } from '../../fixtures/api-fixtures';
import bookingSchema from '../../schemas/booking.schema.json';

interface CreateBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}

test.describe('@P0 @regression Restful Booker - booking CRUD', () => {
    test('POST /booking creates and returns a bookingid', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        const payload = bookerHelpers.samplePayload();
        const response = await bookerRequest.post('/booking', { data: payload });

        expect(response.status()).toBe(200);
        const body = (await response.json()) as CreateBookingResponse;

        expect(body.bookingid).toEqual(expect.any(Number));
        expect(body.bookingid).toBeGreaterThan(0);

        // The booking inside the response should match what we sent and pass
        // the schema.
        expect(body.booking).toMatchSchema(bookingSchema);
        expect(body.booking.firstname).toBe(payload.firstname);
        expect(body.booking.lastname).toBe(payload.lastname);
        expect(body.booking.totalprice).toBe(payload.totalprice);
    });

    test('GET /booking/{id} returns the freshly-created booking', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'Read' }),
        });
        const { bookingid } = (await create.json()) as CreateBookingResponse;

        const response = await bookerRequest.get(`/booking/${bookingid}`);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toMatchSchema(bookingSchema);
        expect(body.firstname).toBe('Read');
    });

    test('PUT /booking/{id} fully replaces the booking', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'Before' }),
        });
        const { bookingid } = (await create.json()) as CreateBookingResponse;

        const replacement = bookerHelpers.samplePayload({
            firstname: 'After',
            lastname: 'Replaced',
            totalprice: 999,
            depositpaid: false,
        });

        const response = await bookerRequest.put(`/booking/${bookingid}`, {
            data: replacement,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toMatchSchema(bookingSchema);
        expect(body.firstname).toBe('After');
        expect(body.lastname).toBe('Replaced');
        expect(body.totalprice).toBe(999);
        expect(body.depositpaid).toBe(false);
    });

    test('PATCH /booking/{id} updates a single field (totalprice)', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ totalprice: 100 }),
        });
        const { bookingid } = (await create.json()) as CreateBookingResponse;

        const response = await bookerRequest.patch(`/booking/${bookingid}`, {
            data: { totalprice: 250 },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.totalprice).toBe(250);
        // Untouched fields should still be there.
        expect(body.firstname).toBe('Pramod');
        expect(body).toMatchSchema(bookingSchema);
    });

    test('DELETE /booking/{id} returns 201 and the resource is gone (404)', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'Doomed' }),
        });
        const { bookingid } = (await create.json()) as CreateBookingResponse;

        const del = await bookerRequest.delete(`/booking/${bookingid}`);
        expect(del.status()).toBe(201);

        // Booker returns 404 + "Not Found" plain text for missing IDs.
        const verify = await bookerRequest.get(`/booking/${bookingid}`);
        expect(verify.status()).toBe(404);
    });
});
