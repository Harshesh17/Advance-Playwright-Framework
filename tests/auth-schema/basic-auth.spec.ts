/**
 * tests/auth-schema/basic-auth.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 2 - HTTP Basic Auth using Playwright's `httpCredentials` option on
 * APIRequestContext.
 *
 * Restful Booker accepts EITHER a Cookie token OR a Basic Auth header on
 * DELETE / PUT / PATCH. We use this spec to prove the Basic Auth path works,
 * because in real-world enterprise APIs Basic Auth is still everywhere.
 */
import { request as plainRequest } from '@playwright/test';
import { test, expect } from '../../fixtures/api-fixtures';

test.describe('@P0 @regression Restful Booker - HTTP Basic Auth', () => {
    test('DELETE /booking/{id} works with httpCredentials (no cookie)', async ({
        bookerRequest,
        bookerHelpers,
    }) => {
        // Step 1: create a booking using the normal authed context.
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'BasicAuth' }),
        });
        expect(create.status()).toBe(200);
        const { bookingid } = (await create.json()) as { bookingid: number };

        // Step 2: build a *fresh* context that has NO cookie token at all,
        // only Basic Auth. This proves we can do destructive operations using
        // Basic Auth alone, which is the Lecture 2 learning objective.
        //
        // Important: Booker doesn't issue a 401 challenge, so Playwright's
        // `httpCredentials` (which is *reactive*, only kicks in after a 401)
        // never sends the header. We work around that by sending the
        // Authorization header preemptively via extraHTTPHeaders, AND keep
        // httpCredentials for completeness (so the spec demonstrates both
        // ways to wire Basic Auth in Playwright).
        const basic = Buffer.from(
            `${bookerHelpers.creds.username}:${bookerHelpers.creds.password}`,
        ).toString('base64');

        const basicCtx = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            httpCredentials: {
                username: bookerHelpers.creds.username,
                password: bookerHelpers.creds.password,
            },
            extraHTTPHeaders: {
                Authorization: `Basic ${basic}`,
            },
        });

        try {
            const del = await basicCtx.delete(`/booking/${bookingid}`);
            expect(del.status()).toBe(201);

            // And the resource really is gone.
            const ghost = await bookerRequest.get(`/booking/${bookingid}`);
            expect(ghost.status()).toBe(404);
        } finally {
            await basicCtx.dispose();
        }
    });

    test('DELETE without any auth gets rejected (403)', async ({
        plainBookerRequest,
        bookerRequest,
        bookerHelpers,
    }) => {
        const create = await bookerRequest.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'NoAuth' }),
        });
        const { bookingid } = (await create.json()) as { bookingid: number };

        const del = await plainBookerRequest.delete(`/booking/${bookingid}`);
        // Booker uses 403 Forbidden for unauthenticated DELETE.
        expect(del.status()).toBe(403);
    });
});
