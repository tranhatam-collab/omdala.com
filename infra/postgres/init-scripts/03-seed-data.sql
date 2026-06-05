-- OMDALA Seed Data for Local Development
-- Creates a demo tenant, user, and sample agent tasks.
-- DO NOT RUN IN PRODUCTION.

SET search_path TO omdala, public;

-- Demo tenant
INSERT INTO tenants (slug, name, domain, plan, config, status)
VALUES (
  'demo',
  'OMDALA Demo Tenant',
  'demo.omdala.com',
  'pro',
  '{"features": ["agent_control_plane", "advanced_monitoring"]}',
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- Demo user (password not stored here; managed by Keycloak)
WITH demo_tenant AS (SELECT id FROM tenants WHERE slug = 'demo')
INSERT INTO users (tenant_id, email, display_name, role, external_id, status)
SELECT
  demo_tenant.id,
  'admin@demo.omdala.com',
  'Demo Admin',
  'tenant_admin',
  'demo-admin-001',
  'active'
FROM demo_tenant
ON CONFLICT DO NOTHING;

-- Demo project
WITH demo_tenant AS (SELECT id FROM tenants WHERE slug = 'demo')
INSERT INTO projects (tenant_id, slug, name, description, status)
SELECT
  demo_tenant.id,
  'agent-poc',
  'Agent Proof of Concept',
  'Testing the agent control plane',
  'active'
FROM demo_tenant
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Demo agent tasks
WITH demo_tenant AS (SELECT id FROM tenants WHERE slug = 'demo'),
     demo_user AS (SELECT id FROM users WHERE email = 'admin@demo.omdala.com')
INSERT INTO agent_tasks (tenant_id, title, description, task_type, priority, status, input_payload, created_by, assigned_agent)
SELECT
  demo_tenant.id,
  'Research AI safety trends',
  'Find and summarize latest AI safety papers from 2026',
  'research',
  'high',
  'pending',
  '{"query": "AI safety 2026", "sources": ["arxiv", "openai"]}',
  demo_user.id,
  'PlannerAgent'
FROM demo_tenant, demo_user
UNION ALL
SELECT
  demo_tenant.id,
  'Generate landing page copy',
  'Write marketing copy for new product launch',
  'summarize',
  'medium',
  'queued',
  '{"tone": "professional", "language": "en"}',
  demo_user.id,
  'ContextAgent'
FROM demo_tenant, demo_user
UNION ALL
SELECT
  demo_tenant.id,
  'Deploy new worker version',
  'Build and deploy worker v0.2.0 to staging',
  'deploy',
  'critical',
  'waiting_approval',
  '{"version": "0.2.0", "environment": "staging"}',
  demo_user.id,
  'DeployAgent'
FROM demo_tenant, demo_user;

-- Demo approval request (for the deploy task)
WITH demo_tenant AS (SELECT id FROM tenants WHERE slug = 'demo'),
     deploy_task AS (SELECT id FROM agent_tasks WHERE title = 'Deploy new worker version')
INSERT INTO approval_requests (tenant_id, request_type, title, description, task_id, requested_by, approvers, status)
SELECT
  demo_tenant.id,
  'deploy_production',
  'Approve deployment of worker v0.2.0',
  'This deployment will update the worker service. Rollback plan included.',
  deploy_task.id,
  (SELECT id FROM users WHERE email = 'admin@demo.omdala.com'),
  ARRAY[(SELECT id FROM users WHERE email = 'admin@demo.omdala.com')],
  'pending'
FROM demo_tenant, deploy_task;

-- Reset search path
RESET search_path;
