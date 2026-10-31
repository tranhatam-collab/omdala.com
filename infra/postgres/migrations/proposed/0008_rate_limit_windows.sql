BEGIN;

-- Fixed-window request counters shared by every Worker isolate. One row per hashed key and
-- window; a single conditional upsert counts a request and refuses it once the window's limit
-- is reached, so parallel isolates cannot exceed the limit between them. Keys are hashed in
-- the application, so no email or address is stored.
CREATE TABLE IF NOT EXISTS omdala.rate_limit_windows (
  key_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, window_start),
  CHECK (hits >= 0)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_window_start
  ON omdala.rate_limit_windows(window_start);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0008_rate_limit_windows')
ON CONFLICT (version) DO NOTHING;

COMMIT;
