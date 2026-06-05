-- OMDALA PostgreSQL Schema v2 (L2 — Core + Agent Control Plane)
-- Creates all tables with audit trail, soft delete, and tenant isolation.
-- Run AFTER 01-create-users.sql

-- ------------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------
-- Core Schema
-- ------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS omdala;
GRANT USAGE ON SCHEMA omdala TO omdala_app;
GRANT USAGE ON SCHEMA omdala TO omdala_readonly;
GRANT CREATE ON SCHEMA omdala TO omdala_migration;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT SELECT, INSERT, UPDATE ON TABLES TO omdala_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT SELECT ON TABLES TO omdala_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT USAGE, SELECT ON SEQUENCES TO omdala_app;

SET search_path TO omdala, public;

-- ------------------------------------------------------------------
-- Tenants
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(64) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  domain          VARCHAR(255),
  plan            VARCHAR(32) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  config          JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID
);

CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status);

-- ------------------------------------------------------------------
-- Users
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  email           VARCHAR(255) NOT NULL,
  display_name    VARCHAR(255),
  avatar_url      VARCHAR(500),
  role            VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'tenant_admin', 'developer', 'user', 'agent')),
  external_id     VARCHAR(255), -- Keycloak / Supabase user ID
  metadata        JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID
);

CREATE UNIQUE INDEX idx_users_email_tenant ON users(email, tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_external ON users(external_id);

-- ------------------------------------------------------------------
-- Projects
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  slug            VARCHAR(64) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  config          JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  deleted_by      UUID,
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id) WHERE deleted_at IS NULL;

-- ------------------------------------------------------------------
-- Agent Control Plane (L2.2)
-- ------------------------------------------------------------------

-- Agent tasks — the core unit of work
CREATE TABLE IF NOT EXISTS agent_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  project_id      UUID REFERENCES projects(id),
  parent_id       UUID REFERENCES agent_tasks(id), -- for sub-tasks
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  task_type       VARCHAR(64) NOT NULL CHECK (task_type IN (
    'planner', 'context', 'code', 'db_query', 'deploy', 'verify', 'report',
    'research', 'summarize', 'generate_image', 'generate_video', 'email'
  )),
  priority        VARCHAR(16) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status          VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'queued', 'running', 'paused', 'waiting_approval',
    'completed', 'failed', 'cancelled', 'timeout'
  )),
  input_payload   JSONB NOT NULL DEFAULT '{}',
  output_payload  JSONB,
  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  max_retries     INT NOT NULL DEFAULT 3,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  assigned_agent  VARCHAR(64), -- agent role name
  cost_estimate   NUMERIC(18,6), -- in USD
  cost_actual     NUMERIC(18,6),
  token_count     INT,
  model_used      VARCHAR(128),
  config          JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_tasks_tenant ON agent_tasks(tenant_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX idx_agent_tasks_project ON agent_tasks(project_id);
CREATE INDEX idx_agent_tasks_parent ON agent_tasks(parent_id);
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

-- Agent runs — execution instances of tasks
CREATE TABLE IF NOT EXISTS agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  task_id         UUID NOT NULL REFERENCES agent_tasks(id),
  run_number      INT NOT NULL DEFAULT 1,
  status          VARCHAR(32) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout', 'cancelled')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INT,
  input_hash      VARCHAR(64), -- SHA-256 of input for deduplication
  output_hash     VARCHAR(64),
  cost_usd        NUMERIC(18,6),
  token_input     INT,
  token_output    INT,
  model_version   VARCHAR(128),
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_runs_task ON agent_runs(task_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_created ON agent_runs(created_at DESC);

-- Tool calls — every external action an agent takes
CREATE TABLE IF NOT EXISTS tool_calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  task_id         UUID NOT NULL REFERENCES agent_tasks(id),
  run_id          UUID REFERENCES agent_runs(id),
  tool_name       VARCHAR(128) NOT NULL,
  tool_version    VARCHAR(64),
  action          VARCHAR(128) NOT NULL, -- e.g., 'execute_sql', 'deploy_worker', 'send_email'
  input_params    JSONB NOT NULL,
  output_result   JSONB,
  error_details   JSONB,
  status          VARCHAR(32) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'denied')),
  latency_ms      INT,
  cost_usd        NUMERIC(18,6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_calls_task ON tool_calls(task_id);
CREATE INDEX idx_tool_calls_run ON tool_calls(run_id);
CREATE INDEX idx_tool_calls_tool ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_created ON tool_calls(created_at DESC);

-- Approval requests — mandatory for destructive actions
CREATE TABLE IF NOT EXISTS approval_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  task_id         UUID REFERENCES agent_tasks(id),
  request_type    VARCHAR(64) NOT NULL CHECK (request_type IN (
    'delete_database', 'delete_table', 'restore_production',
    'rotate_secret', 'deploy_production', 'change_dns',
    'gdpr_delete', 'open_firewall', 'scale_vps'
  )),
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  requested_by    UUID NOT NULL REFERENCES users(id),
  approvers       UUID[] NOT NULL, -- array of user IDs who must approve
  approved_by     UUID[],
  rejected_by     UUID,
  rejection_reason TEXT,
  status          VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  evidence_required BOOLEAN NOT NULL DEFAULT true,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  executed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_requests_tenant ON approval_requests(tenant_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_type ON approval_requests(request_type);
CREATE INDEX idx_approval_requests_expires ON approval_requests(expires_at);

-- Evidence logs — immutable record of every action
CREATE TABLE IF NOT EXISTS evidence_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  entity_type     VARCHAR(64) NOT NULL, -- 'agent_task', 'tool_call', 'approval_request', 'user_action'
  entity_id       UUID NOT NULL,
  action          VARCHAR(128) NOT NULL,
  actor_id        UUID REFERENCES users(id),
  actor_type      VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'agent', 'system', 'webhook')),
  payload         JSONB NOT NULL,
  hash_chain      VARCHAR(64), -- SHA-256 of payload + previous hash
  ip_address      INET,
  user_agent      VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_logs_entity ON evidence_logs(entity_type, entity_id);
