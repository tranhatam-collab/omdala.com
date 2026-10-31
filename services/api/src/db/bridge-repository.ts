// PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)
//
// Server-side rows for Om AI bridge credentials (migration 0006_om_ai_bridge_credentials).
import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";
import { toDbQueryError } from "./errors";

export type BridgeCredentialRow = {
  jti: string;
  parentSid: string;
  ownerEmail: string;
  workspaceId: string;
  scopes: string[];
  expiresAt: number;
  revoked: boolean;
};

async function inDbContext<T>(operation: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDbQueryError(error, operation);
  }
}

export async function insertBridgeCredential(env: ApiBindings, row: Omit<BridgeCredentialRow, "revoked">) {
  await inDbContext("insertBridgeCredential", () =>
    queryRows(
      env,
      `INSERT INTO omdala.om_ai_bridge_credentials
         (jti, parent_sid, owner_email, workspace_id, scopes, expires_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::timestamptz)`,
      [row.jti, row.parentSid, row.ownerEmail, row.workspaceId, row.scopes.join(" "), new Date(row.expiresAt).toISOString()],
    ),
  );
}

export async function readBridgeCredential(env: ApiBindings, jti: string): Promise<BridgeCredentialRow | null> {
  const rows = await inDbContext("readBridgeCredential", () =>
    queryRows<Record<string, unknown>>(
      env,
      `SELECT jti::text AS jti, parent_sid::text AS parent_sid, owner_email, workspace_id, scopes,
              (EXTRACT(EPOCH FROM expires_at) * 1000)::float8 AS expires_ms,
              (revoked_at IS NOT NULL) AS revoked
         FROM omdala.om_ai_bridge_credentials WHERE jti = $1::uuid`,
      [jti],
    ),
  );
  const row = rows[0];
  if (!row) return null;
  return {
    jti: String(row.jti),
    parentSid: String(row.parent_sid),
    ownerEmail: String(row.owner_email),
    workspaceId: String(row.workspace_id),
    scopes: String(row.scopes).split(" ").filter(Boolean),
    expiresAt: Number(row.expires_ms),
    revoked: row.revoked === true,
  };
}

export async function revokeBridgeCredential(env: ApiBindings, jti: string): Promise<boolean> {
  const rows = await inDbContext("revokeBridgeCredential", () =>
    queryRows(
      env,
      `UPDATE omdala.om_ai_bridge_credentials SET revoked_at = NOW()
        WHERE jti = $1::uuid AND revoked_at IS NULL RETURNING 1 AS revoked`,
      [jti],
    ),
  );
  return rows.length === 1;
}

export async function revokeBridgeCredentialsForSession(env: ApiBindings, parentSid: string): Promise<number> {
  const rows = await inDbContext("revokeBridgeCredentialsForSession", () =>
    queryRows(
      env,
      `UPDATE omdala.om_ai_bridge_credentials SET revoked_at = NOW()
        WHERE parent_sid = $1::uuid AND revoked_at IS NULL RETURNING 1 AS revoked`,
      [parentSid],
    ),
  );
  return rows.length;
}
