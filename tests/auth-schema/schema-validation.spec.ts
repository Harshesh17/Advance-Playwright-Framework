/**
 * tests/auth-schema/schema-validation.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 2 - JSON Schema validation with AJV.
 *
 * We assert that:
 *   1. A real booking response from GET /booking/{id} matches our
 *      draft-07 schema in schemas/booking.schema.json.
 *   2. A handcrafted invalid payload (missing required field) is *rejected*
 *      by the same schema. This guards against the schema being so loose
 *      that it accepts anything - a common bug in schema authoring.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import bookingSchema from '../../schemas/booking.schema.json';

test.describe('@P0 AJV schema validation', () => {
    test('real GET /booking/{id} payload passes booking schema', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        // Seed a booking with predictable values.
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'Schema' }),
        });
        const { bookingid } = (await create.json()) as { bookingid: number };

        const get = await bookerRequest.get(`/booking/${bookingid}`);
        expect(get.status()).toBe(200);
        const body = await get.json();

        expect(body).toMatchSchema(bookingSchema);
    });

    test('handcrafted invalid payload fails the schema (negative test)', async () => {
        // Missing `bookingdates`, which is required by the schema.
        const broken = {
            firstname: 'Bad',
            lastname: 'Payload',
            totalprice: 100,
            depositpaid: true,
            // bookingdates intentionally omitted
        };

        expect(broken).not.toMatchSchema(bookingSchema);
    });

    test('wrong field types are rejected (totalprice as string)', async () => {
        const broken = {
            firstname: 'Bad',
            lastname: 'Types',
            totalprice: 'one hundred',
            depositpaid: true,
            bookingdates: { checkin: '2026-01-01', checkout: '2026-01-05' },
        };
        expect(broken).not.toMatchSchema(bookingSchema);
    });

    test('valid handcrafted payload passes (sanity for the matcher itself)', async () => {
        // This proves the matcher isn't just always saying "no". If this
        // test ever fails, the schema is too strict.
        const good = {
            firstname: 'Sanity',
            lastname: 'Check',
            totalprice: 1,
            depositpaid: false,
            bookingdates: { checkin: '2026-12-31', checkout: '2027-01-02' },
        };
        expect(good).toMatchSchema(bookingSchema);
    });
});
