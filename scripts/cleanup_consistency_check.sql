-- Post-cleanup consistency checks for trust history references.
-- Usage:
--   psql "$DATABASE_URL" -f scripts/cleanup_consistency_check.sql

\set ON_ERROR_STOP on

DO $$
DECLARE
  dangling_count INTEGER;
BEGIN
  SELECT COUNT(*)
    INTO dangling_count
  FROM trust_score_history h
  LEFT JOIN proofs p ON p.id = h.event_id
  WHERE h.event_id LIKE 'proof_%'
    AND p.id IS NULL;

  IF dangling_count > 0 THEN
    RAISE EXCEPTION 'cleanup consistency failed: % dangling trust_score_history proof references', dangling_count;
  END IF;
END;
$$;

SELECT 'cleanup consistency check passed' AS result;
