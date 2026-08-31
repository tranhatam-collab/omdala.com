import { useCallback, useEffect, useState } from 'react';
import { listScenes, runScene, type SceneRunRecord } from '../api/reality';
import type { SceneRecord } from '../../../shared/api-contracts';

export function useScenes() {
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listScenes();
    if (result.error || !result.value) {
      setError('Unable to load scenes. Please try again. / Khong the tai scenes. Vui long thu lai.');
    } else {
      setScenes(result.value);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      const result = await listScenes();
      if (!mounted) return;
      if (result.error || !result.value) {
        setError('Unable to load scenes. Please try again. / Khong the tai scenes. Vui long thu lai.');
      } else {
        setScenes(result.value);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function run(sceneId: string): Promise<SceneRunRecord | null> {
    const result = await runScene(sceneId);
    if (result.error || !result.value) {
      setError('Scene run failed. Please try again. / Chay scene that bai. Vui long thu lai.');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { scenes, loading, error, run, retry: load };
}
