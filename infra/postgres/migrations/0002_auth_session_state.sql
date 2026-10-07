BEGIN;

CREATE TABLE IF NOT EXISTS omdala.auth_magic_links (
  jti UUID PRIMARY KEY,
  email TEXT NOT NULL,
  redirect_to TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_magic_links_expires_at
  ON omdala.auth_magic_links(expires_at);

CREATE TABLE IF NOT EXISTS omdala.auth_sessions (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  current_refresh_jti UUID NOT NULL UNIQUE,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_email
  ON omdala.auth_sessions(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_expires_at
  ON omdala.auth_sessions(refresh_expires_at);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0002_auth_session_state')
ON CONFLICT (version) DO NOTHING;

COMMIT;
