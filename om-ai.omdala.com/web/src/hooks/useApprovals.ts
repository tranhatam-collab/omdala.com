import { useState } from 'react';
import { describeApiError } from '../api/liveErrors';
import { createApproval, getApproval } from '../api/reality';

export function useApprovals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestApproval(runId: string) {
    setLoading(true);
    const result = await createApproval(runId);
    setLoading(false);
    if (result.error || !result.value) {
      setError(describeApiError(result.error, 'Unable to request approval. Please try again. / Không thể gửi yêu cầu phê duyệt. Vui lòng thử lại.'));
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
      setError(describeApiError(result.error, 'Unable to load approval status. Please try again. / Không thể tải trạng thái phê duyệt. Vui lòng thử lại.'));
      return null;
    }
    setError(null);
    return result.value;
  }

  return { requestApproval, fetchApproval, loading, error };
}
