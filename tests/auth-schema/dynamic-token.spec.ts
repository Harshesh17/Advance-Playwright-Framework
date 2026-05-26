/**
 * tests/auth-schema/dynamic-token.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 2 - dynamic token refresh.
 *
 * Real-world APIs hand out short-lived tokens. The pattern we teach here:
 *
 *   1. Try the request with the cached token.
 *   2. If the server says 401/403, refresh the token and retry exactly once.
 *   3. Surface the second failure (if any) instead of looping forever.
 *
 * Restful Booker tokens don't actually expire in a useful timeframe, so we
 * simulate the expiry by deliberately corrupting the token cookie and proving
 * the retry helper resets it correctly.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import { request as plainRequest, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Runs a request. If it comes back 401/403, refreshes the token via the
 * caller-supplied function and retries exactly once.
 *
 * Important: we intentionally only retry once. An auth failure on the
 * retry means the credentials themselves are wrong - infinite retry would
 * just hammer the server.
 */
async function withTokenRefresh(
    doRequest: (token: string) => Promise<APIResponse>,
    refreshToken: () => Promise<string>,
    initialToken: string,
): Promise<{ response: APIResponse; tokenWasRefreshed: boolean }> {
    let response = await doRequest(initialToken);
    if (response.status() !== 401 && response.status() !== 403) {
        return { response, tokenWasRefreshed: false };
    }
    const fresh = await refreshToken();
    response = await doRequest(fresh);
    return { response, tokenWasRefreshed: true };
}

test.describe('@P0 dynamic token refresh', () => {
    test('detects 403 with stale token, refreshes, retries once', async ({
        bookerHelpers,
    }) => {
        const STALE = 'definitelynotavalidtoken1234';

        // Seed a booking via a real auth path so we have a target ID.
        const realCtx = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: { Cookie: `token=${bookerHelpers.token}` },
        });
        const create = await realCtx.post('/booking', {
            data: bookerHelpers.samplePayload({ firstname: 'Refresh' }),
        });
        const { bookingid } = (await create.json()) as { bookingid: number };
        await realCtx.dispose();

        const buildCtx = async (token: string): Promise<APIRequestContext> =>
            plainRequest.newContext({
                baseURL: bookerHelpers.baseURL,
                extraHTTPHeaders: {
                    'Content-Type': 'application/json',
                    Cookie: `token=${token}`,
                },
            });

        const doDelete = async (token: string): Promise<APIResponse> => {
            const ctx = await buildCtx(token);
            const res = await ctx.delete(`/booking/${bookingid}`);
            // Don't dispose here - Playwright keeps the response handle alive
            // off the context, but the context object itself is fine to leak
            // for the brief lifetime of this test.
            return res;
        };

        const refresh = async (): Promise<string> => {
            // Pretend the in-test refresh: just hand back the real token.
            return bookerHelpers.token;
        };

        const { response, tokenWasRefreshed } = await withTokenRefresh(
            doDelete,
            refresh,
            STALE,
        );

        expect(tokenWasRefreshed).toBe(true);
        expect(response.status()).toBe(201);
    });

    test('does NOT refresh when first attempt already succeeds', async ({ bookerHelpers }) => {
        const ctx = await plainRequest.newContext({
            baseURL: bookerHelpers.baseURL,
            extraHTTPHeaders: { Cookie: `token=${bookerHelpers.token}` },
        });

        try {
            const doRead = async (_token: string) => ctx.get('/booking');
            const refresh = async () => {
                throw new Error('refresh should NOT have been called');
            };

            const { tokenWasRefreshed, response } = await withTokenRefresh(
                doRead,
                refresh,
                bookerHelpers.token,
            );

            expect(tokenWasRefreshed).toBe(false);
            expect(response.status()).toBe(200);
        } finally {
            await ctx.dispose();
        }
    });
});
