import { renderHook, act } from '../src/test-utils/renderHook';
import { useScenes } from '../src/hooks/useScenes';

jest.mock('../src/api/reality', () => ({
  listScenes: jest.fn(),
  runScene: jest.fn(),
}));

const reality = require('../src/api/reality');

describe('useScenes', () => {
  beforeEach(() => {
    reality.listScenes.mockResolvedValue({ value: [{ scene_id: 'scene1', display_name: 'Scene 1', safety_class: 'low' }], error: null });
    reality.runScene.mockResolvedValue({ value: { run_id: 'run123', scene_id: 'scene1', status: 'succeeded' }, error: null });
  });

  it('loads scenes and runs scene', async () => {
    const { result } = renderHook(() => useScenes());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.scenes).toHaveLength(1);
    let runResult;
    await act(async () => {
      runResult = await result.current.run('scene1');
    });
    expect(runResult?.status).toBe('succeeded');
  });
});
