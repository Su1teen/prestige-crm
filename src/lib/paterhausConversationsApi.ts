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

/** `pater_classification.lead_type`: the PROPERTY type of the lead, never the contact's role. */
export const LEAD_PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Studio", "Other"] as const;
export type LeadPropertyType = (typeof LEAD_PROPERTY_TYPES)[number];

/** `pater_classification.work_type`: the requested Paterhaus service. */
export const LEAD_SERVICES = ["Staging", "Snagging", "Property Management"] as const;
export type LeadService = (typeof LEAD_SERVICES)[number];

export interface LiveLeadClassification {
  id: number;
  chatId: string | null;
  number: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
  displayName: string;
  summary: string | null;
  /** Property type (Apartment, Villa, Townhouse, Studio, Other). */
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

export interface ManualLeadInput {
  name: string | null;
  phoneNumber: string;
  email: string | null;
  /** Free-text property type; stored in `pater_classification.lead_type`. */
  propertyType: string;
  service: LeadService;
}

export type CalendarEventKind = "operation" | "booking" | "blocked" | "risk" | "occupied";

export interface LiveCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  /** Asia/Dubai calendar day, YYYY-MM-DD. */
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  kind: CalendarEventKind;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveCalendarEventInput {
  title: string;
  description?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  kind?: CalendarEventKind;
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
/** Accounts that may create leads manually; the backend enforces the same list. */
const MANUAL_LEAD_EMAILS = new Set(["info@paterhaus.com", "r_tszi@paterhaus.com"]);
/** The reduced workspace: Owner Pipeline, Marketing, Conversations, Calendar only. */
const FOCUSED_WORKSPACE_EMAILS = new Set(["r_tszi@paterhaus.com"]);

let accessToken: string | null = null;
let accessTokenEmail: string | null = null;
let accessTokenExpiresAt = 0;

export const normalizePaterhausEmail = (email: string): string => email.trim().toLowerCase();

export const isLivePaterhausConversationsEmail = (email: string | null | undefined): boolean =>
  typeof email === "string" && LIVE_EMAILS.has(normalizePaterhausEmail(email));

export const canCreateManualPaterhausLead = (email: string | null | undefined): boolean =>
  typeof email === "string" && MANUAL_LEAD_EMAILS.has(normalizePaterhausEmail(email));

export const isFocusedPaterhausWorkspaceEmail = (email: string | null | undefined): boolean =>
  typeof email === "string" && FOCUSED_WORKSPACE_EMAILS.has(normalizePaterhausEmail(email));

/**
 * Digits only: strips spaces, hyphens, dots, parentheses and a leading `+`.
 * Never prepends a country code. Returns null when not a plausible number.
 */
export const normalizeManualLeadPhone = (input: string): string | null => {
  const stripped = input.trim().replace(/^\+/, "").replace(/[\s\-().]/g, "");
  return /^\d{7,15}$/.test(stripped) ? stripped : null;
};

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
      (await readErrorMessage(response)) ?? "Live conversations could not be loaded.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as Response;
  return response.json() as Promise<Response>;
};

/** Surfaces backend validation/authorization messages (400/403); other errors stay generic. */
const readErrorMessage = async (response: globalThis.Response): Promise<string | null> => {
  if (response.status !== 400 && response.status !== 403) return null;
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" && body.message.trim() ? body.message : null;
  } catch {
    return null;
  }
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

export const createManualLead = (
  email: string,
  input: ManualLeadInput,
): Promise<LiveLeadClassification> =>
  authorizedRequest(email, "/api/paterhaus/leads/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const fetchLiveCalendarEvents = (
  email: string,
  range?: { from: string; to: string },
  signal?: AbortSignal,
): Promise<{ items: LiveCalendarEvent[]; timeZone: string }> => {
  const query = range ? `?from=${range.from}&to=${range.to}` : "";
  return authorizedRequest(email, `/api/paterhaus/calendar/events${query}`, { signal });
};

export const createLiveCalendarEvent = (
  email: string,
  input: LiveCalendarEventInput,
): Promise<LiveCalendarEvent> =>
  authorizedRequest(email, "/api/paterhaus/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const deleteLiveCalendarEvent = (email: string, eventId: string): Promise<void> =>
  authorizedRequest(email, `/api/paterhaus/calendar/events/${eventId}`, { method: "DELETE" });

export const resetPaterhausConversationAccess = (): void => clearAccessToken();
