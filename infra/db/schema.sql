-- OMDALA Reality Core Schema (PostgreSQL)
-- Canonical source for initial production database structure.

BEGIN;

-- 1) Nodes
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  node_type TEXT NOT NULL CHECK (node_type IN ('person', 'team', 'business', 'place', 'community', 'agent')),
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  location_text TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'restricted_public' CHECK (visibility IN ('private', 'network', 'restricted_public', 'public')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_node_type ON nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);

-- 2) States
CREATE TABLE IF NOT EXISTS states (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('current', 'desired', 'blocked', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_states_node_id ON states(node_id);
CREATE INDEX IF NOT EXISTS idx_states_status ON states(status);

-- 3) Commitments
CREATE TABLE IF NOT EXISTS commitments (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL REFERENCES nodes(id),
  to_node_id TEXT NOT NULL REFERENCES nodes(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  amount NUMERIC(18,2),
  currency TEXT,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'active', 'completed', 'failed', 'disputed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commitments_from_node ON commitments(from_node_id);
CREATE INDEX IF NOT EXISTS idx_commitments_to_node ON commitments(to_node_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_due_at ON commitments(due_at);

-- 4) Transitions
CREATE TABLE IF NOT EXISTS transitions (
  id TEXT PRIMARY KEY,
  commitment_id TEXT REFERENCES commitments(id) ON DELETE SET NULL,
  node_id TEXT NOT NULL REFERENCES nodes(id),
  from_state_label TEXT NOT NULL,
  to_state_label TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transitions_commitment_id ON transitions(commitment_id);
CREATE INDEX IF NOT EXISTS idx_transitions_node_id ON transitions(node_id);
CREATE INDEX IF NOT EXISTS idx_transitions_status ON transitions(status);

-- 5) Proofs
CREATE TABLE IF NOT EXISTS proofs (
  id TEXT PRIMARY KEY,
  commitment_id TEXT REFERENCES commitments(id) ON DELETE SET NULL,
  transition_id TEXT REFERENCES transitions(id) ON DELETE SET NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('document', 'payment', 'behavior', 'verification')),
  summary TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('not_started', 'pending', 'verified')),
  storage_uri TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_commitment_id ON proofs(commitment_id);
CREATE INDEX IF NOT EXISTS idx_proofs_transition_id ON proofs(transition_id);
CREATE INDEX IF NOT EXISTS idx_proofs_verification_status ON proofs(verification_status);

-- 6) Trust scores
CREATE TABLE IF NOT EXISTS trust_scores (
  node_id TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('unverified', 'basic', 'verified', 'established', 'trusted')),
  explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7) Trust score history
CREATE TABLE IF NOT EXISTS trust_score_history (
  id BIGSERIAL PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  previous_score NUMERIC(5,2),
  new_score NUMERIC(5,2) NOT NULL,
  reason_code TEXT NOT NULL,
  reason_detail TEXT NOT NULL DEFAULT '',
  event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_score_history_node_id ON trust_score_history(node_id);
CREATE INDEX IF NOT EXISTS idx_trust_score_history_created_at ON trust_score_history(created_at);

-- 8) Events (append-only)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  actor_node_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);

-- 9) Policy decisions (audit)
CREATE TABLE IF NOT EXISTS policy_decisions (
  id TEXT PRIMARY KEY,
  action_key TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'deny', 'review')),
  reason_code TEXT NOT NULL,
  reason_detail TEXT NOT NULL DEFAULT '',
  decided_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_decisions_target ON policy_decisions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_policy_decisions_action_key ON policy_decisions(action_key);

COMMIT;
