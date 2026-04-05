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
      setError('Unable to load plan details. Please try again. / Khong the tai chi tiet ke hoach. Vui long thu lai.');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { fetchPlan, loading, error };
}
