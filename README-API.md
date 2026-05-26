# API Testing Framework

A Playwright-based API testing framework demonstrating REST CRUD, OAuth2 client_credentials, HTTP Basic Auth, JSON Schema validation with AJV, dynamic token refresh, and response-time SLOs.

**Targets:**
- `https://restful-booker.herokuapp.com` (primary)
- Spotify Web API (OAuth2 client_credentials demo)

## Quick start

```bash
# 1. Install dependencies (uses the same lockfile as the rest of the repo)
npm install
npx playwright install --with-deps chromium

# 2. (Optional) copy .env.example to .env and set Spotify creds.
#    Restful Booker uses public docs creds by default, so .env is OPTIONAL
#    just to run the CRUD suite.
cp .env.example .env

# 3. Run every API suite (Restful Booker only - Spotify is skipped by default)
npx playwright test --project=api-restful-booker

# 4. Run all projects
npx playwright test

# 5. Run a single suite
npm run test:crud
npm run test:auth
npm run test:network
```

## Project layout

```
.
+-- package.json                   @playwright/test + ajv + ajv-formats + dotenv + typescript
+-- playwright.config.ts           projects: api-restful-booker, api-spotify
+-- tsconfig.json                  strict, ES2022
+-- .env.example                   sample env keys
+-- tests/
|   +-- crud/
|   |   +-- auth.spec.ts                 POST /auth -> token
|   |   +-- booking-crud.spec.ts         CRUD: POST, GET, PUT, PATCH, DELETE
|   |   +-- e2e-chain.spec.ts            create -> read -> update -> delete in one test
|   +-- auth-schema/
|   |   +-- basic-auth.spec.ts           HTTP Basic Auth via httpCredentials
|   |   +-- oauth2-spotify.spec.ts       client_credentials flow + Bearer call
|   |   +-- schema-validation.spec.ts    AJV validates booking response
|   |   +-- dynamic-token.spec.ts        401 detection + auto-refresh + retry once
|   +-- network/
|       +-- request-context.spec.ts      request.newContext vs page.request
|       +-- response-time.spec.ts        latency + budget assertions
+-- fixtures/
|   +-- api-fixtures.ts          custom test fixture: authed request context, helpers
+-- schemas/
|   +-- booking.schema.json              draft-07 schema for a booking
|   +-- auth.schema.json                 draft-07 schema for /auth response
|   +-- spotify-new-releases.schema.json draft-07 schema for new-releases endpoint
+-- support/
|   +-- ajv-setup.ts             AJV instance + expect.extend({ toMatchSchema })
|   +-- oauth2-helper.ts         fetchSpotifyToken, bearer, invalidateSpotifyToken
|   +-- env-loader.ts            dotenv multi-env loader with safe fallbacks
+-- .github/workflows/api-tests.yml      CI runner
```

## What's covered

### CRUD (`tests/crud`)

| Test | Method | Path | Asserts |
|---|---|---|---|
| `auth.spec.ts` | POST | `/auth` | 200, `token` matches `^[A-Za-z0-9]+$`, schema validates |
| `auth.spec.ts` | POST | `/auth` (bad creds) | 200, body has `reason: "Bad credentials"` |
| `booking-crud.spec.ts` | POST | `/booking` | 200, `bookingid` is a number, schema validates |
| `booking-crud.spec.ts` | GET | `/booking/{id}` | 200, body matches schema, field values preserved |
| `booking-crud.spec.ts` | PUT | `/booking/{id}` | 200, full replacement reflected in response |
| `booking-crud.spec.ts` | PATCH | `/booking/{id}` | 200, only the patched field changed |
| `booking-crud.spec.ts` | DELETE | `/booking/{id}` | 201, follow-up GET returns 404 |
| `e2e-chain.spec.ts` | all | `/booking/{id}` | full create -> read -> put -> patch -> delete -> 404 chain |

### Auth + Schema (`tests/auth-schema`)

| Test | Asserts |
|---|---|
| `basic-auth.spec.ts` | DELETE works with `httpCredentials` (no Cookie token); unauthenticated DELETE returns 403 |
| `oauth2-spotify.spec.ts` | POST `/api/token` with client_credentials returns `access_token`; Bearer call to `/v1/browse/new-releases` returns 200 and matches schema; token is cached across calls |
| `schema-validation.spec.ts` | Real booking response matches schema; payloads missing required fields or with wrong types are rejected |
| `dynamic-token.spec.ts` | Stale token triggers 403, helper refreshes once and retries successfully; valid token does NOT trigger a refresh |

### Network (`tests/network`)

| Test | Asserts |
|---|---|
| `request-context.spec.ts` | Two independent `request.newContext()` instances return identical bodies for the same endpoint; contexts with different baseURLs do not leak state |
| `response-time.spec.ts` | `/ping`, `/booking`, `/booking/1` stay under the configurable response-time budget (default 3000ms) |

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `BOOKER_URL` | Restful Booker base URL | `https://restful-booker.herokuapp.com` |
| `BOOKER_USER` | Admin username | `admin` |
| `BOOKER_PASS` | Admin password | `password123` |
| `SPOTIFY_API_URL` | Spotify Web API base | `https://api.spotify.com` |
| `SPOTIFY_TOKEN_URL` | Spotify token endpoint | `https://accounts.spotify.com/api/token` |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | *(unset - tests skip)* |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | *(unset - tests skip)* |
| `API_RESPONSE_TIME_BUDGET_MS` | Latency budget | `3000` |

If `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` are missing or still hold the `.env.example` placeholder, the OAuth2 spec calls `test.skip()` instead of failing. So a fresh clone runs green even without Spotify creds.

## How to author a new schema

1. Drop a `.schema.json` file under `schemas/` using JSON Schema draft-07.
2. Import it in your spec:

   ```ts
   import mySchema from '../../schemas/my.schema.json';
   ```

3. Use the custom matcher:

   ```ts
   import { expect } from '../../fixtures/api-fixtures';
   expect(await response.json()).toMatchSchema(mySchema);
   ```

4. If validation fails, AJV's full error trail is printed including the JSON path of every mismatch.

## CI

`.github/workflows/api-tests.yml` runs the full `api-restful-booker` project on every push and PR. Spotify tests are gated behind two GitHub secrets (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`); if those secrets aren't present, the OAuth2 spec self-skips, and the build stays green.

## Notes / gotchas

- Restful Booker is hosted on a Heroku free dyno. The very first call after a cold start can take 5+ seconds. The default response-time budget (3000ms) is set for warm calls; if you hit a cold dyno in CI, the response-time spec is the only one that may flake. Adjust `API_RESPONSE_TIME_BUDGET_MS` or add a warm-up `/ping` to the CI workflow if this becomes a problem.
- POST `/auth` with **bad** credentials returns HTTP 200 with a body of `{ "reason": "Bad credentials" }`. This is a Booker quirk - the test for it asserts the body rather than the status.
- DELETE returns 201 (not 204) on success. Also a Booker quirk.
