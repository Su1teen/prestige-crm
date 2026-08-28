export interface LiveConversation {
  id: number;
  chatId: string | null;
  number: string | null;
  contactName: string;
  aiEnabled: boolean;
  lastMessagePreview: string | null;
  lastMessageId: number | null;
  lastMessageTimeRaw: string | null;
  lastMessageAt: string | null;
}

export interface LiveConversationMessage {
  id: number;
  chatId: string | null;
  senderName: string;
  senderType: "ai" | "contact";
  direction: "outbound" | "inbound";
  text: string;
  timeRaw: string | null;
  sentAt: string | null;
}

export interface LiveConversationDetail {
  conversation: {
    id: number;
    chatId: string | null;
    number: string | null;
    contactName: string;
    aiEnabled: boolean;
    aiResumedAt: string | null;
  };
  messages: LiveConversationMessage[];
}

interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface ConversationListResponse {
  items: LiveConversation[];
  nextCursor: string | null;
}

interface AiUpdateResponse {
  id: number;
  chatId: string | null;
  aiEnabled: boolean;
  aiResumedAt: string | null;
}

const LIVE_EMAILS = new Set(["info@paterhaus.com", "r_tszi@paterhaus.com"]);

let accessToken: string | null = null;
let accessTokenEmail: string | null = null;
let accessTokenExpiresAt = 0;

export const normalizePaterhausEmail = (email: string): string => email.trim().toLowerCase();

export const isLivePaterhausConversationsEmail = (email: string | null | undefined): boolean =>
  typeof email === "string" && LIVE_EMAILS.has(normalizePaterhausEmail(email));

const apiBaseUrl = (): string => {
  const value = import.meta.env.VITE_PATERHAUS_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new Error("Live conversations are not configured.");
  return value;
};

const clearAccessToken = () => {
  accessToken = null;
  accessTokenEmail = null;
  accessTokenExpiresAt = 0;
};

const getAccessToken = async (email: string, signal?: AbortSignal): Promise<string> => {
  const normalizedEmail = normalizePaterhausEmail(email);
  if (
    accessToken &&
    accessTokenEmail === normalizedEmail &&
    Date.now() < accessTokenExpiresAt - 5_000
  ) {
    return accessToken;
  }

  const response = await fetch(`${apiBaseUrl()}/api/paterhaus/conversations/access-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail }),
    signal,
  });
  if (!response.ok) throw new Error("Live conversation access is unavailable.");

  const body = (await response.json()) as AccessTokenResponse;
  if (!body.accessToken || !Number.isFinite(body.expiresIn)) {
    throw new Error("Live conversation access is unavailable.");
  }

  accessToken = body.accessToken;
  accessTokenEmail = normalizedEmail;
  accessTokenExpiresAt = Date.now() + body.expiresIn * 1_000;
  return body.accessToken;
};

const authorizedRequest = async <Response>(
  email: string,
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> => {
  const token = await getAccessToken(email, init.signal ?? undefined);
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && retry) {
    clearAccessToken();
    return authorizedRequest<Response>(email, path, init, false);
  }
  if (!response.ok) throw new Error("Live conversations could not be loaded.");
  return response.json() as Promise<Response>;
};

export const fetchLiveConversations = (
  email: string,
  signal?: AbortSignal,
): Promise<ConversationListResponse> =>
  authorizedRequest(email, "/api/paterhaus/conversations?limit=100", { signal });

export const fetchLiveConversationMessages = (
  email: string,
  conversationId: number,
  signal?: AbortSignal,
): Promise<LiveConversationDetail> =>
  authorizedRequest(email, `/api/paterhaus/conversations/${conversationId}/messages`, { signal });

export const updateLiveConversationAi = (
  email: string,
  conversationId: number,
  aiEnabled: boolean,
): Promise<AiUpdateResponse> =>
  authorizedRequest(email, `/api/paterhaus/conversations/${conversationId}/ai`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aiEnabled }),
  });

export const resetPaterhausConversationAccess = (): void => clearAccessToken();
