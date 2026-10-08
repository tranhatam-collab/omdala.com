-- OMDALA PostgreSQL Production Initialization
-- Run as superuser (postgres or tranhatam)
-- WARNING: Do NOT commit passwords to repo

-- Create database
CREATE DATABASE omdala_prod;

-- Create application users
CREATE USER omdala_app WITH PASSWORD :app_pass;
CREATE USER omdala_readonly WITH PASSWORD :ro_pass;
CREATE USER omdala_migration WITH PASSWORD :mig_pass;
CREATE USER omdala_backup WITH PASSWORD :bak_pass;

-- Set database owner
ALTER DATABASE omdala_prod OWNER TO omdala_migration;

-- Connect to omdala_prod for schema setup
\c omdala_prod

-- Grant connection to database
GRANT CONNECT ON DATABASE omdala_prod TO omdala_app;
GRANT CONNECT ON DATABASE omdala_prod TO omdala_readonly;
GRANT CONNECT ON DATABASE omdala_prod TO omdala_backup;

-- Schema permissions (will be applied after tables created)
-- omdala_app: read/write on all tables
-- omdala_readonly: SELECT only
-- omdala_migration: DDL (CREATE, ALTER, DROP)
-- omdala_backup: SELECT on all tables for pg_dump

-- Create pgvector extension if available
CREATE EXTENSION IF NOT EXISTS vector;
