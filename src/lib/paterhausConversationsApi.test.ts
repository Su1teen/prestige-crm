import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLiveConversations,
  isLivePaterhausConversationsEmail,
  resetPaterhausConversationAccess,
} from "./paterhausConversationsApi";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("Paterhaus conversations API client", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PATERHAUS_API_BASE_URL", "https://api.example.com/");
    resetPaterhausConversationAccess();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("activates live mode for exactly the two normalized allowed emails", () => {
    expect(isLivePaterhausConversationsEmail(" INFO@PATERHAUS.COM ")).toBe(true);
    expect(isLivePaterhausConversationsEmail("r_tszi@paterhaus.com")).toBe(true);
    expect(isLivePaterhausConversationsEmail("nfo@paterhaus.com")).toBe(false);
    expect(isLivePaterhausConversationsEmail("guest@example.com")).toBe(false);
    expect(isLivePaterhausConversationsEmail(null)).toBe(false);
  });

  it("keeps the access token in memory without using browser storage", async () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");
    const sessionStorageSpy = vi.spyOn(window.sessionStorage, "setItem");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token", expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({ items: [], nextCursor: null }));

    await fetchLiveConversations("info@paterhaus.com");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorageSpy).not.toHaveBeenCalled();
    expect(sessionStorageSpy).not.toHaveBeenCalled();
  });

  it("requests one fresh token and retries once after a 401", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token-1", expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token-2", expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({ items: [], nextCursor: null }));

    await fetchLiveConversations("info@paterhaus.com");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
      headers: { Authorization: "Bearer token-2" },
    });
  });
});
