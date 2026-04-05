import { useEffect, useState } from 'react';
import { listRuns } from '../api/reality';
import type { RunRecord } from '../../shared/api-contracts';

export function useRuns() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const result = await listRuns(20);
    if (result.error || !result.value) {
      setError('Unable to load activity timeline. Please try again. / Khong the tai nhat ky hoat dong. Vui long thu lai.');
      setLoading(false);
      return;
    }
    setRuns(result.value);
    setError(null);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return { runs, refresh, loading, error };
}
