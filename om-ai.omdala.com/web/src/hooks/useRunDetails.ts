import { useRef, useState } from 'react';
import { getProof, getRun } from '../api/reality';
import type { ProofRecord, RunRecord } from '../../shared/api-contracts';

type RunDetails = {
  run: RunRecord;
  proof: ProofRecord | null;
};

export function useRunDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, RunDetails>>(new Map());

  async function fetchRunDetails(runId: string): Promise<RunDetails | null> {
    const cached = cacheRef.current.get(runId);
    if (cached) {
      setError(null);
      return cached;
    }

    setLoading(true);

    const runResult = await getRun(runId);
    if (runResult.error || !runResult.value) {
      setError(runResult.error ?? 'run_not_found');
      setLoading(false);
      return null;
    }

    const run = runResult.value;
    if (!run.proof_id) {
      const details = { run, proof: null };
      cacheRef.current.set(runId, details);
      setError(null);
      setLoading(false);
      return details;
    }

    const proofResult = await getProof(run.proof_id);
    if (proofResult.error || !proofResult.value) {
      setError(proofResult.error ?? 'proof_not_found');
      setLoading(false);
      return { run, proof: null };
    }

    const details = { run, proof: proofResult.value };
    cacheRef.current.set(runId, details);
    setError(null);
    setLoading(false);
    return details;
  }

  return { fetchRunDetails, loading, error };
}
