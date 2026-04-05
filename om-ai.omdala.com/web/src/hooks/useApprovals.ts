import { useState } from 'react';
import { createApproval, getApproval } from '../api/reality';

export function useApprovals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestApproval(runId: string) {
    setLoading(true);
    const result = await createApproval(runId);
    setLoading(false);
    if (result.error || !result.value) {
      setError(result.error ?? 'request_failed');
      return null;
    }
    setError(null);
    return result.value;
  }

  async function fetchApproval(approvalId: string) {
    setLoading(true);
    const result = await getApproval(approvalId);
    setLoading(false);
    if (result.error || !result.value) {
      setError(result.error ?? 'request_failed');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { requestApproval, fetchApproval, loading, error };
}
