BEGIN;

CREATE TABLE IF NOT EXISTS omdala.reality_scenes (
  owner_email TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  safety_class TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, scene_id),
  CHECK (jsonb_typeof(actions) = 'array')
);

CREATE TABLE IF NOT EXISTS omdala.reality_runs (
  owner_email TEXT NOT NULL,
  run_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  status TEXT NOT NULL,
  policy_decision TEXT NOT NULL,
  proof_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_email, run_id)
);

CREATE INDEX IF NOT EXISTS idx_reality_runs_owner_created_at
  ON omdala.reality_runs(owner_email, created_at DESC);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0004_reality_scenes_runs')
ON CONFLICT (version) DO NOTHING;

COMMIT;
