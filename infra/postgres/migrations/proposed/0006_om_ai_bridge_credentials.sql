BEGIN;

-- One row per bridge credential minted for Om AI from an authenticated session.
-- The signed token only carries the jti; this row is the authority, so a credential
-- can be revoked on its own, or together with its parent session (parent_sid).
CREATE TABLE IF NOT EXISTS omdala.om_ai_bridge_credentials (
  jti UUID PRIMARY KEY,
  parent_sid UUID NOT NULL,
  owner_email TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  scopes TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS idx_om_ai_bridge_credentials_parent_sid
  ON omdala.om_ai_bridge_credentials(parent_sid);
CREATE INDEX IF NOT EXISTS idx_om_ai_bridge_credentials_expires_at
  ON omdala.om_ai_bridge_credentials(expires_at);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0006_om_ai_bridge_credentials')
ON CONFLICT (version) DO NOTHING;

COMMIT;
