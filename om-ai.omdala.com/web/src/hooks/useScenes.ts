import { useEffect, useState } from 'react';
import { describeApiError } from '../api/liveErrors';
import { listScenes, runScene as runSceneRequest } from '../api/reality';
import type { SceneRecord } from '../../../shared/api-contracts';

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
        setError(describeApiError(result.error, 'Unable to load scenes. Please try again. / Không thể tải scenes. Vui lòng thử lại.'));
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
      setError(describeApiError(result.error, 'Unable to run this scene. Please try again. / Không thể chạy scene này. Vui lòng thử lại.'));
      return null;
    }
    setError(null);
    return result.value;
  }

  return { scenes, runScene, loading, error };
}
