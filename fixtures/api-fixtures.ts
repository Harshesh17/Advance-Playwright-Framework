/**
 * fixtures/api-fixtures.ts
 * -----------------------------------------------------------------------------
 * Custom Playwright test fixture that:
 *   1. Loads .env once per worker.
 *   2. Hands every test a pre-authed Restful Booker request context, so we
 *      don't POST /auth at the top of every spec.
 *   3. Re-exports the AJV-extended `expect` so specs only import from one
 *      place.
 *
 * Usage in a spec:
 *
 *   import { test, expect } from '../../fixtures/api-fixtures';
 *
 *   test('GET /booking/:id returns schema-valid booking', async ({ bookerRequest }) => {
 *     const r = await bookerRequest.get('/booking/1');
 *     expect(await r.json()).toMatchSchema(bookingSchema);
 *   });
 */
import { test as base, request as plainRequest, type APIRequestContext } from '@playwright/test';
import { expect as ajvExpect } from '../support/ajv-setup';
import { env, loadEnv } from '../support/env-loader';

loadEnv();

export interface BookerCreds {
    username: string;
    password: string;
}

export interface BookingPayload {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: {
        checkin: string;
        checkout: string;
    };
    additionalneeds?: string;
}

/**
 * Helpers a fixture exposes to tests. We surface the booker URL + creds so
 * specs that need to assert specific behavior (like a bad-creds path) can
 * deliberately deviate from the happy path.
 */
export interface BookerHelpers {
    baseURL: string;
    creds: BookerCreds;
    token: string;
    /** Build a default valid booking payload. Spec can override any field. */
    samplePayload: (overrides?: Partial<BookingPayload>) => BookingPayload;
}

type Fixtures = {
    bookerHelpers: BookerHelpers;
    bookerRequest: APIRequestContext;
    /** Unauthenticated context, useful for the auth-token spec itself. */
    plainBookerRequest: APIRequestContext;
};

/**
 * Fetch an admin token from /auth. Throws with a helpful message if creds
 * are wrong or the endpoint is down.
 */
async function fetchBookerToken(ctx: APIRequestContext, creds: BookerCreds): Promise<string> {
    const res = await ctx.post('/auth', {
        data: { username: creds.username, password: creds.password },
    });
    if (!res.ok()) {
        throw new Error(
            `[api-fixtures] /auth returned ${res.status()}. Check BOOKER_USER / BOOKER_PASS in .env.`,
        );
    }
    const body = (await res.json()) as { token?: string; reason?: string };
    if (!body.token) {
        throw new Error(
            `[api-fixtures] /auth body had no token. Reason: ${body.reason ?? 'unknown'}`,
        );
    }
    return body.token;
}

function defaultPayload(overrides: Partial<BookingPayload> = {}): BookingPayload {
    return {
        firstname: 'Pramod',
        lastname: 'Dutta',
        totalprice: 222,
        depositpaid: true,
        bookingdates: {
            checkin: '2026-01-01',
            checkout: '2026-01-05',
        },
        additionalneeds: 'Breakfast',
        ...overrides,
    };
}

export const test = base.extend<Fixtures>({
    bookerHelpers: async ({}, use) => {
        const baseURL = env('BOOKER_URL', 'https://restful-booker.herokuapp.com');
        // Restful Booker advertises these credentials publicly in its API
        // docs - they're literally documented as the default admin creds.
        // We fall back to them so a fresh clone runs without a .env file.
        const creds: BookerCreds = {
            username: env('BOOKER_USER', 'admin'),
            password: env('BOOKER_PASS', 'password123'),
        };

        // Build a throw-away context just to fetch the token. We don't use
        // this context for assertions - it goes away immediately.
        const probe = await plainRequest.newContext({ baseURL });
        const token = await fetchBookerToken(probe, creds);
        await probe.dispose();

        await use({ baseURL, creds, token, samplePayload: defaultPayload });
    },

    plainBookerRequest: async ({ bookerHelpers }, use) => {
        const ctx = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        await use(ctx);
        await ctx.dispose();
    },

    bookerRequest: async ({ bookerHelpers }, use) => {
        // PUT / DELETE need the Cookie token; POST / GET don't.
        const ctx = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Cookie: `token=${bookerHelpers.token}`,
            },
        });
        await use(ctx);
        await ctx.dispose();
    },
});

// Re-export the AJV-extended expect so every spec uses the same matcher set.
export const expect = ajvExpect;
