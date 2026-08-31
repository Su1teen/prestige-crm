import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLiveConversationCapabilities,
  fetchLiveConversations,
  fetchLiveLeadClassifications,
  isLivePaterhausConversationsEmail,
  LiveConversationsError,
  resetPaterhausConversationAccess,
  sendLiveConversationMessage,
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

  it("reads deployment capabilities", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token", expiresIn: 900 }))
      .mockResolvedValueOnce(
        jsonResponse({ manualMessages: true, attachments: false, maxMessageLength: 4096 }),
      );

    await expect(fetchLiveConversationCapabilities("info@paterhaus.com")).resolves.toEqual({
      manualMessages: true,
      attachments: false,
      maxMessageLength: 4096,
    });
  });

  it("posts manual replies with the idempotency key and message text", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token", expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({ message: { id: 9 } }, 201));

    await sendLiveConversationMessage("info@paterhaus.com", 6, "Manual reply", "idem-key-1234");

    const [url, init] = fetchMock.mock.calls[1] ?? [];
    expect(url).toBe("https://api.example.com/api/paterhaus/conversations/6/messages");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Idempotency-Key": "idem-key-1234", Authorization: "Bearer token" },
      body: JSON.stringify({ text: "Manual reply" }),
    });
  });

  it("preserves the response status on failures", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token", expiresIn: 900 }))
      .mockResolvedValueOnce(jsonResponse({ message: "AI is still active" }, 409));

    const error = await sendLiveConversationMessage(
      "info@paterhaus.com",
      6,
      "Manual reply",
      "idem-key-1234",
    ).catch((rejection: unknown) => rejection);

    expect(error).toBeInstanceOf(LiveConversationsError);
    expect((error as LiveConversationsError).status).toBe(409);
  });

  it("requests lead classifications from the protected endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ accessToken: "token", expiresIn: 900 }))
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ id: 1 }], nextCursor: null, supportsArchive: false }),
      );

    const response = await fetchLiveLeadClassifications("info@paterhaus.com");

    expect(response.items).toHaveLength(1);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.example.com/api/paterhaus/lead-classifications?limit=100",
    );
  });
});
