// Session management utilities
// Works with both in-memory (dev) and KV/DB (production) stores

import type { AuthSession, AuthUserSummary } from './index.js';

// ─── Types ───────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
  /** Which app this session belongs to */
  appId?: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  revokedAt?: string;
}

export interface SessionStore {
  create(session: SessionRecord): Promise<void>;
  get(sessionId: string): Promise<SessionRecord | null>;
  getByRefreshToken(refreshToken: string): Promise<SessionRecord | null>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  listByUser(userId: string): Promise<SessionRecord[]>;
  touch(sessionId: string): Promise<void>;
}

// ─── In-Memory Store (Development) ───────────────────────────────────────

export function createInMemorySessionStore(): SessionStore {
  const sessions = new Map<string, SessionRecord>();

  return {
    async create(session) {
      sessions.set(session.id, session);
    },

    async get(sessionId) {
      const s = sessions.get(sessionId);
      if (!s || s.revokedAt) return null;
      if (new Date(s.expiresAt) < new Date()) return null;
      return s;
    },

    async getByRefreshToken(refreshToken) {
      for (const s of sessions.values()) {
        if (s.refreshToken === refreshToken && !s.revokedAt) {
          if (new Date(s.expiresAt) < new Date()) return null;
          return s;
        }
      }
      return null;
    },

    async revoke(sessionId) {
      const s = sessions.get(sessionId);
      if (s) {
        s.revokedAt = new Date().toISOString();
      }
    },

    async revokeAllForUser(userId) {
      for (const s of sessions.values()) {
        if (s.userId === userId) {
          s.revokedAt = new Date().toISOString();
        }
      }
    },

    async listByUser(userId) {
      return Array.from(sessions.values()).filter(
        (s) => s.userId === userId && !s.revokedAt,
      );
    },

    async touch(sessionId) {
      const s = sessions.get(sessionId);
      if (s) {
        s.lastActiveAt = new Date().toISOString();
      }
    },
  };
}

// ─── Session Helpers ─────────────────────────────────────────────────────

/**
 * Generate a unique session ID.
 */
export function generateSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a new session record for a user.
 */
export function createSessionRecord(
  userId: string,
  refreshToken: string,
  options?: {
    expiresInDays?: number;
    userAgent?: string;
    ipAddress?: string;
    appId?: string;
  },
): SessionRecord {
  const now = new Date();
  const expiresInMs = (options?.expiresInDays ?? 30) * 24 * 60 * 60 * 1000;

  return {
    id: generateSessionId(),
    userId,
    refreshToken,
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
    appId: options?.appId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInMs).toISOString(),
    lastActiveAt: now.toISOString(),
  };
}

/**
 * Check if a session is still valid (not expired, not revoked).
 */
export function isSessionValid(session: SessionRecord | null): boolean {
  if (!session) return false;
  if (session.revokedAt) return false;
  return new Date(session.expiresAt) > new Date();
}
