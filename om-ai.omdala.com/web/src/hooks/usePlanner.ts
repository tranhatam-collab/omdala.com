import { useState } from 'react';
import { planTransition } from '../api/reality';

export function usePlanner() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function plan(rawInput: string) {
    setLoading(true);
    const result = await planTransition(rawInput);
    setLoading(false);

    if (result.error || !result.value) {
      setError('Unable to create a plan right now. Please try again. / Hien tai chua tao duoc ke hoach. Vui long thu lai.');
      return null;
    }

    setError(null);
    return result.value;
  }

  return { plan, loading, error };
}
