CREATE TABLE IF NOT EXISTS omniverse_rooms (
  room_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  active_scene_id TEXT NOT NULL,
  active_scene_name TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS omniverse_room_devices (
  room_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state_json TEXT NOT NULL,
  PRIMARY KEY (room_id, device_id),
  FOREIGN KEY (room_id) REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS omniverse_devices (
  device_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  state_json TEXT NOT NULL DEFAULT '{}',
  onboarded_at TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE
);

-- workspace_members lives in shared-core (/v1/workspaces), not in Omniverse DB.

CREATE INDEX IF NOT EXISTS idx_omniverse_rooms_workspace
  ON omniverse_rooms(workspace_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_devices_room
  ON omniverse_devices(room_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_devices_workspace
  ON omniverse_devices(workspace_id);

-- Phase O3: Automations
CREATE TABLE IF NOT EXISTS omniverse_automations (
  automation_id TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  room_id       TEXT,
  name          TEXT NOT NULL,
  trigger_type  TEXT NOT NULL,
  trigger_json  TEXT NOT NULL DEFAULT '{}',
  actions_json  TEXT NOT NULL DEFAULT '[]',
  enabled       INTEGER NOT NULL DEFAULT 1,
  last_run_at   TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES omniverse_rooms(room_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_omniverse_automations_workspace
  ON omniverse_automations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_omniverse_automations_room
  ON omniverse_automations(room_id);

-- Phase O3: Schedules
CREATE TABLE IF NOT EXISTS omniverse_schedules (
  schedule_id   TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  cron_expr     TEXT NOT NULL,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  enabled       INTEGER NOT NULL DEFAULT 1,
  next_run_at   TEXT,
  last_run_at   TEXT,
  created_at    TEXT NOT NULL,
  FOREIGN KEY (automation_id) REFERENCES omniverse_automations(automation_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_omniverse_schedules_workspace
  ON omniverse_schedules(workspace_id);

-- Phase O3: Gateways
CREATE TABLE IF NOT EXISTS omniverse_gateways (
  gateway_id    TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offline',
  last_seen_at  TEXT,
  meta_json     TEXT NOT NULL DEFAULT '{}',
  registered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_omniverse_gateways_workspace
  ON omniverse_gateways(workspace_id);

-- Phase O3: Gateway command log
CREATE TABLE IF NOT EXISTS omniverse_gateway_commands (
  command_id    TEXT PRIMARY KEY,
  gateway_id    TEXT NOT NULL,
  device_id     TEXT NOT NULL,
  payload_json  TEXT NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending',
  dispatched_at TEXT NOT NULL,
  ack_at        TEXT,
  FOREIGN KEY (gateway_id) REFERENCES omniverse_gateways(gateway_id) ON DELETE CASCADE
);

-- Phase O4: Properties (multi-property support)
CREATE TABLE IF NOT EXISTS omniverse_properties (
  property_id   TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name          TEXT NOT NULL,
  address       TEXT,
  type          TEXT NOT NULL DEFAULT 'home',
  meta_json     TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS omniverse_property_workspaces (
  property_id  TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  PRIMARY KEY (property_id, workspace_id),
  FOREIGN KEY (property_id) REFERENCES omniverse_properties(property_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_omniverse_properties_owner
  ON omniverse_properties(owner_user_id);

-- Phase O4: Device capability registry
CREATE TABLE IF NOT EXISTS omniverse_device_capabilities (
  capability_id TEXT PRIMARY KEY,
  device_type   TEXT NOT NULL,
  capability    TEXT NOT NULL,
  value_type    TEXT NOT NULL DEFAULT 'any',
  min_value     REAL,
  max_value     REAL,
  allowed_json  TEXT,
  UNIQUE (device_type, capability)
);

-- Phase O4: Device state history (state graph)
CREATE TABLE IF NOT EXISTS omniverse_state_events (
  event_id      TEXT PRIMARY KEY,
  device_id     TEXT NOT NULL,
  workspace_id  TEXT NOT NULL,
  previous_json TEXT NOT NULL DEFAULT '{}',
  new_json      TEXT NOT NULL DEFAULT '{}',
  source        TEXT NOT NULL DEFAULT 'manual',
  actor_id      TEXT,
  recorded_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_omniverse_state_events_device
  ON omniverse_state_events(device_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_omniverse_state_events_workspace
  ON omniverse_state_events(workspace_id, recorded_at);

-- Phase O4: Observability event log (proof log)
CREATE TABLE IF NOT EXISTS omniverse_events (
  event_id     TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  subject_id   TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  severity     TEXT NOT NULL DEFAULT 'info',
  recorded_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_omniverse_events_workspace
  ON omniverse_events(workspace_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_omniverse_events_type
  ON omniverse_events(event_type, recorded_at);
