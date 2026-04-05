import { renderHook, act } from '../src/test-utils/renderHook';
import { SessionProvider, useSession } from '../src/session/sessionStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');
jest.mock('../src/api/authHeaders', () => ({
  setAuthToken: jest.fn(),
}));

describe('SessionProvider', () => {
  beforeEach(() => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('loads token from secure storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('persisted');
    const wrapper = ({ children }: { children: React.ReactNode }) => <SessionProvider>{children}</SessionProvider>;
    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.session.token).toBe('persisted');
    expect(result.current.hydrated).toBe(true);
  });

  it('updates token and persists', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <SessionProvider>{children}</SessionProvider>;
    const { result } = renderHook(() => useSession(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.setToken('new-token');
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('session_token', 'new-token');
    expect(result.current.session.token).toBe('new-token');
  });
});
