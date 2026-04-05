import { useEffect, useState } from 'react';
import { listDevices } from '../api/reality';
import type { DeviceRecord } from '../../shared/api-contracts';

export function useDevices() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      const result = await listDevices();
      if (!mounted) return;
      if (result.error || !result.value) {
        setError('Unable to load devices. Please try again. / Khong the tai danh sach thiet bi. Vui long thu lai.');
        setLoading(false);
        return;
      }
      setDevices(result.value);
      setError(null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { devices, loading, error };
}
