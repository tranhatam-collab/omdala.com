-- Manual reversal of 0006_om_ai_bridge_credentials. NOT part of the migration set
-- (subdirectory, not in compatibility.json, applied by no workflow). It destroys every
-- bridge credential row, which revokes all outstanding bridge tokens.
BEGIN;

DROP TABLE IF EXISTS omdala.om_ai_bridge_credentials;
DELETE FROM omdala.schema_migrations WHERE version = '0006_om_ai_bridge_credentials';

COMMIT;
