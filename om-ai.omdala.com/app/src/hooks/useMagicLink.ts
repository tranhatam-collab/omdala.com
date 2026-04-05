import { useState } from 'react';
import { requestMagicLink } from '../api/auth';

export function useMagicLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function send(email: string) {
    setLoading(true);
    const result = await requestMagicLink(email);
    setLoading(false);
    if (result.error || !result.value) {
      setError(result.error ?? 'request_failed');
      setSuccess(null);
      return false;
    }
    setError(null);
    setSuccess(result.value.expiresAt ? `Magic link sent. Expires ${result.value.expiresAt}` : 'Magic link sent.');
    return true;
  }

  return { send, loading, error, success, setError, setSuccess };
}
