/**
 * Smoke tests for auth Zustand store.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it("starts with no token and no user", () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it("setAuth stores token and user", () => {
    useAuthStore.getState().setAuth("abc", { id: "1", email: "a@b.com" });
    const { token, user } = useAuthStore.getState();
    expect(token).toBe("abc");
    expect(user?.email).toBe("a@b.com");
  });

  it("logout clears token and user", () => {
    useAuthStore.getState().setAuth("abc", { id: "1", email: "a@b.com" });
    useAuthStore.getState().logout();
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });
});
