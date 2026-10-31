-- Manual reversal of 0004_reality_scenes_runs for a database where these two
-- tables hold nothing worth keeping (a staging reset, a failed rehearsal).
--
-- This file is NOT part of the migration set: it lives in a subdirectory, is not
-- listed in compatibility.json, and no workflow applies it. The release policy is
-- that a code rollback never reverts the schema (the tables are additive and
-- older code ignores them), so run this by hand only. It destroys every scene and
-- run row. Re-applying 0004 afterwards recreates the empty tables.
BEGIN;

DROP TABLE IF EXISTS omdala.reality_runs;
DROP TABLE IF EXISTS omdala.reality_scenes;
DELETE FROM omdala.schema_migrations WHERE version = '0004_reality_scenes_runs';

COMMIT;
