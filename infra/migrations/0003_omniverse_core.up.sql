-- AI Omniverse Core Schema
-- Domain: Device + Environment + Physical Action Control
-- Tables: homes, rooms, devices, scenes, automations, activity_log, home_members, home_invites

BEGIN;

-- 1) Homes
CREATE TABLE IF NOT EXISTS homes (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  home_type TEXT NOT NULL DEFAULT 'house' CHECK (home_type IN (
    'house', 'apartment', 'office', 'venue', 'hotel', 'other'
  )),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  floorplan_url TEXT,
  room_count INTEGER NOT NULL DEFAULT 0,
  device_count INTEGER NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homes_owner_id ON homes(owner_id);

-- 2) Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'other' CHECK (room_type IN (
    'living_room', 'bedroom', 'kitchen', 'bathroom', 'office',
    'garage', 'hallway', 'outdoor', 'meeting_room', 'lobby', 'other'
  )),
  floor INTEGER,
  device_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_home_id ON rooms(home_id);

-- 3) Devices
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN (
    'light', 'thermostat', 'plug', 'lock', 'camera',
    'sensor', 'blind', 'speaker', 'switch', 'other'
  )),
  manufacturer TEXT NOT NULL DEFAULT '',
  model TEXT,
  protocol TEXT NOT NULL DEFAULT 'wifi' CHECK (protocol IN (
    'wifi', 'bluetooth', 'zigbee', 'zwave', 'matter', 'local_api'
  )),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN (
    'online', 'offline', 'pairing', 'error'
  )),
  is_on BOOLEAN NOT NULL DEFAULT FALSE,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  battery_level SMALLINT CHECK (battery_level >= 0 AND battery_level <= 100),
  firmware_version TEXT,
  ip_address TEXT,
  mac_address TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_home_id ON devices(home_id);
CREATE INDEX IF NOT EXISTS idx_devices_room_id ON devices(room_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- 4) Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN (
    'manual', 'time', 'presence', 'sensor'
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'draft')),
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenes_home_id ON scenes(home_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);

-- 5) Automations
CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_def JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'draft')),
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_home_id ON automations(home_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);

-- 6) Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  actor_id TEXT,
  actor_name TEXT,
  action TEXT NOT NULL CHECK (action IN (
    'device_controlled', 'scene_executed', 'automation_triggered',
    'device_added', 'device_removed', 'member_invited',
    'member_joined', 'settings_changed'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN (
    'device', 'scene', 'automation', 'room', 'home', 'member'
  )),
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_home_id ON activity_log(home_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_occurred_at ON activity_log(occurred_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- 7) Home Members
CREATE TABLE IF NOT EXISTS home_members (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (home_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_home_members_home_id ON home_members(home_id);
CREATE INDEX IF NOT EXISTS idx_home_members_user_id ON home_members(user_id);

-- 8) Home Invites
CREATE TABLE IF NOT EXISTS home_invites (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  invited_by_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_home_invites_home_id ON home_invites(home_id);
CREATE INDEX IF NOT EXISTS idx_home_invites_email ON home_invites(email);

-- 9) Omniverse Subscriptions
CREATE TABLE IF NOT EXISTS omniverse_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'home_pro', 'business_space')),
  max_homes INTEGER DEFAULT 1,
  price_monthly NUMERIC(8,2) NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_omniverse_subscriptions_user ON omniverse_subscriptions(user_id);

-- 10) Device Templates (Admin)
CREATE TABLE IF NOT EXISTS device_templates (
  id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  device_type TEXT NOT NULL,
  models JSONB NOT NULL DEFAULT '[]'::jsonb,
  protocol TEXT NOT NULL DEFAULT 'wifi',
  api_endpoint TEXT,
  auth_method TEXT CHECK (auth_method IN ('oauth', 'api_key', 'local')),
  supported_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_properties JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'beta', 'disabled')),
  timeout_ms INTEGER NOT NULL DEFAULT 5000,
  retry_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_templates_manufacturer ON device_templates(manufacturer);
CREATE INDEX IF NOT EXISTS idx_device_templates_device_type ON device_templates(device_type);

COMMIT;
