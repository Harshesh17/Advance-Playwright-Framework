/**
 * support/env-loader.ts
 * -----------------------------------------------------------------------------
 * Multi-environment dotenv loader. Reads `.env` by default; if `API_ENV` is
 * set it will also layer `.env.{API_ENV}` on top so you can do:
 *
 *   API_ENV=ci  -> loads .env, then .env.ci (overrides)
 *   API_ENV=dev -> loads .env, then .env.dev (overrides)
 *
 * Variables defined in CI runtime (GitHub Actions secrets, etc.) always win
 * because dotenv does NOT overwrite existing process.env keys by default.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

let loaded = false;

export function loadEnv(): void {
    if (loaded) return;

    const root = process.cwd();
    const baseFile = path.join(root, '.env');
    if (fs.existsSync(baseFile)) {
        dotenv.config({ path: baseFile });
    }

    const envName = process.env.API_ENV;
    if (envName) {
        const layered = path.join(root, `.env.${envName}`);
        if (fs.existsSync(layered)) {
            dotenv.config({ path: layered });
        }
    }

    loaded = true;
}

/**
 * Read an env var and throw a helpful error if it's missing or still has the
 * placeholder value from .env.example.
 */
export function requiredEnv(name: string): string {
    loadEnv();
    const v = process.env[name];
    if (!v || v.trim() === '' || v.includes('your_') || v.endsWith('_here')) {
        throw new Error(
            `[env-loader] Missing required env var: ${name}. ` +
                `Copy .env.example to .env and set a real value.`,
        );
    }
    return v;
}

/**
 * Read an env var or return a fallback. Use for non-secret config that has a
 * sensible default (URLs, timeouts, etc.).
 */
export function env(name: string, fallback: string): string {
    loadEnv();
    return process.env[name] ?? fallback;
}

/**
 * Read an env var as a number with a fallback.
 */
export function envNumber(name: string, fallback: number): number {
    const raw = env(name, String(fallback));
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Spotify creds may be unset in local dev. Return null instead of throwing so
 * tests can `test.skip()` gracefully when the demo creds aren't configured.
 */
export function getSpotifyCreds(): { clientId: string; clientSecret: string } | null {
    loadEnv();
    const id = process.env.SPOTIFY_CLIENT_ID;
    const secret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!id || !secret || id.includes('your_') || secret.includes('your_')) {
        return null;
    }
    return { clientId: id, clientSecret: secret };
}
