/**
 * src/testdata/booking.data.ts
 * -----------------------------------------------------------------------------
 * Test-data builder for Restful Booker bookings. Uses faker so every run sends
 * unique-ish data, but lets a spec pin any field via `overrides` for
 * deterministic assertions:
 *
 *   const payload = buildBooking({ firstname: 'Pramod' });
 */
import { faker } from '@faker-js/faker';
import type { Booking } from '../api/BookingApi';

/** Return a YYYY-MM-DD string for `daysFromNow` in the future. */
function isoDate(daysFromNow: number): string {
    const d = faker.date.soon({ days: daysFromNow, refDate: '2026-01-01T00:00:00.000Z' });
    return d.toISOString().slice(0, 10);
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
    return {
        firstname: faker.person.firstName(),
        lastname: faker.person.lastName(),
        totalprice: faker.number.int({ min: 100, max: 1000 }),
        depositpaid: faker.datatype.boolean(),
        bookingdates: {
            checkin: '2026-02-01',
            checkout: isoDate(30),
        },
        additionalneeds: faker.helpers.arrayElement(['Breakfast', 'Late checkout', 'Extra bed']),
        ...overrides,
    };
}
