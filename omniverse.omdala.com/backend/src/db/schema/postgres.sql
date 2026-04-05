CREATE TABLE IF NOT EXISTS omniverse_rooms (
  room_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  active_scene_id TEXT NOT NULL,
  active_scene_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omniverse_room_devices (
  room_id TEXT NOT NULL REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state_json JSONB NOT NULL,
  PRIMARY KEY (room_id, device_id)
);

CREATE TABLE IF NOT EXISTS omniverse_devices (
  device_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  room_id TEXT NOT NULL REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state_json JSONB NOT NULL DEFAULT '{}',
  onboarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- workspace_members lives in shared-core (/v1/workspaces), not in Omniverse DB.

CREATE INDEX IF NOT EXISTS idx_omniverse_rooms_workspace
  ON omniverse_rooms(workspace_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_devices_room
  ON omniverse_devices(room_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_devices_workspace
  ON omniverse_devices(workspace_id);

-- Phase O3: Automations (condition+action rules)
CREATE TABLE IF NOT EXISTS omniverse_automations (
  automation_id TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  room_id       TEXT REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  trigger_type  TEXT NOT NULL,             -- 'schedule' | 'condition' | 'manual'
  trigger_json  JSONB NOT NULL DEFAULT '{}', -- cron / condition payload
  actions_json  JSONB NOT NULL DEFAULT '[]', -- [{deviceId, state}]
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omniverse_automations_workspace
  ON omniverse_automations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_automations_room
  ON omniverse_automations(room_id);

-- Phase O3: Schedules (time-based automation triggers)
CREATE TABLE IF NOT EXISTS omniverse_schedules (
  schedule_id    TEXT PRIMARY KEY,
  workspace_id   TEXT NOT NULL,
  automation_id  TEXT NOT NULL REFERENCES omniverse_automations(automation_id) ON DELETE CASCADE,
  cron_expr      TEXT NOT NULL,            -- e.g. '0 7 * * *'
  timezone       TEXT NOT NULL DEFAULT 'UTC',
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at    TIMESTAMPTZ,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omniverse_schedules_workspace
  ON omniverse_schedules(workspace_id);

-- Phase O3: Gateways (physical gateway registry)
CREATE TABLE IF NOT EXISTS omniverse_gateways (
  gateway_id    TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offline', -- 'online' | 'offline' | 'error'
  last_seen_at  TIMESTAMPTZ,
  meta_json     JSONB NOT NULL DEFAULT '{}',
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omniverse_gateways_workspace
  ON omniverse_gateways(workspace_id);

-- Phase O3: Gateway command log (dispatch record)
CREATE TABLE IF NOT EXISTS omniverse_gateway_commands (
  command_id    TEXT PRIMARY KEY,
  gateway_id    TEXT NOT NULL REFERENCES omniverse_gateways(gateway_id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  payload_json  JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'ack' | 'failed'
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ack_at        TIMESTAMPTZ
);

-- Phase O4: Properties (multi-property support — sits above workspaces)
CREATE TABLE IF NOT EXISTS omniverse_properties (
  property_id   TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name          TEXT NOT NULL,
  address       TEXT,
  type          TEXT NOT NULL DEFAULT 'home', -- 'home' | 'office' | 'commercial'
  meta_json     JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omniverse_property_workspaces (
  property_id  TEXT NOT NULL REFERENCES omniverse_properties(property_id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  PRIMARY KEY (property_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_omniverse_properties_owner
  ON omniverse_properties(owner_user_id);

-- Phase O4: Device capability registry
CREATE TABLE IF NOT EXISTS omniverse_device_capabilities (
  capability_id TEXT PRIMARY KEY,
  device_type   TEXT NOT NULL,              -- e.g. 'light', 'climate', 'sensor'
  capability    TEXT NOT NULL,              -- e.g. 'on_off', 'brightness', 'temperature'
  value_type    TEXT NOT NULL DEFAULT 'any', -- 'boolean' | 'number' | 'string' | 'any'
  min_value     NUMERIC,
  max_value     NUMERIC,
  allowed_json  JSONB,                      -- allowed enum values if applicable
  UNIQUE (device_type, capability)
);

-- Phase O4: Device state history (state graph)
CREATE TABLE IF NOT EXISTS omniverse_state_events (
  event_id        TEXT PRIMARY KEY,
  device_id       TEXT NOT NULL,
  workspace_id    TEXT NOT NULL,
  previous_json   JSONB NOT NULL DEFAULT '{}',
  new_json        JSONB NOT NULL DEFAULT '{}',
  source          TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'automation' | 'gateway' | 'schedule'
  actor_id        TEXT,                           -- userId or automationId or gatewayId
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omniverse_state_events_device
  ON omniverse_state_events(device_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_omniverse_state_events_workspace
  ON omniverse_state_events(workspace_id, recorded_at DESC);

-- Phase O4: Observability event log (proof log / audit trail)
CREATE TABLE IF NOT EXISTS omniverse_events (
  event_id     TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_type   TEXT NOT NULL,   -- 'device.state_changed' | 'scene.activated' | 'automation.run' | 'gateway.command' | 'alert' etc.
  subject_id   TEXT,            -- deviceId / automationId / gatewayId
  payload_json JSONB NOT NULL DEFAULT '{}',
  severity     TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warn' | 'error'
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omniverse_events_workspace
  ON omniverse_events(workspace_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_omniverse_events_type
  ON omniverse_events(event_type, recorded_at DESC);
