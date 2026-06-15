/**
 * tests/03-fixtures-e2e/jsonpath-queries.e2e.spec.ts
 * -----------------------------------------------------------------------------
 * LEVEL 3 - JSONPath assertions on top of the fixtures.
 *
 * Same "highest level" setup as booking-crud.e2e.spec.ts (token + bookingApi
 * come from the fixture), but here we focus on ONE skill: pulling values out of
 * a JSON response with **JSONPath** instead of hand-walking nested properties.
 *
 *   plain JS  ->  body.booking.bookingdates.checkin
 *   JSONPath  ->  JSONPath({ path: '$.booking.bookingdates.checkin', json: body })
 *
 * Why bother? JSONPath shines when the shape is deep, repeated, or unknown:
 * "give me EVERY price in this payload" is `$..totalprice` - one line, no loops.
 *
 * Operator cheat-sheet (used below):
 *   $            the root document
 *   .key         a child by name           ($.booking.firstname)
 *   ..key        recursive descent (any depth)   ($..totalprice)
 *   *            wildcard - all children   ($.booking.*)
 *   [n]          array index               ($[0])
 *   [start:end]  array slice               ($[-1:] = last one)
 *   [?(@.x > 0)] filter expression         (@ = the current item)
 *
 * JSONPath() ALWAYS returns an ARRAY of matches (even for a single hit), so a
 * single-value query reads its first element: `JSONPath(...)[0]`.
 */
import { JSONPath } from 'jsonpath-plus';
import { test, expect } from '../../src/fixtures/booker.fixture';
import { buildBooking } from '../../src/testdata/booking.data';

test.describe.serial('@e2e @P0 Level 3 - JSONPath queries on booking responses', () => {
    let bookingId: number;

    test('create a booking and read fields with JSONPath', async ({ bookingApi }) => {
        const payload = buildBooking({
            firstname: 'Json',
            lastname: 'Path',
            totalprice: 777,
            additionalneeds: 'Breakfast',
        });

        // The whole POST /booking response: { bookingid, booking: { ... } }
        const body = await bookingApi.createBooking(payload);
        bookingId = body.bookingid;

        // 1) Single nested value -> $.booking.firstname  (array result, take [0]).
        const firstname = JSONPath({ path: '$.booking.firstname', json: body })[0];
        expect(firstname).toBe('Json');

        // 2) Deep nested value -> reach into bookingdates without manual chaining.
        const checkin = JSONPath({ path: '$.booking.bookingdates.checkin', json: body })[0];
        expect(checkin).toBe('2026-02-01');

        // 3) Top-level value -> the new id.
        const id = JSONPath({ path: '$.bookingid', json: body })[0];
        expect(id).toBeGreaterThan(0);
    });

    test('wildcard + recursive-descent queries', async ({ bookingApi }) => {
        const body = await bookingApi.createBooking(
            buildBooking({ firstname: 'Wild', lastname: 'Card', totalprice: 540 }),
        );

        // 4) Wildcard -> every direct child VALUE of booking (firstname, lastname,
        //    totalprice, depositpaid, bookingdates, additionalneeds).
        const allBookingValues = JSONPath({ path: '$.booking.*', json: body });
        expect(allBookingValues).toContain('Wild');
        expect(allBookingValues).toContain(540);

        // 5) Recursive descent -> find totalprice ANYWHERE in the payload, no
        //    matter how deeply nested. One expression, zero loops.
        const prices = JSONPath({ path: '$..totalprice', json: body });
        expect(prices).toEqual([540]);

        // 6) Recursive descent for a deep key -> grab checkin/checkout dates.
        const dates = JSONPath({ path: '$..bookingdates', json: body })[0];
        expect(dates).toHaveProperty('checkin');
        expect(dates).toHaveProperty('checkout');
    });

    test('array queries: index, slice and filter on GET /booking', async ({ bookingApi }) => {
        // GET /booking -> an ARRAY like [{ bookingid: 1 }, { bookingid: 2 }, ...]
        const list = await bookingApi.getAllBookings();
        expect(Array.isArray(list)).toBe(true);

        // 7) Index -> first element's id  ($[0].bookingid).
        const firstId = JSONPath({ path: '$[0].bookingid', json: list })[0];
        expect(typeof firstId).toBe('number');

        // 8) Slice -> the LAST element  ($[-1:] returns a 1-item array).
        const lastId = JSONPath({ path: '$[-1:].bookingid', json: list })[0];
        expect(typeof lastId).toBe('number');

        // 9) Wildcard across the array -> EVERY bookingid in one shot.
        const allIds = JSONPath({ path: '$[*].bookingid', json: list }) as number[];
        expect(allIds.length).toBe(list.length);
        expect(allIds.every((n) => Number.isInteger(n))).toBe(true);

        // 10) Filter -> only objects whose bookingid is > 0  ([?(@.bookingid > 0)]).
        //     `@` is the current item being tested by the filter.
        const positives = JSONPath({ path: '$[?(@.bookingid > 0)]', json: list }) as Array<{
            bookingid: number;
        }>;
        expect(positives.length).toBe(list.length);
        expect(positives.every((o) => o.bookingid > 0)).toBe(true);
    });

    test('clean up the booking created above', async ({ bookingApi, bookerToken }) => {
        const status = await bookingApi.deleteBooking(bookingId, bookerToken);
        expect(status).toBe(201);
    });
});
