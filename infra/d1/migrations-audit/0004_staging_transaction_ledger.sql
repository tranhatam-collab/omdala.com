-- Append-only staging transaction control ledger.
-- Apply explicitly to omdala-audit-staging before enabling staging mutation.

CREATE TABLE IF NOT EXISTS staging_transaction_ledger_schema (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  database_name TEXT NOT NULL CHECK (database_name = 'omdala-audit-staging'),
  installed_at TEXT NOT NULL
);

INSERT OR IGNORE INTO staging_transaction_ledger_schema
  (singleton, schema_version, database_name, installed_at)
VALUES
  (1, 1, 'omdala-audit-staging', datetime('now'));

-- This row is deliberately not populated by the migration. A staging operator must
-- reconcile provider state and retained workflow history once, then insert the exact
-- ACTIVATED epoch receipt before this ledger can accept any transaction event.
CREATE TABLE IF NOT EXISTS staging_transaction_ledger_activation (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  activation_epoch TEXT NOT NULL CHECK (activation_epoch = 'omdala-staging-ledger-v1'),
  reconciliation_receipt_sha256 TEXT NOT NULL CHECK (length(reconciliation_receipt_sha256) = 64),
  reconciliation_payload_json TEXT NOT NULL CHECK (
    json_valid(reconciliation_payload_json) AND COALESCE(
      json_extract(reconciliation_payload_json, '$.imported_unresolved_count') = 0 AND
      json_extract(reconciliation_payload_json, '$.imported_unresolved_digest') =
        '37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570',
      0
    )
  ),
  activated_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS staging_transaction_ledger_activation_no_update
BEFORE UPDATE ON staging_transaction_ledger_activation
BEGIN
  SELECT RAISE(ABORT, 'staging transaction ledger activation is immutable');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_ledger_activation_no_delete
BEFORE DELETE ON staging_transaction_ledger_activation
BEGIN
  SELECT RAISE(ABORT, 'staging transaction ledger activation is immutable');
END;

CREATE TABLE IF NOT EXISTS staging_transaction_events (
  event_id TEXT PRIMARY KEY CHECK (event_id = transaction_id || ':' || event_type),
  transaction_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('PREPARED', 'COMMITTED', 'RECOVERED')),
  event_sequence INTEGER NOT NULL CHECK (
    (event_type = 'PREPARED' AND event_sequence = 0) OR
    (event_type IN ('COMMITTED', 'RECOVERED') AND event_sequence = 1)
  ),
  workflow_run_id INTEGER NOT NULL CHECK (
    workflow_run_id > 0 AND transaction_id = 'staging-' || workflow_run_id || '-1'
  ),
  candidate_sha TEXT NOT NULL CHECK (
    length(candidate_sha) = 40 AND candidate_sha NOT GLOB '*[^0-9a-f]*'
  ),
  prepared_sha256 TEXT NOT NULL CHECK (
    length(prepared_sha256) = 64 AND prepared_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  payload_sha256 TEXT NOT NULL CHECK (
    length(payload_sha256) = 64 AND payload_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  payload_json TEXT NOT NULL CHECK (
    json_valid(payload_json) AND length(CAST(payload_json AS BLOB)) <= 1048576
  ),
  created_at TEXT NOT NULL,
  CHECK (COALESCE(
    json_extract(payload_json, '$.schema_version') = 1 AND
    json_extract(payload_json, '$.transaction_id') = transaction_id AND
    json_extract(payload_json, '$.workflow_run_id') = workflow_run_id AND
    json_extract(payload_json, '$.candidate_sha') = candidate_sha AND
    json_extract(payload_json, '$.production_release_authorized') = 0 AND
    json_extract(payload_json, '$.record_type') = CASE event_type
      WHEN 'PREPARED' THEN 'capsule'
      WHEN 'COMMITTED' THEN 'commit'
      WHEN 'RECOVERED' THEN 'recovery'
    END AND
    (event_type = 'PREPARED' OR
      json_extract(payload_json, '$.prepared_record_sha256') = prepared_sha256),
    0
  )),
  CHECK (event_type != 'PREPARED' OR prepared_sha256 = payload_sha256),
  UNIQUE (transaction_id, event_type),
  UNIQUE (transaction_id, event_sequence)
);

CREATE INDEX IF NOT EXISTS idx_staging_transaction_events_transaction
  ON staging_transaction_events (transaction_id, event_sequence);

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_require_activation
BEFORE INSERT ON staging_transaction_events
WHEN NOT EXISTS (
  SELECT 1 FROM staging_transaction_ledger_activation
  WHERE singleton = 1 AND activation_epoch = 'omdala-staging-ledger-v1'
)
BEGIN
  SELECT RAISE(ABORT, 'staging transaction ledger is not activated');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_one_unresolved
BEFORE INSERT ON staging_transaction_events
WHEN NEW.event_type = 'PREPARED'
  AND NOT EXISTS (
    SELECT 1 FROM staging_transaction_events
    WHERE event_id = NEW.event_id
      AND payload_sha256 = NEW.payload_sha256
      AND payload_json = NEW.payload_json
  )
  AND EXISTS (
    SELECT 1
    FROM staging_transaction_events prepared
    WHERE prepared.event_type = 'PREPARED'
      AND NOT EXISTS (
        SELECT 1 FROM staging_transaction_events terminal
        WHERE terminal.transaction_id = prepared.transaction_id
          AND terminal.event_sequence = 1
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'another staging transaction is unresolved');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_terminal_requires_prepared
BEFORE INSERT ON staging_transaction_events
WHEN NEW.event_type IN ('COMMITTED', 'RECOVERED')
  AND NOT EXISTS (
    SELECT 1 FROM staging_transaction_events prepared
    WHERE prepared.transaction_id = NEW.transaction_id
      AND prepared.event_type = 'PREPARED'
      AND prepared.event_sequence = 0
      AND prepared.workflow_run_id = NEW.workflow_run_id
      AND prepared.candidate_sha = NEW.candidate_sha
      AND prepared.payload_sha256 = NEW.prepared_sha256
  )
BEGIN
  SELECT RAISE(ABORT, 'terminal event does not match exact PREPARED event');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_terminal_is_exclusive
BEFORE INSERT ON staging_transaction_events
WHEN NEW.event_type IN ('COMMITTED', 'RECOVERED')
  AND EXISTS (
    SELECT 1 FROM staging_transaction_events terminal
    WHERE terminal.transaction_id = NEW.transaction_id
      AND terminal.event_sequence = 1
      AND NOT (
        terminal.event_id = NEW.event_id
        AND terminal.payload_sha256 = NEW.payload_sha256
        AND terminal.payload_json = NEW.payload_json
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'staging transaction already has a different terminal event');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_no_update
BEFORE UPDATE ON staging_transaction_events
BEGIN
  SELECT RAISE(ABORT, 'staging transaction ledger is append-only');
END;

CREATE TRIGGER IF NOT EXISTS staging_transaction_events_no_delete
BEFORE DELETE ON staging_transaction_events
BEGIN
  SELECT RAISE(ABORT, 'staging transaction ledger is append-only');
END;
