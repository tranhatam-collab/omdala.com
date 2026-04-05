import { useState } from 'react';
import { getPlan } from '../api/reality';

export function usePlanDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlan(planId: string) {
    setLoading(true);
    const result = await getPlan(planId);
    setLoading(false);
    if (result.error || !result.value) {
      setError(result.error ?? 'request_failed');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { fetchPlan, loading, error };
}
