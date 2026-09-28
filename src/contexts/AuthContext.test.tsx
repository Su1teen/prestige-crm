import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AuthProvider, AUTH_USER_STORAGE_KEY, useAuth } from "./AuthContext";
import { getPaterhausSession, setPaterhausSession } from "@/lib/paterhausConversationsApi";

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  vi.stubEnv("VITE_PATERHAUS_API_BASE_URL", "https://api.example.com");
  localStorage.clear();
  setPaterhausSession(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  setPaterhausSession(null);
});

describe("Paterhaus authentication", () => {
  it("rejects the former browser-side passwords when backend denies login", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 401 }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      expect(await result.current.login("info@paterhaus.com", "any-password")).toBeNull();
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/api/paterhaus/auth/login");
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
  });

  it("stores only a server-issued session and restores the verified role after refresh", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: "server-token", user: { email: "info@paterhaus.com", role: "ADMIN" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ email: "info@paterhaus.com", role: "ADMIN" }), { status: 200 }));
    const first = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await first.result.current.login("info@paterhaus.com", "private-password"); });
    expect(first.result.current.user?.role).toBe("admin");
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
    expect(getPaterhausSession()).toBe("server-token");
    first.unmount();
    const restored = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(restored.result.current.authReady).toBe(true));
    expect(restored.result.current.user?.email).toBe("info@paterhaus.com");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.example.com/api/paterhaus/auth/me");
    act(() => restored.result.current.logout());
    expect(getPaterhausSession()).toBeNull();
  });

  it("does not restore a forged Paterhaus user from localStorage", () => {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify({ email: "info@paterhaus.com", role: "admin", workspace: "paterhaus" }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });
});
