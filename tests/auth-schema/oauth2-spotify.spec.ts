/**
 * tests/auth-schema/oauth2-spotify.spec.ts
 * -----------------------------------------------------------------------------
 * Lecture 2 - OAuth2 client_credentials flow against the Spotify Web API.
 *
 * Flow:
 *   1. POST https://accounts.spotify.com/api/token with Basic auth
 *      (clientId:clientSecret) and grant_type=client_credentials.
 *   2. Pull `access_token` out of the response.
 *   3. GET https://api.spotify.com/v1/browse/new-releases with Bearer header.
 *   4. AJV-validate against `spotify-new-releases.schema.json`.
 *
 * Tests `test.skip()` cleanly if SPOTIFY_CLIENT_ID/SECRET aren't set, so a
 * fresh clone with no Spotify app still runs green.
 */
import { test as base, request as plainRequest } from '@playwright/test';
import { expect } from '../../support/ajv-setup';
import { fetchSpotifyToken, bearer, invalidateSpotifyToken } from '../../support/oauth2-helper';
import { getSpotifyCreds, env } from '../../support/env-loader';
import spotifySchema from '../../schemas/spotify-new-releases.schema.json';

// We don't want this spec to import the `bookerHelpers` fixture (it would
// fail trying to hit /auth when running the Spotify project alone), so use
// the bare `test` here.
const test = base;

test.describe('@P0 OAuth2 client_credentials - Spotify Web API', () => {
    test.beforeAll(() => {
        const creds = getSpotifyCreds();
        // eslint-disable-next-line playwright/no-skipped-test
        test.skip(
            !creds,
            'Spotify creds not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env to run.',
        );
    });

    test('POST /api/token returns an access_token via client_credentials', async () => {
        const creds = getSpotifyCreds();
        if (!creds) return; // skip safety - the beforeAll already handled it.

        const ctx = await plainRequest.newContext();
        try {
            const token = await fetchSpotifyToken(ctx, creds.clientId, creds.clientSecret);
            expect(token.access_token).toBeTruthy();
            expect(token.token_type.toLowerCase()).toBe('bearer');
            expect(token.expires_in).toBeGreaterThan(0);
        } finally {
            await ctx.dispose();
        }
    });

    test('GET /v1/browse/new-releases works with Bearer token + matches schema', async () => {
        const creds = getSpotifyCreds();
        if (!creds) return;

        const apiUrl = env('SPOTIFY_API_URL', 'https://api.spotify.com');
        const ctx = await plainRequest.newContext({ baseURL: apiUrl });

        try {
            const token = await fetchSpotifyToken(ctx, creds.clientId, creds.clientSecret);

            const response = await ctx.get('/v1/browse/new-releases?limit=5', {
                headers: { Authorization: bearer(token) },
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body).toMatchSchema(spotifySchema);
            expect(body.albums.items.length).toBeGreaterThan(0);
        } finally {
            await ctx.dispose();
        }
    });

    test('token is cached across calls (cache hit returns same token string)', async () => {
        const creds = getSpotifyCreds();
        if (!creds) return;

        const ctx = await plainRequest.newContext();
        try {
            // Make sure we're starting clean for this assertion.
            invalidateSpotifyToken(creds.clientId);
            const first = await fetchSpotifyToken(ctx, creds.clientId, creds.clientSecret);
            const second = await fetchSpotifyToken(ctx, creds.clientId, creds.clientSecret);
            expect(second.access_token).toBe(first.access_token);
        } finally {
            await ctx.dispose();
        }
    });
});
