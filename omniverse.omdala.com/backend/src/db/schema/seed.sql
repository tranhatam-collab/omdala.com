-- =============================================================
-- Omniverse O1 seed data for local development and testing
-- Safe to re-run: uses INSERT ... ON CONFLICT DO NOTHING
-- =============================================================

-- Rooms
INSERT INTO omniverse_rooms (room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at)
VALUES
  ('room_living_001', 'workspace_home_001', 'Living Room', 'scene_evening_relax', 'Evening Relax', '2026-04-05T00:00:00Z'),
  ('room_bedroom_001', 'workspace_home_001', 'Master Bedroom', 'scene_sleep', 'Sleep Mode', '2026-04-05T00:00:00Z'),
  ('room_office_001', 'workspace_office_001', 'Main Office', 'scene_work_focus', 'Work Focus', '2026-04-05T00:00:00Z')
ON CONFLICT (room_id) DO NOTHING;

-- Devices
INSERT INTO omniverse_room_devices (room_id, device_id, name, type, state_json)
VALUES
  ('room_living_001', 'dev_light_001', 'Main Light', 'light', '{"power":"on","brightness":68}'),
  ('room_living_001', 'dev_ac_001', 'Air Conditioner', 'climate', '{"power":"off","targetTempC":24}'),
  ('room_living_001', 'dev_speaker_001', 'Smart Speaker', 'speaker', '{"power":"on","volume":35}'),
  ('room_bedroom_001', 'dev_light_002', 'Bedside Lamp', 'light', '{"power":"off","brightness":0}'),
  ('room_bedroom_001', 'dev_curtain_001', 'Smart Curtain', 'curtain', '{"position":"closed"}'),
  ('room_office_001', 'dev_light_003', 'Desk Light', 'light', '{"power":"on","brightness":90}'),
  ('room_office_001', 'dev_monitor_001', 'Environment Monitor', 'sensor', '{"tempC":23.5,"humidity":55,"co2ppm":420}')
ON CONFLICT (room_id, device_id) DO NOTHING;
