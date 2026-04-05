// JWT token generation and validation utilities
// Uses Web Crypto API (works in Cloudflare Workers, Node 20+, browsers)

import type { AuthSession, AuthUserSummary } from './index.js';

// ─── Types ───────────────────────────────────────────────────────────────

export interface JwtPayload {
  /** Subject (user ID) */
  sub: string;
  /** Email */
  email: string;
  /** Display name */
  name: string;
  /** Roles */
  roles: string[];
  /** Issued at (epoch seconds) */
  iat: number;
  /** Expires at (epoch seconds) */
  exp: number;
  /** Issuer */
  iss: string;
  /** App identifier (om-ai | omniverse | platform) */
  app?: string | undefined;
}

export interface JwtConfig {
  /** HMAC secret key (base64-encoded or raw string) */
  secret: string;
  /** Token lifetime in seconds (default: 12 hours) */
  expiresIn?: number;
  /** Issuer string (default: 'omdala') */
  issuer?: string;
}

const DEFAULT_EXPIRES_IN = 12 * 60 * 60; // 12 hours
const DEFAULT_ISSUER = 'omdala';

// ─── Helpers ─────────────────────────────────────────────────────────────

function base64UrlEncode(data: Uint8Array | string): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...data);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(data: string, signature: string, key: CryptoKey): Promise<boolean> {
  const encoder = new TextEncoder();
  const sigBytes = Uint8Array.from(base64UrlDecode(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Generate a JWT token for a given user.
 */
export async function generateToken(
  user: AuthUserSummary,
  config: JwtConfig,
  appId?: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.displayName,
    roles: user.roles,
    iat: now,
    exp: now + (config.expiresIn ?? DEFAULT_EXPIRES_IN),
    iss: config.issuer ?? DEFAULT_ISSUER,
    app: appId,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const key = await getSigningKey(config.secret);
  const signature = await sign(`${header}.${body}`, key);

  return `${header}.${body}.${signature}`;
}

/**
 * Validate and decode a JWT token.
 * Returns the payload if valid, or null if expired/tampered.
 */
export async function verifyToken(
  token: string,
  config: JwtConfig,
): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const key = await getSigningKey(config.secret);

  const isValid = await verify(`${header}.${body}`, signature, key);
  if (!isValid) return null;

  try {
    const payload: JwtPayload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) return null;

    // Check issuer
    const expectedIssuer = config.issuer ?? DEFAULT_ISSUER;
    if (payload.iss && payload.iss !== expectedIssuer) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Convert a JWT payload to an AuthSession.
 */
export function payloadToSession(payload: JwtPayload): AuthSession {
  return {
    user: {
      id: payload.sub,
      email: payload.email,
      displayName: payload.name,
      roles: payload.roles as AuthSession['user']['roles'],
    },
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

/**
 * Generate a refresh token (opaque, random).
 * Store in DB; exchange for new access token.
 */
export function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
