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
      setError('Unable to send magic link. Please try again. / Khong the gui magic link. Vui long thu lai.');
      setSuccess(null);
      return false;
    }
    setError(null);
    setSuccess(
      result.value.expiresAt
        ? `Magic link sent. Expires ${result.value.expiresAt}. / Da gui magic link. Het han luc ${result.value.expiresAt}.`
        : 'Magic link sent. / Da gui magic link.',
    );
    return true;
  }

  return { send, loading, error, success, setError, setSuccess };
}
