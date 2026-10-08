BEGIN;

CREATE TABLE IF NOT EXISTS omdala.billing_subscriptions (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  app_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_email, app_id),
  CHECK (app_id = 'om-ai'),
  CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled')),
  CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE TABLE IF NOT EXISTS omdala.workspaces (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  workspace_type TEXT NOT NULL,
  timezone TEXT NOT NULL,
  locale TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_email, slug),
  CHECK (workspace_type IN ('family', 'organization', 'school', 'business')),
  CHECK (locale IN ('en', 'vi')),
  CHECK (jsonb_typeof(members) = 'array')
);

CREATE TABLE IF NOT EXISTS omdala.shared_notifications (
  id TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  user_id TEXT NOT NULL,
  workspace_id TEXT,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  app_id TEXT NOT NULL,
  deeplink TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, id),
  CHECK (notification_type IN ('system', 'workspace_invite', 'device_alert', 'billing_alert', 'reminder')),
  CHECK (app_id IN ('om-ai', 'omniverse', 'omdala-platform'))
);

CREATE TABLE IF NOT EXISTS omdala.analytics_events (
  id TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  app_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  user_id TEXT,
  workspace_id TEXT,
  session_id TEXT,
  event_source TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, id),
  CHECK (app_id IN ('om-ai', 'omniverse', 'omdala-platform')),
  CHECK (event_source IN ('web', 'app', 'admin', 'docs', 'api', 'worker')),
  CHECK (jsonb_typeof(properties) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_owner_email
  ON omdala.billing_subscriptions(owner_email);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_email
  ON omdala.workspaces(owner_email, created_at);
CREATE INDEX IF NOT EXISTS idx_shared_notifications_owner_email
  ON omdala.shared_notifications(owner_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_owner_occurred_at
  ON omdala.analytics_events(owner_email, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_owner_usage
  ON omdala.analytics_events(owner_email, event_name, occurred_at DESC);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0003_protected_runtime_state')
ON CONFLICT (version) DO NOTHING;

COMMIT;
