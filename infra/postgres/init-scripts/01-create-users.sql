-- OMDALA PostgreSQL User Initialization (P4)
-- Runs on first container start via docker-entrypoint-initdb.d
-- Creates roles with least privilege.

-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------

-- App user: read/write on application schema
CREATE USER omdala_app WITH PASSWORD '${POSTGRES_APP_PASSWORD}';
GRANT CONNECT ON DATABASE omdala_prod TO omdala_app;
GRANT USAGE ON SCHEMA public TO omdala_app;
GRANT CREATE ON SCHEMA public TO omdala_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO omdala_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO omdala_app;

-- Readonly user: analytics, reporting, monitoring
CREATE USER omdala_readonly WITH PASSWORD '${POSTGRES_READONLY_PASSWORD}';
GRANT CONNECT ON DATABASE omdala_prod TO omdala_readonly;
GRANT USAGE ON SCHEMA public TO omdala_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO omdala_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO omdala_readonly;

-- Migration user: schema changes only, no data DML
CREATE USER omdala_migration WITH PASSWORD '${POSTGRES_MIGRATION_PASSWORD}';
GRANT CONNECT ON DATABASE omdala_prod TO omdala_migration;
GRANT USAGE, CREATE ON SCHEMA public TO omdala_migration;

-- Backup user: pg_dump access
CREATE USER omdala_backup WITH PASSWORD '${POSTGRES_BACKUP_PASSWORD}';
GRANT CONNECT ON DATABASE omdala_prod TO omdala_backup;
GRANT USAGE ON SCHEMA public TO omdala_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO omdala_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO omdala_backup;

-- MCP readonly user: AI agent access, limited to specific schemas
CREATE USER mcp_readonly WITH PASSWORD '${POSTGRES_MCP_PASSWORD}';
GRANT CONNECT ON DATABASE omdala_prod TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;

-- Keycloak schema (isolated from public)
CREATE SCHEMA IF NOT EXISTS keycloak;
GRANT ALL ON SCHEMA keycloak TO omdala_app;

-- Audit log schema
CREATE SCHEMA IF NOT EXISTS audit;
GRANT ALL ON SCHEMA audit TO omdala_app;
GRANT USAGE ON SCHEMA audit TO omdala_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO omdala_readonly;

-- Comment for traceability
COMMENT ON DATABASE omdala_prod IS 'OMDALA Autonomous Backend Platform — initialized 2026-06-05';
