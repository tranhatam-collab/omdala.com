BEGIN;

-- Stable, stored account identifier used as the `sub` claim of Om AI bridge credentials.
-- Random (not derived from the email or from any secret), so rotating MAGIC_LINK_SECRET
-- never changes it. Keyed by the account email, the account key the API uses today.
CREATE TABLE IF NOT EXISTS omdala.account_ids (
  email TEXT PRIMARY KEY,
  account_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0007_account_ids')
ON CONFLICT (version) DO NOTHING;

COMMIT;
