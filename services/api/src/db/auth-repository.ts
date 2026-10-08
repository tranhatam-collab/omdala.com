import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";

type IdRow = { id: string };
type JtiRow = { jti: string };

export type AuthSessionRecord = {
  id: string;
  email: string;
  currentRefreshJti: string;
  refreshExpiresAt: number;
};

export async function registerMagicLink(
  env: ApiBindings,
  input: { jti: string; email: string; redirectTo: string; expiresAt: number },
): Promise<void> {
  await queryRows(
    env,
    `INSERT INTO omdala.auth_magic_links
       (jti, email, redirect_to, expires_at)
     VALUES ($1::uuid, $2, $3, $4::timestamptz)`,
    [input.jti, input.email, input.redirectTo, new Date(input.expiresAt).toISOString()],
  );
}

export async function consumeMagicLink(
  env: ApiBindings,
  input: { jti: string; email: string },
): Promise<boolean> {
  const rows = await queryRows<JtiRow>(
    env,
    `UPDATE omdala.auth_magic_links
     SET consumed_at = NOW()
     WHERE jti = $1::uuid
       AND email = $2
       AND consumed_at IS NULL
       AND expires_at > NOW()
     RETURNING jti::text AS jti`,
    [input.jti, input.email],
  );
  return rows.length === 1;
}

export async function createAuthSession(
  env: ApiBindings,
  input: AuthSessionRecord,
): Promise<void> {
  await queryRows(
    env,
    `INSERT INTO omdala.auth_sessions
       (id, email, current_refresh_jti, refresh_expires_at)
     VALUES ($1::uuid, $2, $3::uuid, $4::timestamptz)`,
    [
      input.id,
      input.email,
      input.currentRefreshJti,
      new Date(input.refreshExpiresAt).toISOString(),
    ],
  );
}

export async function rotateAuthSession(
  env: ApiBindings,
  input: {
    id: string;
    email: string;
    previousRefreshJti: string;
    nextRefreshJti: string;
    refreshExpiresAt: number;
  },
): Promise<boolean> {
  const rows = await queryRows<IdRow>(
    env,
    `UPDATE omdala.auth_sessions
     SET current_refresh_jti = $4::uuid,
         refresh_expires_at = $5::timestamptz,
         updated_at = NOW()
     WHERE id = $1::uuid
       AND email = $2
       AND current_refresh_jti = $3::uuid
       AND revoked_at IS NULL
       AND refresh_expires_at > NOW()
     RETURNING id::text AS id`,
    [
      input.id,
      input.email,
      input.previousRefreshJti,
      input.nextRefreshJti,
      new Date(input.refreshExpiresAt).toISOString(),
    ],
  );
  return rows.length === 1;
}

export async function revokeAuthSession(
  env: ApiBindings,
  id: string,
): Promise<void> {
  await queryRows(
    env,
    `UPDATE omdala.auth_sessions
     SET revoked_at = COALESCE(revoked_at, NOW()), updated_at = NOW()
     WHERE id = $1::uuid`,
    [id],
  );
}

export async function isAuthSessionActive(
  env: ApiBindings,
  input: { id: string; email: string },
): Promise<boolean> {
  const rows = await queryRows<IdRow>(
    env,
    `SELECT id::text AS id
     FROM omdala.auth_sessions
     WHERE id = $1::uuid
       AND email = $2
       AND revoked_at IS NULL
       AND refresh_expires_at > NOW()`,
    [input.id, input.email],
  );
  return rows.length === 1;
}
