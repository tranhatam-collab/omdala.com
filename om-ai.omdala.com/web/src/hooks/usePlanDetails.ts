import { useState } from 'react';
import { describeApiError } from '../api/liveErrors';
import { getPlan } from '../api/reality';

export function usePlanDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlan(planId: string) {
    setLoading(true);
    const result = await getPlan(planId);
    setLoading(false);
    if (result.error || !result.value) {
      setError(describeApiError(result.error, 'Unable to load plan details. Please try again. / Không thể tải chi tiết kế hoạch. Vui lòng thử lại.'));
      return null;
    }
    setError(null);
    return result.value;
  }

  return { fetchPlan, loading, error };
}
