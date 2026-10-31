-- Manual reversal of 0008_rate_limit_windows. NOT part of the migration set (subdirectory, not in
-- compatibility.json, applied by no workflow). The API falls back to its per-isolate limiter
-- when the table is missing, so dropping it only loosens the limits.
BEGIN;

DROP TABLE IF EXISTS omdala.rate_limit_windows;
DELETE FROM omdala.schema_migrations WHERE version = '0008_rate_limit_windows';

COMMIT;
