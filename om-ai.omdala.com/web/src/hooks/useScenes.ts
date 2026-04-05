import { useEffect, useState } from 'react';
import { listScenes, runScene as runSceneRequest } from '../api/reality';
import type { SceneRecord } from '../../shared/api-contracts';

export function useScenes() {
  const [scenes, setScenes] = useState<SceneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
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

  async function runScene(sceneId: string) {
    const result = await runSceneRequest(sceneId);
    if (result.error || !result.value) {
      setError('Unable to run this scene. Please try again. / Khong the chay scene nay. Vui long thu lai.');
      return null;
    }
    setError(null);
    return result.value;
  }

  return { scenes, runScene, loading, error };
}
