import { renderHook, act } from '../src/test-utils/renderHook';
import { SessionProvider, useSession } from '../src/session/sessionStore';

describe('SessionProvider', () => {
  it('fails closed while the canonical native session bridge is unavailable', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <SessionProvider>{children}</SessionProvider>;
    const { result, unmount } = renderHook(() => useSession(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.session.authenticated).toBe(false);
    expect(result.current.session.status).toBe('canonical_session_bridge_unavailable');
    expect(result.current.hydrated).toBe(true);
    unmount();
  });

  it('does not manufacture an authenticated state after logout', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <SessionProvider>{children}</SessionProvider>;
    const { result, unmount } = renderHook(() => useSession(), { wrapper });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.session.authenticated).toBe(false);
    expect(result.current.session.status).toBe('canonical_session_bridge_unavailable');
    unmount();
  });
});
