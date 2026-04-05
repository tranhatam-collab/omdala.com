-- D1 seed data for Omniverse O1 (D1 dialect)
INSERT INTO omniverse_rooms (room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at) VALUES 
  ('room_living_001', 'workspace_home_001', 'Living Room', 'scene_evening_relax', 'Evening Relax', '2026-04-05 00:00:00');

INSERT INTO omniverse_room_devices (room_id, device_id, name, type, state_json) VALUES
  ('room_living_001', 'dev_light_001', 'Main Light', 'light', '{"power":"on","brightness":68}'),
  ('room_living_001', 'dev_ac_001', 'Air Conditioner', 'climate', '{"power":"off","targetTempC":24}');
