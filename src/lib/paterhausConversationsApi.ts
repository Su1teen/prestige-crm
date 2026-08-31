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
  senderType: "ai" | "human" | "contact";
  direction: "outbound" | "inbound";
  text: string;
  timeRaw: string | null;
  sentAt: string | null;
}

export interface LiveConversationCapabilities {
  manualMessages: boolean;
  attachments: boolean;
  maxMessageLength: number;
}

export interface LiveLeadClassification {
  id: number;
  chatId: string | null;
  number: string | null;
  username: string | null;
  name: string | null;
  displayName: string;
  summary: string | null;
  leadType: string | null;
  stage: string | null;
  priority: string | null;
  workType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean | null;
}

export interface LiveLeadClassificationsResponse {
  items: LiveLeadClassification[];
  nextCursor: string | null;
  supportsArchive: boolean;
}

/** Carries the HTTP status so callers can separate "not configured" from real failures. */
export class LiveConversationsError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "LiveConversationsError";
  }
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
  if (!value) {
    throw new LiveConversationsError(
      "Live conversations are not configured for this deployment.",
    );
  }
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
  if (!response.ok) {
    throw new LiveConversationsError(
      "Live conversation access is unavailable.",
      response.status,
    );
  }

  const body = (await response.json()) as AccessTokenResponse;
  if (!body.accessToken || !Number.isFinite(body.expiresIn)) {
    throw new LiveConversationsError("Live conversation access is unavailable.");
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
  if (!response.ok) {
    throw new LiveConversationsError(
      "Live conversations could not be loaded.",
      response.status,
    );
  }
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

export const fetchLiveConversationCapabilities = (
  email: string,
  signal?: AbortSignal,
): Promise<LiveConversationCapabilities> =>
  authorizedRequest(email, "/api/paterhaus/conversations/capabilities", { signal });

export const sendLiveConversationMessage = (
  email: string,
  conversationId: number,
  text: string,
  idempotencyKey: string,
): Promise<{ message: LiveConversationMessage }> =>
  authorizedRequest(email, `/api/paterhaus/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ text }),
  });

export const fetchLiveLeadClassifications = (
  email: string,
  signal?: AbortSignal,
): Promise<LiveLeadClassificationsResponse> =>
  authorizedRequest(email, "/api/paterhaus/lead-classifications?limit=100", { signal });

export const resetPaterhausConversationAccess = (): void => clearAccessToken();
