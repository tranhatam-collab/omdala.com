import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRowsMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ queryRows: queryRowsMock }));

import {
  consumeMagicLink,
  createAuthSession,
  isAuthSessionActive,
  registerMagicLink,
  revokeAuthSession,
  rotateAuthSession,
} from "./auth-repository";

const env = { ENVIRONMENT: "staging", DATABASE_URL: "postgres://test" };

describe("persistent authentication authority", () => {
  beforeEach(() => queryRowsMock.mockReset());

  it("registers and atomically consumes a magic-link jti once", async () => {
    queryRowsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { jti: "11111111-1111-4111-8111-111111111111" },
    ]).mockResolvedValueOnce([]);
    const input = {
      jti: "11111111-1111-4111-8111-111111111111",
      email: "owner@omdala.com",
      redirectTo: "/profile",
      expiresAt: Date.now() + 60_000,
    };
    await registerMagicLink(env, input);
    expect(await consumeMagicLink(env, input)).toBe(true);
    expect(await consumeMagicLink(env, input)).toBe(false);
    expect(queryRowsMock.mock.calls[1]?.[1]).toContain("consumed_at IS NULL");
    expect(queryRowsMock.mock.calls[1]?.[1]).toContain("RETURNING jti");
  });

  it("rotates only the current refresh jti and revokes the whole family", async () => {
    queryRowsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "22222222-2222-4222-8222-222222222222" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const session = {
      id: "22222222-2222-4222-8222-222222222222",
      email: "owner@omdala.com",
      currentRefreshJti: "33333333-3333-4333-8333-333333333333",
      refreshExpiresAt: Date.now() + 60_000,
    };
    await createAuthSession(env, session);
    expect(await rotateAuthSession(env, {
      id: session.id,
      email: session.email,
      previousRefreshJti: session.currentRefreshJti,
      nextRefreshJti: "44444444-4444-4444-8444-444444444444",
      refreshExpiresAt: Date.now() + 120_000,
    })).toBe(true);
    expect(queryRowsMock.mock.calls[1]?.[1]).toContain("current_refresh_jti = $3::uuid");
    expect(queryRowsMock.mock.calls[1]?.[1]).toContain("revoked_at IS NULL");
    await revokeAuthSession(env, session.id);
    expect(await isAuthSessionActive(env, { id: session.id, email: session.email })).toBe(false);
    expect(queryRowsMock.mock.calls[2]?.[1]).toContain("revoked_at = COALESCE");
  });
});