CREATE INDEX idx_evidence_logs_tenant ON evidence_logs(tenant_id);
CREATE INDEX idx_evidence_logs_created ON evidence_logs(created_at DESC);

-- Model usage — cost tracking per tenant
CREATE TABLE IF NOT EXISTS model_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  task_id         UUID REFERENCES agent_tasks(id),
  run_id          UUID REFERENCES agent_runs(id),
  model           VARCHAR(128) NOT NULL,
  provider        VARCHAR(64) NOT NULL, -- 'openai', 'anthropic', 'google', 'local'
  token_input     INT NOT NULL DEFAULT 0,
  token_output    INT NOT NULL DEFAULT 0,
  cost_usd        NUMERIC(18,6) NOT NULL DEFAULT 0,
  latency_ms      INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_model_usage_tenant ON model_usage(tenant_id);
CREATE INDEX idx_model_usage_created ON model_usage(created_at DESC);
CREATE INDEX idx_model_usage_model ON model_usage(model);

-- ------------------------------------------------------------------
-- Audit & Billing
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  event_type      VARCHAR(64) NOT NULL CHECK (event_type IN (
    'subscription_created', 'subscription_renewed', 'subscription_cancelled',
    'usage_ai', 'usage_storage', 'usage_bandwidth', 'payment_succeeded', 'payment_failed',
    'refund', 'credit_applied'
  )),
  amount          NUMERIC(18,6) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  description     TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_events_tenant ON billing_events(tenant_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_created ON billing_events(created_at DESC);

-- ------------------------------------------------------------------
-- Audit logs — system-level (separate from evidence_logs for performance)
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       UUID REFERENCES tenants(id),
  table_name      VARCHAR(128) NOT NULL,
  record_id       UUID NOT NULL,
  action          VARCHAR(32) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values      JSONB,
  new_values      JSONB,
  changed_by      UUID REFERENCES users(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      INET,
  user_agent      VARCHAR(500)
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- Partition audit_logs by month for performance
-- CREATE TABLE audit_logs_2026_06 PARTITION OF audit_logs
--   FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- ------------------------------------------------------------------
-- Functions
-- ------------------------------------------------------------------

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Evidence hash chain (immutable chain of SHA-256 hashes)
-- Requires pgcrypto extension (created above)
CREATE OR REPLACE FUNCTION compute_evidence_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
BEGIN
  SELECT hash_chain INTO prev_hash FROM evidence_logs
  WHERE tenant_id = NEW.tenant_id
  ORDER BY created_at DESC LIMIT 1;

  IF prev_hash IS NULL THEN
    NEW.hash_chain = encode(digest(NEW.payload::text || 'genesis', 'sha256'), 'hex');
  ELSE
    NEW.hash_chain = encode(digest(NEW.payload::text || prev_hash, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply hash chain trigger
CREATE TRIGGER evidence_hash_chain BEFORE INSERT ON evidence_logs
  FOR EACH ROW EXECUTE FUNCTION compute_evidence_hash();

-- ------------------------------------------------------------------
-- Permissions (apply to existing tables + default for future)
-- ------------------------------------------------------------------

-- App user: full CRUD on existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA omdala TO omdala_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA omdala TO omdala_app;

-- Readonly user: SELECT only
GRANT SELECT ON ALL TABLES IN SCHEMA omdala TO omdala_readonly;

-- Evidence logs: immutable (no UPDATE, no DELETE)
REVOKE UPDATE, DELETE ON evidence_logs FROM omdala_app;
GRANT INSERT, SELECT ON evidence_logs TO omdala_app;

-- Audit logs: immutable (no UPDATE, no DELETE)
REVOKE UPDATE, DELETE ON audit_logs FROM omdala_app;
GRANT INSERT, SELECT ON audit_logs TO omdala_app;

-- Model usage: append-only
REVOKE UPDATE, DELETE ON model_usage FROM omdala_app;
GRANT INSERT, SELECT ON model_usage TO omdala_app;

-- Approval requests: limited update (no DELETE)
REVOKE DELETE ON approval_requests FROM omdala_app;

-- Ensure default privileges for tables created after this script
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO omdala_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT SELECT ON TABLES TO omdala_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA omdala GRANT USAGE, SELECT ON SEQUENCES TO omdala_app;

-- Reset search_path
RESET search_path;

-- ------------------------------------------------------------------
-- Comments
-- ------------------------------------------------------------------

COMMENT ON TABLE tenants IS 'Multi-tenant isolation root';
COMMENT ON TABLE users IS 'Users across all tenants';
COMMENT ON TABLE projects IS 'Projects within tenants';
COMMENT ON TABLE agent_tasks IS 'Agent Control Plane: tasks queue';
COMMENT ON TABLE agent_runs IS 'Agent Control Plane: execution instances';
COMMENT ON TABLE tool_calls IS 'Agent Control Plane: every external tool invocation';
COMMENT ON TABLE approval_requests IS 'Agent Control Plane: human approval gates';
COMMENT ON TABLE evidence_logs IS 'Agent Control Plane: immutable audit trail';
COMMENT ON TABLE model_usage IS 'Agent Control Plane: AI cost tracking';
COMMENT ON TABLE billing_events IS 'Billing and payment events';
COMMENT ON TABLE audit_logs IS 'System-level data change audit';
