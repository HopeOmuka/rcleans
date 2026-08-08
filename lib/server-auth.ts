import { verifyToken } from "@clerk/backend";
import { AppError } from "@/lib/api-error";

/**
 * Server-only auth helpers for +api routes.
 * NEVER import this file from client-side code.
 *
 * Two credential types are accepted via `Authorization: Bearer <token>`:
 *  - Customer: Clerk session JWT (verified with CLERK_SECRET_KEY)
 *  - Cleaner: HMAC-signed token (verified with CLEANER_TOKEN_SECRET)
 */

function b64urlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Clerk (customer) verification
// ---------------------------------------------------------------------------

function getClerkSecretKey(): string {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new AppError(
      500,
      "CLERK_SECRET_KEY is not configured on the server",
      "SERVER_CONFIG_ERROR",
    );
  }
  return process.env.CLERK_SECRET_KEY;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export interface UserAuth {
  kind: "user";
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export async function requireUserAuth(request: Request): Promise<UserAuth> {
  const token = getBearerToken(request);
  if (!token) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }
  try {
    const claims = await verifyToken(token, {
      secretKey: getClerkSecretKey(),
      clockSkewInMs: 60_000,
    });
    if (!claims.sub) {
      throw new Error("Missing subject in token");
    }
    return {
      kind: "user",
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      firstName: typeof claims.first_name === "string" ? claims.first_name : undefined,
      lastName: typeof claims.last_name === "string" ? claims.last_name : undefined,
    };
  } catch {
    throw new AppError(401, "Invalid or expired session", "UNAUTHORIZED");
  }
}

// ---------------------------------------------------------------------------
// Cleaner HMAC tokens
// ---------------------------------------------------------------------------

const CLEANER_TOKEN_PREFIX = "v1.";
const CLEANER_TOKEN_TTL_DAYS = 30;

export interface CleanerAuth {
  kind: "cleaner";
  cleanerId: string;
  email: string;
  phone: string;
}

function getCleanerTokenSecret(): string {
  const secret = process.env.CLEANER_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new AppError(
      500,
      "CLEANER_TOKEN_SECRET is not configured on the server",
      "SERVER_CONFIG_ERROR",
    );
  }
  return secret;
}

export async function issueCleanerToken(
  cleaner: { id: string; email: string; phone: string },
  ttlDays: number = CLEANER_TOKEN_TTL_DAYS,
): Promise<string> {
  const secret = getCleanerTokenSecret();
  const payload = b64urlEncode(
    JSON.stringify({
      sub: cleaner.id,
      email: cleaner.email,
      phone: cleaner.phone,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60,
    }),
  );
  const body = CLEANER_TOKEN_PREFIX + payload;
  const sig = b64urlEncode(await hmacSha256(body, secret));
  return `${body}.${sig}`;
}

export async function requireCleanerAuth(request: Request): Promise<CleanerAuth> {
  const token = getBearerToken(request);
  if (!token) {
    throw new AppError(401, "Authentication required", "UNAUTHORIZED");
  }
  const secret = getCleanerTokenSecret();
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== CLEANER_TOKEN_PREFIX.slice(0, -1)) {
    throw new AppError(401, "Invalid or expired cleaner session", "UNAUTHORIZED");
  }
  const body = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(body, secret);
  let provided: Uint8Array;
  try {
    provided = b64urlDecode(parts[2]);
  } catch {
    // Malformed base64url (e.g. non-alphabet characters) is an auth failure,
    // not a server error.
    throw new AppError(401, "Invalid or expired cleaner session", "UNAUTHORIZED");
  }
  if (!timingSafeEqual(expected, provided)) {
    throw new AppError(401, "Invalid or expired cleaner session", "UNAUTHORIZED");
  }
  let payload: { sub?: string; email?: string; phone?: string; exp?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  } catch {
    throw new AppError(401, "Invalid or expired cleaner session", "UNAUTHORIZED");
  }
  if (!payload.sub || !payload.email || !payload.phone) {
    throw new AppError(401, "Invalid or expired cleaner session", "UNAUTHORIZED");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
    throw new AppError(401, "Cleaner session expired", "SESSION_EXPIRED");
  }
  return {
    kind: "cleaner",
    cleanerId: payload.sub,
    email: payload.email,
    phone: payload.phone,
  };
}

// ---------------------------------------------------------------------------
// DB-backed fixed-window rate limiter
//
// Buckets live in the `rate_limits` table instead of an in-memory Map so
// limits are durable, shared across workers/restarts, and observable in both
// dev and production. (An in-memory Map is re-created by Metro for every dev
// request and per worker, which silently disables the limit.)
// ---------------------------------------------------------------------------

import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

type RateQuery = (
  bucketKey: string,
  windowSecs: number,
) => Promise<Array<{ count: number | string }>>;

let rateDb: ReturnType<typeof neon> | null = null;

const defaultRateQuery: RateQuery = async (bucketKey, windowSecs) => {
  if (!process.env.DATABASE_URL) return [{ count: 0 }];
  if (!rateDb) rateDb = neon(`${process.env.DATABASE_URL}`);
  try {
    const [row] = (await rateDb`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES (${bucketKey}, 1, now() + make_interval(secs => ${windowSecs}))
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= now()
          THEN now() + make_interval(secs => ${windowSecs})
          ELSE rate_limits.reset_at END
      RETURNING count
    `) as unknown as Array<{ count: number | string }>;
    if (Math.random() < 0.01) {
      rateDb`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 hour'`
        .catch(() => {});
    }
    return [row];
  } catch {
    return [{ count: 0 }];
  }
};

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  query: RateQuery = defaultRateQuery,
): Promise<void> {
  if (windowMs <= 0) return;
  const bucketKey = createHash("sha256").update(key).digest("hex");
  const windowSecs = Math.max(1, Math.round(windowMs / 1000));
  const [row] = await query(bucketKey, windowSecs);
  if (Number(row?.count ?? 1) > limit) {
    throw new AppError(429, "Too many requests. Please try again later.", "RATE_LIMITED");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("cf-connecting-ip") || "unknown";
}

/**
 * Accepts either a customer (Clerk JWT) or cleaner (HMAC) token.
 * Used by routes that both roles may access.
 */
export async function resolveAuth(request: Request): Promise<UserAuth | CleanerAuth> {
  const token = getBearerToken(request);
  if (token && token.startsWith(CLEANER_TOKEN_PREFIX)) {
    return requireCleanerAuth(request);
  }
  return requireUserAuth(request);
}
