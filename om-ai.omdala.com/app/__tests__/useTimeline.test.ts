import { renderHook, act } from '../src/test-utils/renderHook';
import { useTimeline } from '../src/hooks/useTimeline';

jest.mock('../src/api/reality', () => ({
  listRuns: jest.fn(),
  getProof: jest.fn(),
}));

const reality = require('../src/api/reality');

describe('useTimeline', () => {
  beforeEach(() => {
    reality.listRuns.mockResolvedValue({
      value: [
        { run_id: 'run_1', source: 'scene', source_id: 'scene_sleep', actor_id: 'user', status: 'succeeded', proof_id: 'proof_1', created_at: 'now' },
      ],
      error: null,
    });
    reality.getProof.mockResolvedValue({
      value: { proofId: 'proof_1', runId: 'run_1', actorId: 'user', requestedState: {}, actualState: {}, confidenceScore: 1, verifiedAt: 'now' },
      error: null,
    });
  });

  it('loads timeline entries', async () => {
    const { result } = renderHook(() => useTimeline());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].proof?.proofId).toBe('proof_1');
  });
});
