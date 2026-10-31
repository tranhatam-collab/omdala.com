-- Manual reversal of 0007_account_ids. NOT part of the migration set (subdirectory, not in
-- compatibility.json, applied by no workflow). Dropping it changes every account's `sub`
-- the next time one is minted, so run it only on a database with no live bridge credentials.
BEGIN;

DROP TABLE IF EXISTS omdala.account_ids;
DELETE FROM omdala.schema_migrations WHERE version = '0007_account_ids';

COMMIT;
