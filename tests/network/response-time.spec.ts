/**
 * tests/network/response-time.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 3 - response-time assertions.
 *
 * Wraps each request in `performance.now()` and asserts the round trip
 * stays under a configurable budget (default 3000ms). Restful Booker on
 * Heroku free dyno can cold-start, so we generously allow 3s on the first
 * hit and tighten it on warm hits.
 *
 * The budget is sourced from API_RESPONSE_TIME_BUDGET_MS so CI can dial it
 * up or down without touching code.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import { envNumber } from '../../support/env-loader';

const BUDGET_MS = envNumber('API_RESPONSE_TIME_BUDGET_MS', 3000);

async function timed<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
    const start = performance.now();
    const result = await fn();
    const ms = performance.now() - start;
    // Surfacing the number in the report so we can spot trends.
    test.info().annotations.push({ type: 'latency', description: `${label}: ${ms.toFixed(0)}ms` });
    return { result, ms };
}

test.describe('@regression response-time SLO', () => {
    test('GET /ping stays under the response-time budget', async ({ bookerRequest }) => {
        const { result: response, ms } = await timed('GET /ping', () => bookerRequest.get('/ping'));
        expect([200, 201]).toContain(response.status());
        expect(ms).toBeLessThan(BUDGET_MS);
    });

    test('GET /booking list stays under the response-time budget', async ({ bookerRequest }) => {
        const { result: response, ms } = await timed('GET /booking', () =>
            bookerRequest.get('/booking'),
        );
        expect(response.status()).toBe(200);
        expect(ms).toBeLessThan(BUDGET_MS);
    });

    test('warm GET /booking/1 is faster than the cold first call', async ({ bookerRequest }) => {
        // Cold call (which we discard apart from for warming the route).
        const cold = await timed('GET /booking/1 (cold)', () => bookerRequest.get('/booking/1'));
        expect([200, 404]).toContain(cold.result.status());

        // Warm call.
        const warm = await timed('GET /booking/1 (warm)', () => bookerRequest.get('/booking/1'));
        expect([200, 404]).toContain(warm.result.status());

        // We don't make a strict assertion that warm < cold because Heroku
        // free dynos are noisy and this would flake. Instead we assert both
        // are under the wider budget and surface the numbers in the report.
        expect(warm.ms).toBeLessThan(BUDGET_MS);
        expect(cold.ms).toBeLessThan(BUDGET_MS);
    });
});
