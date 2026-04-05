import { useEffect, useState } from 'react';
import { listScenes, runScene, type SceneRunRecord } from '../api/reality';
import type { SceneRecord } from '../../../shared/api-contracts';

export function useScenes() {
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const result = await listScenes();
      if (!mounted) return;
      if (result.error || !result.value) {
        setError(result.error ?? 'request_failed');
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
      setError(result.error ?? 'request_failed');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { scenes, loading, error, run };
}
