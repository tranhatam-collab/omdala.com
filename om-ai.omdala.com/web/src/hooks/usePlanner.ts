import { useState } from 'react';
import { describeApiError } from '../api/liveErrors';
import { planTransition } from '../api/reality';

export function usePlanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function plan(rawInput: string) {
    setLoading(true);
    const result = await planTransition(rawInput);
    setLoading(false);

    if (result.error || !result.value) {
      setError(describeApiError(result.error, 'Unable to create a plan right now. Please try again. / Hiện tại chưa tạo được kế hoạch. Vui lòng thử lại.'));
      return null;
    }

    setError(null);
    return result.value;
  }

  return { plan, loading, error };
}
