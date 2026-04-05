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

-- workspace_members lives in shared-core (/v1/workspaces), not in Omniverse DB.

CREATE INDEX IF NOT EXISTS idx_omniverse_rooms_workspace
  ON omniverse_rooms(workspace_id);
