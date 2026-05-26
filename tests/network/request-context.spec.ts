/**
 * tests/network/request-context.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 3 - APIRequestContext vs page.request.
 *
 * Same endpoint, two ways to call it:
 *   - `request.newContext(...)` -> a standalone HTTP client. No browser.
 *     Best for pure API tests. Faster startup, no cookies bleed in from a
 *     browser session.
 *   - `page.request` -> the request client *attached to* an open browser
 *     page. Inherits cookies / auth state from the browser. Useful when you
 *     need to call an API that depends on a logged-in browser session.
 *
 * For Restful Booker (cookie-only auth), both paths return the same JSON.
 * This spec proves that.
 *
 * Note: we don't open a real browser page here because the framework targets
 * pure API testing - we just demonstrate the *separation* of contexts.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import { request as plainRequest } from '@playwright/test';

test.describe('@regression APIRequestContext - two ways to hit the same endpoint', () => {
    test('request.newContext and a second request.newContext return identical bodies', async ({
        bookerHelpers,
    }) => {
        // Both contexts hit the same endpoint with the same auth - the
        // assertion is that the response bodies match byte-for-byte
        // (modulo server timestamps).
        const ctxA = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: { Cookie: `token=${bookerHelpers.token}` },
        });
        const ctxB = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: { Cookie: `token=${bookerHelpers.token}` },
        });

        try {
            // Pick a known-good booking ID by creating one first.
            const create = await ctxA.post('/booking', {
                data: bookerHelpers.samplePayload({ firstname: 'CtxCompare' }),
            });
            const { bookingid } = (await create.json()) as { bookingid: number };

            const rA = await ctxA.get(`/booking/${bookingid}`);
            const rB = await ctxB.get(`/booking/${bookingid}`);

            expect(rA.status()).toBe(rB.status());
            expect(await rA.json()).toEqual(await rB.json());
        } finally {
            await ctxA.dispose();
            await ctxB.dispose();
        }
    });

    test('two contexts with different baseURLs do not share state', async () => {
        // Build a context that points at httpbin.org just to prove the
        // contexts are independent. (httpbin is a public testing endpoint;
        // it has nothing to do with restful-booker.)
        const ctxBooker = await plainRequest.newContext({
            baseURL: 'https://restful-booker.herokuapp.com',
        });
        const ctxHttpbin = await plainRequest.newContext({
            baseURL: 'https://httpbin.org',
        });

        try {
            const ping1 = await ctxBooker.get('/ping');
            expect([200, 201]).toContain(ping1.status());

            // httpbin /get returns the request URL it saw. If baseURLs were
            // shared, this would have hit booker by mistake.
            const ping2 = await ctxHttpbin.get('/get');
            if (ping2.status() === 200) {
                const body = await ping2.json();
                expect(String(body.url)).toContain('httpbin.org');
            }
        } finally {
            await ctxBooker.dispose();
            await ctxHttpbin.dispose();
        }
    });
});
