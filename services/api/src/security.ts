// ─── OMDALA Custom Security API ───────────────────────────────────────────
// Provides: API key auth, webhook signature verification, CSRF tokens,
//           secure rate-limit helpers, and service-to-service trust.

// ─── Types ───────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  keyId: string;
  keyHash: string; // never store raw key
  name: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
  revokedAt?: string;
  lastUsedAt?: string;
}

export interface VerifiedWebhook {
  valid: boolean;
  source?: string;
  error?: string;
}

export interface CsrfTokenPair {
  token: string;
  expiresAt: number;
}

// ─── API Key Auth ────────────────────────────────────────────────────────

const API_KEY_PREFIX = "omdala_sk_";

export async function secureStringEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index]! ^ rightBytes[index]!;
  }
  return difference === 0;
}

export function generateApiKey(): { keyId: string; rawKey: string } {
  const keyId = `key_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const rawKey = `${API_KEY_PREFIX}${keyId}_${randomPart}`;
  return { keyId, rawKey };
}

async function hashApiKey(rawKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyApiKey(
  rawKey: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashApiKey(rawKey);
  if (actual.length !== expectedHash.length) return false;
  let match = 0;
  for (let i = 0; i < actual.length; i++) {
    match |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return match === 0;
}

export async function createApiKeyRecord(
  name: string,
  scopes: string[] = ["read"],
  expiresInDays?: number,
): Promise<{ record: ApiKeyRecord; rawKey: string }> {
  const { keyId, rawKey } = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  const now = new Date();
  const record: ApiKeyRecord = {
    keyId,
    keyHash,
    name,
    scopes,
    createdAt: now.toISOString(),
    ...(expiresInDays
      ? { expiresAt: new Date(now.getTime() + expiresInDays * 86400000).toISOString() }
      : {}),
  };
  return { record, rawKey };
}

// ─── Webhook Signature Verification ──────────────────────────────────────

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: "sha256" = "sha256",
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: algorithm.toUpperCase() },
    false,
    ["sign", "verify"],
  );
  const sigBytes = hexToBytes(signature);
  const dataBytes = encoder.encode(payload);
  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(sigBytes),
    toArrayBuffer(dataBytes),
  );
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function parseWebhookSignatureHeader(
  header: string | undefined,
): { timestamp: string; signature: string } | null {
  if (!header) return null;
  // Supports: t=1234567890,v1=abc123...
  const parts = header.split(",");
  const tsPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));
  if (!tsPart || !sigPart) return null;
  return {
    timestamp: tsPart.slice(2),
    signature: sigPart.slice(3),
  };
}

// ─── CSRF Protection ───────────────────────────────────────────────────────

const CSRF_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function generateCsrfToken(secret: string): Promise<CsrfTokenPair> {
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expiresAt = Date.now() + CSRF_TTL_MS;
  const payload = `${nonce}:${expiresAt}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const token = `${payload}:${sigHex}`;
  return { token, expiresAt };
}

export async function verifyCsrfToken(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [nonce, expStr, sigHex] = parts;
    const expiresAt = Number(expStr);
    if (!nonce || Number.isNaN(expiresAt) || !sigHex) return false;
    if (expiresAt < Date.now()) return false;

    const payload = `${nonce}:${expiresAt}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const sigBytes = hexToBytes(sigHex);
    const dataBytes = encoder.encode(payload);
    return crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(sigBytes),
      toArrayBuffer(dataBytes),
    );
  } catch {
    return false;
  }
}

// ─── Secure Client IP ────────────────────────────────────────────────────

export function getTrustedClientIp(headers: Headers): string {
  // Cloudflare-specific first, then fallbacks
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // First IP in X-Forwarded-For is typically the real client when behind CF
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

// ─── Rate Limit (Worker-friendly bucketing) ──────────────────────────────

export interface RateLimitState {
  count: number;
  resetAt: number;
}

/** Simple in-memory rate limiter. For distributed deploys, upgrade to KV/Durable Objects. */
export class RateLimiter {
  private store = new Map<string, RateLimitState>();

  isLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = this.store.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    if (bucket.count >= limit) return true;
    bucket.count += 1;
    this.store.set(key, bucket);
    return false;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  getState(key: string): RateLimitState | undefined {
    return this.store.get(key);
  }
}

// ─── Secure Cookie Builder ───────────────────────────────────────────────

export interface CookieOptions {
  name: string;
  value: string;
  maxAgeSeconds?: number;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export function buildSecureCookie(options: CookieOptions): string {
  const parts: string[] = [`${options.name}=${options.value}`];
  const path = options.path ?? "/";
  parts.push(`Path=${path}`);
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }
  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }
  if (options.secure !== false) {
    parts.push("Secure");
  }
  const sameSite = options.sameSite ?? "Lax";
  parts.push(`SameSite=${sameSite}`);
  return parts.join("; ");
}

export function buildClearCookie(name: string, domain?: string, path = "/"): string {
  return buildSecureCookie({
    name,
    value: "",
    maxAgeSeconds: 0,
    domain,
    path,
  });
}

// ─── CORS Origin Resolver ────────────────────────────────────────────────

export function resolveAllowedOrigin(
  origin: string | null | undefined,
  allowedOrigins: Set<string>,
): string | null {
  if (!origin) return null;
  // Exact match
  if (allowedOrigins.has(origin)) return origin;
  // Wildcard subdomain match (e.g., https://*.omdala.com)
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith("https://*.")) {
      const suffix = allowed.slice("https://*.".length).toLowerCase();
      try {
        const candidate: URL = new URL(origin);
        if (
          candidate.protocol === "https:" &&
          candidate.origin === origin &&
          candidate.hostname.toLowerCase().endsWith(`.${suffix}`)
        ) {
          return origin;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

// ─── Service-to-Service Trust Token ──────────────────────────────────────

export async function createServiceToken(
  serviceId: string,
  secret: string,
  ttlSeconds = 60,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: serviceId,
    iat: now,
    exp: now + ttlSeconds,
    jti: crypto.randomUUID(),
  });
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const payloadB64 = btoa(payload)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${payloadB64}.${sigB64}`;
}

export async function verifyServiceToken(
  token: string,
  secret: string,
): Promise<{ sub: string; jti: string } | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { sub: string; iat: number; exp: number; jti: string };
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payloadB64),
    );
    if (!valid) return null;
    return { sub: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}
