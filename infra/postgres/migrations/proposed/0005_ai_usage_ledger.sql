BEGIN;

-- One row per account and UTC day. committed_usd is the money already spent or
-- held for in-flight requests: the conditional UPDATE on this row is what makes a
-- reservation atomic under concurrency (a second writer re-checks the cap against
-- the latest committed value).
CREATE TABLE IF NOT EXISTS omdala.ai_usage_days (
  owner_email TEXT NOT NULL,
  usage_day DATE NOT NULL,
  committed_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, usage_day),
  CHECK (committed_usd >= 0)
);

-- One row per chat request: idempotent per request id, so a replay never charges twice.
CREATE TABLE IF NOT EXISTS omdala.ai_usage_ledger (
  owner_email TEXT NOT NULL,
  request_id TEXT NOT NULL,
  usage_day DATE NOT NULL,
  reserved_usd NUMERIC(12, 6) NOT NULL,
  settled_usd NUMERIC(12, 6),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, request_id),
  FOREIGN KEY (owner_email, usage_day) REFERENCES omdala.ai_usage_days(owner_email, usage_day),
  CHECK (status IN ('reserved', 'settled', 'released')),
  CHECK (reserved_usd >= 0),
  CHECK (settled_usd IS NULL OR settled_usd >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_ledger_owner_day
  ON omdala.ai_usage_ledger(owner_email, usage_day);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0005_ai_usage_ledger')
ON CONFLICT (version) DO NOTHING;

COMMIT;
