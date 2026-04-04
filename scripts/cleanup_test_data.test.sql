-- Integration-style safety checks for scripts/cleanup_test_data.sql
-- Usage:
--   psql "$DATABASE_URL" -f scripts/cleanup_test_data.test.sql

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO commitments (id, from_node_id, to_node_id, title, summary, status, created_at, updated_at)
VALUES
  ('commitment_test_delete', 'node_a', 'node_b', 'smoke-check', 'smoke run', 'draft', NOW(), NOW()),
  ('commitment_test_keep', 'node_a', 'node_b', 'safe-commitment', 'business record', 'draft', NOW(), NOW()),
  ('commitment_test_old_keep', 'node_a', 'node_b', 'smoke-check', 'smoke run', 'draft', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO proofs (id, commitment_id, proof_type, summary, verification_status, created_at, updated_at)
VALUES
  ('proof_test_delete', 'commitment_test_delete', 'payment', 'smoke-proof', 'pending', NOW(), NOW()),
  ('proof_test_keep', 'commitment_test_keep', 'payment', 'business-proof', 'pending', NOW(), NOW()),
  ('proof_test_old_keep', 'commitment_test_old_keep', 'payment', 'smoke-proof', 'pending', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trust_score_history (node_id, previous_score, new_score, reason_code, reason_detail, event_id, created_at)
VALUES
  ('node_a', 10, 10.2, 'proof_submitted', 'test delete', 'proof_test_delete', NOW()),
  ('node_a', 10.2, 10.3, 'manual_review', 'test keep', 'evt_keep_1', NOW()),
  ('node_a', 9.8, 10, 'proof_submitted', 'old keep', 'proof_test_old_keep', NOW() - INTERVAL '30 days');

\i scripts/cleanup_test_data.sql
\i scripts/cleanup_consistency_check.sql

DO $$
DECLARE
  deleted_commitment_exists boolean;
  keep_commitment_exists boolean;
  deleted_proof_exists boolean;
  keep_proof_exists boolean;
  deleted_history_exists boolean;
  keep_history_exists boolean;
  old_keep_commitment_exists boolean;
  old_keep_proof_exists boolean;
  old_keep_history_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM commitments WHERE id = 'commitment_test_delete') INTO deleted_commitment_exists;
  SELECT EXISTS (SELECT 1 FROM commitments WHERE id = 'commitment_test_keep') INTO keep_commitment_exists;
  SELECT EXISTS (SELECT 1 FROM proofs WHERE id = 'proof_test_delete') INTO deleted_proof_exists;
  SELECT EXISTS (SELECT 1 FROM proofs WHERE id = 'proof_test_keep') INTO keep_proof_exists;
  SELECT EXISTS (SELECT 1 FROM trust_score_history WHERE event_id = 'proof_test_delete') INTO deleted_history_exists;
  SELECT EXISTS (SELECT 1 FROM trust_score_history WHERE event_id = 'evt_keep_1') INTO keep_history_exists;
  SELECT EXISTS (SELECT 1 FROM commitments WHERE id = 'commitment_test_old_keep') INTO old_keep_commitment_exists;
  SELECT EXISTS (SELECT 1 FROM proofs WHERE id = 'proof_test_old_keep') INTO old_keep_proof_exists;
  SELECT EXISTS (SELECT 1 FROM trust_score_history WHERE event_id = 'proof_test_old_keep') INTO old_keep_history_exists;

  IF deleted_commitment_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: commitment_test_delete should be removed';
  END IF;

  IF deleted_proof_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: proof_test_delete should be removed';
  END IF;

  IF deleted_history_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: trust_score_history proof_test_delete should be removed';
  END IF;

  IF NOT keep_commitment_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: commitment_test_keep should remain';
  END IF;

  IF NOT keep_proof_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: proof_test_keep should remain';
  END IF;

  IF NOT keep_history_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: trust_score_history evt_keep_1 should remain';
  END IF;

  IF NOT old_keep_commitment_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: commitment_test_old_keep should remain (outside cleanup time window)';
  END IF;

  IF NOT old_keep_proof_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: proof_test_old_keep should remain (outside cleanup time window)';
  END IF;

  IF NOT old_keep_history_exists THEN
    RAISE EXCEPTION 'cleanup safety test failed: trust_score_history proof_test_old_keep should remain (outside cleanup time window)';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'cleanup_test_data.sql safety assertions passed' AS result;
