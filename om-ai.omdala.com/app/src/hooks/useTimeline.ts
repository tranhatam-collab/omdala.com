import { useEffect, useState } from 'react';
import { getProof, getRun, listRuns } from '../api/reality';
import type { RunRecord, ProofRecord } from '../../../shared/api-contracts';

export type TimelineEntry = {
  run: RunRecord;
  proof: ProofRecord | null;
};

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const runsResult = await listRuns(20);
    if (runsResult.error || !runsResult.value) {
      setError(runsResult.error ?? 'request_failed');
      setLoading(false);
      return;
    }

    const runEntries: TimelineEntry[] = [];
    for (const run of runsResult.value) {
      if (!run.proof_id) {
        runEntries.push({ run, proof: null });
        continue;
      }
      const proofResult = await getProof(run.proof_id);
      runEntries.push({ run, proof: proofResult.value ?? null });
    }

    setEntries(runEntries);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return { entries, refresh, loading, error };
}
