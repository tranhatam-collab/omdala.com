BEGIN;

CREATE SCHEMA IF NOT EXISTS omdala;

CREATE TABLE IF NOT EXISTS omdala.schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.nodes (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  location_text TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.states (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES omdala.nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'current',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.commitments (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL REFERENCES omdala.nodes(id),
  to_node_id TEXT NOT NULL REFERENCES omdala.nodes(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  amount NUMERIC(18, 2),
  currency VARCHAR(3),
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.transitions (
  id TEXT PRIMARY KEY,
  commitment_id TEXT REFERENCES omdala.commitments(id) ON DELETE SET NULL,
  node_id TEXT NOT NULL REFERENCES omdala.nodes(id),
  from_state_label TEXT NOT NULL,
  to_state_label TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.proofs (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  commitment_id TEXT REFERENCES omdala.commitments(id) ON DELETE SET NULL,
  transition_id TEXT REFERENCES omdala.transitions(id) ON DELETE SET NULL,
  proof_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.trust_scores (
  node_id TEXT PRIMARY KEY REFERENCES omdala.nodes(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'basic',
  explanation JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.trust_score_history (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES omdala.nodes(id) ON DELETE CASCADE,
  previous_score NUMERIC(5, 2),
  new_score NUMERIC(5, 2) NOT NULL,
  reason_code TEXT NOT NULL,
  reason_detail TEXT NOT NULL,
  event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.account_profiles (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS omdala.account_preferences (
  email TEXT PRIMARY KEY REFERENCES omdala.account_profiles(email) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'system',
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE omdala.nodes
  ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE omdala.proofs
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM omdala.nodes WHERE owner_email IS NULL) THEN
    RAISE EXCEPTION 'Assign owner_email to every existing omdala.nodes row before release';
  END IF;
  IF EXISTS (SELECT 1 FROM omdala.proofs WHERE owner_email IS NULL) THEN
    RAISE EXCEPTION 'Assign owner_email to every existing omdala.proofs row before release';
  END IF;
END
$$;

ALTER TABLE omdala.nodes
  ALTER COLUMN owner_email SET NOT NULL;
ALTER TABLE omdala.proofs
  ALTER COLUMN owner_email SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_states_node_id
  ON omdala.states(node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_owner_email
  ON omdala.nodes(owner_email);
CREATE INDEX IF NOT EXISTS idx_commitments_created_at
  ON omdala.commitments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transitions_commitment_id
  ON omdala.transitions(commitment_id);
CREATE INDEX IF NOT EXISTS idx_proofs_commitment_id
  ON omdala.proofs(commitment_id);
CREATE INDEX IF NOT EXISTS idx_proofs_owner_email
  ON omdala.proofs(owner_email);
CREATE INDEX IF NOT EXISTS idx_trust_history_node_id
  ON omdala.trust_score_history(node_id, created_at DESC);

INSERT INTO omdala.schema_migrations (version)
VALUES ('0001_omdala_api_runtime')
ON CONFLICT (version) DO NOTHING;

COMMIT;
