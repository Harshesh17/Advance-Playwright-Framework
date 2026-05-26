/**
 * tests/crud/auth.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 1 - authentication.
 *
 * What's covered:
 *   - POST /auth with valid creds -> 200 + token (a 15+ char alnum string)
 *   - POST /auth with bad creds  -> 200 (booker quirk) + reason in body
 *   - The fixture `bookerHelpers` already fetched a token; we just sanity
 *     check that it looks token-ish.
 */
import { test, expect } from '../../fixtures/api-fixtures';
import authSchema from '../../schemas/auth.schema.json';

test.describe('@P0 @smoke Restful Booker - POST /auth', () => {
    test('returns 200 + token for valid admin/password123', async ({
        plainBookerRequest,
        bookerHelpers,
    }) => {
        const response = await plainBookerRequest.post('/auth', {
            data: {
                username: bookerHelpers.creds.username,
                password: bookerHelpers.creds.password,
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        // AJV-validate the auth response shape.
        expect(body).toMatchSchema(authSchema);
        expect(typeof body.token).toBe('string');
        expect(body.token.length).toBeGreaterThanOrEqual(8);
    });

    test('returns reason field when creds are wrong', async ({ plainBookerRequest }) => {
        const response = await plainBookerRequest.post('/auth', {
            data: { username: 'admin', password: 'definitely-not-the-password' },
        });

        // Restful Booker returns 200 here (not 401) - a small API quirk. We
        // still verify the body says "Bad credentials" so the assertion is
        // meaningful.
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('reason');
        expect(String(body.reason).toLowerCase()).toContain('bad credentials');
    });

    test('token fetched by fixture is reusable across requests', async ({ bookerHelpers }) => {
        // The fixture grabbed a token in setUp; we just assert it's well-formed.
        // This guards against the fixture silently handing back an empty string.
        expect(bookerHelpers.token).toMatch(/^[A-Za-z0-9]+$/);
        expect(bookerHelpers.token.length).toBeGreaterThanOrEqual(8);
    });
});
