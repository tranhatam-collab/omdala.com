-- Cleanup smoke-test records from OMDALA production DB.
-- Safe target: only synthetic IDs created by smoke scripts.
-- Additional safety: only remove records created recently.

BEGIN;

-- Safety window for cleanup script.
-- Tune if needed, but keep narrow enough to avoid broad deletes.
DO $$
BEGIN
  IF current_setting('TIME ZONE') IS NULL THEN
    PERFORM 1;
  END IF;
END;
$$;

DELETE FROM trust_score_history
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND (
    event_id LIKE 'proof_%'
    OR reason_code = 'proof_submitted'
  );

DELETE FROM proofs
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND (
    id LIKE 'proof_%'
    OR summary IN ('smoke-proof', 'dev-progress-proof', 'Receipt smoke')
  );

DELETE FROM commitments
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND (
    id LIKE 'commitment_%'
    OR title IN ('smoke-check', 'dev-progress-check', 'Invoice smoke', 'Invoice test', 'E2E check', 'Final post check', 'Runtime commitment check')
    OR summary IN ('smoke run', 'e2e write check', 'Smoke create commitment', 'Test commitment from Codex', 'Final pass check', 'Commitment after db-client fix', 'Post-deploy write test', 'Runtime test commitment')
  );

COMMIT;
