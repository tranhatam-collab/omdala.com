-- Migration: 0001_reality_core.down
-- Rolls back the initial OMDALA reality-core schema.

BEGIN;

DROP TABLE IF EXISTS policy_decisions;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS trust_score_history;
DROP TABLE IF EXISTS trust_scores;
DROP TABLE IF EXISTS proofs;
DROP TABLE IF EXISTS transitions;
DROP TABLE IF EXISTS commitments;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS nodes;

COMMIT;
