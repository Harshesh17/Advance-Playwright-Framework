/**
 * support/oauth2-helper.ts
 * -----------------------------------------------------------------------------
 * OAuth2 client_credentials flow helper for Spotify Web API.
 *
 * The client_credentials grant is the right choice for *app-only* API access
 * - no user PII, no redirect URI, no PKCE. The server hands back a bearer
 * token that expires in ~1 hour and you re-fetch when it does.
 *
 * Reference: https://developer.spotify.com/documentation/web-api/concepts/authorization
 *
 * Usage:
 *
 *   import { request } from '@playwright/test';
 *   const ctx = await request.newContext();
 *   const token = await fetchSpotifyToken(ctx, clientId, clientSecret);
 *
 * Tokens are cached in-memory for the life of the worker process, so repeat
 * calls inside the same test run don't hammer the auth server.
 */
import type { APIRequestContext } from '@playwright/test';
import { env } from './env-loader';

export interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    /** epoch ms when this token expires - we compute it ourselves */
    expires_at: number;
}

interface CacheEntry {
    token: OAuthToken;
    fetchedAt: number;
}

const tokenCache = new Map<string, CacheEntry>();

/**
 * Fetch a Spotify access token via client_credentials.
 *
 * @param ctx          Playwright APIRequestContext (so the helper plays nicely
 *                     with the test runner's network instrumentation).
 * @param clientId     Spotify app client ID.
 * @param clientSecret Spotify app client secret.
 * @param force        If true, bypass cache and re-fetch.
 */
export async function fetchSpotifyToken(
    ctx: APIRequestContext,
    clientId: string,
    clientSecret: string,
    force = false,
): Promise<OAuthToken> {
    const cacheKey = clientId;
    const now = Date.now();
    const cached = tokenCache.get(cacheKey);

    // Treat the token as expired 60s before its actual expiry to avoid races
    // on long-running tests.
    const SAFETY_WINDOW_MS = 60_000;
    if (!force && cached && cached.token.expires_at - SAFETY_WINDOW_MS > now) {
        return cached.token;
    }

    const tokenUrl = env('SPOTIFY_TOKEN_URL', 'https://accounts.spotify.com/api/token');
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await ctx.post(tokenUrl, {
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        // Playwright's `form` option URL-encodes for us.
        form: { grant_type: 'client_credentials' },
    });

    if (!response.ok()) {
        const errBody = await response.text();
        throw new Error(
            `[oauth2-helper] Spotify token request failed: ${response.status()} ${response.statusText()} - ${errBody}`,
        );
    }

    const body = (await response.json()) as Omit<OAuthToken, 'expires_at'>;
    const token: OAuthToken = {
        ...body,
        expires_at: now + body.expires_in * 1000,
    };

    tokenCache.set(cacheKey, { token, fetchedAt: now });
    return token;
}

/**
 * Force-evict the cached token for a given client. Useful when a test wants
 * to verify the auto-refresh path explicitly.
 */
export function invalidateSpotifyToken(clientId: string): void {
    tokenCache.delete(clientId);
}

/**
 * Build an Authorization header string from an OAuthToken.
 */
export function bearer(token: OAuthToken): string {
    return `${token.token_type} ${token.access_token}`;
}
