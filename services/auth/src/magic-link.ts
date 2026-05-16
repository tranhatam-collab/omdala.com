// Magic Link authentication — passwordless email sign-in
// Flow: User enters email → System generates link → User clicks → Session created

import type { AuthUserSummary } from './index.js';

// ─── Types ───────────────────────────────────────────────────────────────

export interface MagicLinkToken {
  token: string;
  email: string;
  /** Redirect URL after successful login */
  redirectTo: string;
  createdAt: string;
  expiresAt: string;
  /** Whether the token has been consumed */
  used: boolean;
}

export interface MagicLinkConfig {
  /** Token validity in minutes (default: 15) */
  expiresInMinutes?: number;
  /** Base URL for the magic link (e.g., https://app.omdala.com) */
  baseUrl: string;
  /** Path to handle magic link (e.g., /auth/verify) */
  verifyPath?: string;
}

const DEFAULT_EXPIRES_MINUTES = 15;
const DEFAULT_VERIFY_PATH = '/auth/verify';

// ─── Token Generation ────────────────────────────────────────────────────

/**
 * Generate a secure, random magic link token.
 */
export function generateMagicLinkToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a magic link record (to store in DB or KV).
 */
export function createMagicLinkRecord(
  email: string,
  redirectTo: string,
  config: MagicLinkConfig,
): MagicLinkToken {
  const now = new Date();
  const expiresInMs = (config.expiresInMinutes ?? DEFAULT_EXPIRES_MINUTES) * 60 * 1000;

  return {
    token: generateMagicLinkToken(),
    email: email.toLowerCase().trim(),
    redirectTo,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInMs).toISOString(),
    used: false,
  };
}

/**
 * Build the full URL a user clicks in their email.
 */
export function buildMagicLinkUrl(
  token: string,
  config: MagicLinkConfig,
): string {
  const verifyPath = config.verifyPath ?? DEFAULT_VERIFY_PATH;
  return `${config.baseUrl}${verifyPath}?token=${token}`;
}

// ─── Token Validation ────────────────────────────────────────────────────

export type MagicLinkValidation =
  | { valid: true; email: string; redirectTo: string }
  | { valid: false; reason: 'expired' | 'used' | 'not_found' };

/**
 * Validate a magic link token against a stored record.
 */
export function validateMagicLink(
  record: MagicLinkToken | null | undefined,
): MagicLinkValidation {
  if (!record) {
    return { valid: false, reason: 'not_found' };
  }

  if (record.used) {
    return { valid: false, reason: 'used' };
  }

  const now = new Date();
  const expiresAt = new Date(record.expiresAt);
  if (now > expiresAt) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    email: record.email,
    redirectTo: record.redirectTo,
  };
}

// ─── Email Template ──────────────────────────────────────────────────────

export interface MagicLinkEmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Generate email content for a magic link.
 */
export function buildMagicLinkEmail(
  email: string,
  magicLinkUrl: string,
  appName: string = 'OMDALA',
): MagicLinkEmailData {
  return {
    to: email,
    subject: `Sign in to ${appName}`,
    text: `Click this link to sign in to ${appName}:\n\n${magicLinkUrl}\n\nThis link expires in 15 minutes.\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Sign in to ${appName}</h2>
        <p style="color: #4a4a4a; line-height: 1.6;">
          Click the button below to sign in. This link expires in 15 minutes.
        </p>
        <a href="${magicLinkUrl}"
           style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Sign in
        </a>
        <p style="color: #9a9a9a; font-size: 13px; margin-top: 24px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `.trim(),
  };
}
