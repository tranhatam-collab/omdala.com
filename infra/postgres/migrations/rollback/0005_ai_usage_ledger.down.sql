-- Manual reversal of 0005_ai_usage_ledger for a database where AI usage history
-- is not needed (a staging reset, a failed rehearsal).
--
-- NOT part of the migration set: it lives in a subdirectory, is not listed in
-- compatibility.json, and no workflow applies it. A code rollback never reverts the
-- schema; run this by hand only. It destroys every usage row, which resets all
-- daily caps. Re-applying 0005 afterwards recreates the empty tables.
BEGIN;

DROP TABLE IF EXISTS omdala.ai_usage_ledger;
DROP TABLE IF EXISTS omdala.ai_usage_days;
DELETE FROM omdala.schema_migrations WHERE version = '0005_ai_usage_ledger';

COMMIT;
