import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Phone, RefreshCw, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchLiveConversationCapabilities,
  fetchLiveConversationMessages,
  fetchLiveConversations,
  sendLiveConversationMessage,
  updateLiveConversationAi,
  type LiveConversation,
  type LiveConversationCapabilities,
  type LiveConversationDetail,
  type LiveConversationMessage,
} from "@/lib/paterhausConversationsApi";

interface LiveConversationsModuleProps {
  email: string;
}

const formatTimestamp = (sentAt: string | null, timeRaw: string | null): string => {
  if (!sentAt) return timeRaw ?? "Time unavailable";
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return timeRaw ?? "Time unavailable";

  const hasCleanMilliseconds = /\.\d{3}$/.test(timeRaw ?? "");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...(hasCleanMilliseconds ? { fractionalSecondDigits: 3 as const } : {}),
  }).format(date);
};

const identity = (conversation: LiveConversation): string =>
  conversation.number ?? conversation.chatId ?? `Conversation ${conversation.id}`;

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MessageBubble = ({ message }: { message: LiveConversationMessage }) => (
  <div
    data-testid={`live-message-${message.id}`}
    className={`max-w-[82%] rounded-xl border p-3 ${
      message.direction === "outbound"
        ? "ml-auto border-sky-500/30 bg-sky-500/10"
        : "mr-auto border-border bg-card"
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs font-medium text-foreground">
        {message.senderName}
        {message.senderType === "ai" && (
          <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">
            AI response
          </span>
        )}
        {message.senderType === "human" && (
          <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
            Manager reply
          </span>
        )}
      </p>
      <time className="text-[10px] text-muted-foreground">
        {formatTimestamp(message.sentAt, message.timeRaw)}
      </time>
    </div>
    <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-foreground">
      {message.text}
    </p>
  </div>
);

export const LiveConversationsModule = ({ email }: LiveConversationsModuleProps) => {
  const [conversations, setConversations] = useState<LiveConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LiveConversationDetail | null>(null);
  const [query, setQuery] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiUpdating, setAiUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<LiveConversationCapabilities | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const listRequestActive = useRef(false);
  const listRequestId = useRef(0);
  const selectedIdRef = useRef<number | null>(null);

  selectedIdRef.current = selectedId;

  const loadConversations = useCallback(
    async (signal?: AbortSignal) => {
      if (listRequestActive.current) return;
      listRequestActive.current = true;
      const requestId = ++listRequestId.current;
      try {
        const response = await fetchLiveConversations(email, signal);
        if (requestId !== listRequestId.current) return;
        setConversations(response.items);
        setSelectedId((current) => {
          if (current && response.items.some((item) => item.id === current)) return current;
          return response.items[0]?.id ?? null;
        });
        setError(null);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (requestId === listRequestId.current) {
          setError("Live conversations are temporarily unavailable.");
        }
      } finally {
        if (requestId === listRequestId.current) {
          listRequestActive.current = false;
          setListLoading(false);
        }
      }
    },
    [email],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadConversations(controller.signal);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadConversations(controller.signal);
    }, 10_000);

    return () => {
      controller.abort();
      window.clearInterval(poll);
      listRequestId.current += 1;
      listRequestActive.current = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    let requestActive = false;

    const refresh = async () => {
      if (requestActive) return;
      requestActive = true;
      setDetailLoading(true);
      try {
        const response = await fetchLiveConversationMessages(
          email,
          selectedId,
          controller.signal,
        );
        if (selectedIdRef.current === selectedId) {
          setDetail(response);
          setDetailError(null);
        }
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (selectedIdRef.current === selectedId) {
          setDetailError("Live conversation history is temporarily unavailable.");
        }
      } finally {
        requestActive = false;
        if (selectedIdRef.current === selectedId) setDetailLoading(false);
      }
    };

    void refresh();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10_000);

    return () => {
      controller.abort();
      window.clearInterval(poll);
    };
  }, [email, selectedId, detailReloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveConversationCapabilities(email, controller.signal)
      .then((response) => setCapabilities(response))
      .catch(() => setCapabilities(null));

    return () => controller.abort();
  }, [email]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.contactName} ${conversation.number ?? ""} ${conversation.chatId ?? ""} ${
        conversation.lastMessagePreview ?? ""
      }`
        .toLowerCase()
        .includes(normalized),
    );
  }, [conversations, query]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const selectConversation = (conversationId: number) => {
    setSelectedId(conversationId);
    setMobileDetail(true);
    setDraft("");
    setSendError(null);
  };

  const maxMessageLength = capabilities?.maxMessageLength ?? 4096;
  const composerVisible = Boolean(selected && !selected.aiEnabled && capabilities?.manualMessages);
  const manualRepliesUnavailable = Boolean(
    selected && !selected.aiEnabled && capabilities && !capabilities.manualMessages,
  );

  const sendReply = async () => {
    const text = draft.trim();
    if (!selected || !composerVisible || sending || text.length === 0) return;

    setSending(true);
    setSendError(null);
    try {
      const { message } = await sendLiveConversationMessage(
        email,
        selected.id,
        text,
        crypto.randomUUID(),
      );
      setDraft("");
      setDetail((current) =>
        current && current.conversation.id === selected.id
          ? {
              ...current,
              messages: current.messages.some((existing) => existing.id === message.id)
                ? current.messages
                : [...current.messages, message],
            }
          : current,
      );
      toast.success("Reply sent");
    } catch {
      setSendError("The reply could not be delivered. Your text was kept.");
      toast.error("Reply not delivered");
    } finally {
      setSending(false);
    }
  };

  const toggleAi = async () => {
    if (!selected || aiUpdating) return;
    const nextEnabled = !selected.aiEnabled;
    setAiUpdating(true);
    try {
      const updated = await updateLiveConversationAi(email, selected.id, nextEnabled);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selected.id
            ? { ...conversation, aiEnabled: updated.aiEnabled }
            : conversation,
        ),
      );
      setDetail((current) =>
        current && current.conversation.id === selected.id
          ? {
              ...current,
              conversation: {
                ...current.conversation,
                aiEnabled: updated.aiEnabled,
                aiResumedAt: updated.aiResumedAt,
              },
            }
          : current,
      );
      setError(null);
      toast.success(updated.aiEnabled ? "AI resumed" : "Human takeover enabled");
    } catch {
      setError("The AI state could not be updated. Please try again.");
      toast.error("AI state update failed");
    } finally {
      setAiUpdating(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Live WhatsApp inbox
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Conversations</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void loadConversations()}
          disabled={listRequestActive.current}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid h-[calc(100vh-8.25rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-border bg-card/70 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className={`${mobileDetail ? "hidden" : "flex"} min-h-0 min-w-0 flex-col border-r border-border xl:flex`}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations"
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading && conversations.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  className={`w-full border-b border-border/70 border-l-4 p-3 text-left transition-colors ${
                    selectedId === conversation.id
                      ? "border-l-primary bg-primary/10"
                      : "border-l-transparent hover:bg-secondary/35"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {initials(conversation.contactName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {conversation.contactName}
                        </p>
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {formatTimestamp(
                            conversation.lastMessageAt,
                            conversation.lastMessageTimeRaw,
                          )}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {identity(conversation)}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {conversation.lastMessagePreview ?? "No messages yet"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-2 text-[10px] ${
                          conversation.aiEnabled
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-amber-500/40 text-amber-300"
                        }`}
                      >
                        {conversation.aiEnabled ? "AI active" : "Human takeover"}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : error ? (
              <div className="space-y-3 p-6 text-center text-sm text-destructive">
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadConversations()}
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {conversations.length === 0 ? "No live conversations yet" : "No matching conversations"}
              </div>
            )}
          </div>
        </section>

        <section className={`${mobileDetail ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-background/20 xl:flex`}>
          {selected ? (
            <>
              <div className="border-b border-border p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-2 xl:hidden"
                  onClick={() => setMobileDetail(false)}
                >
                  <ArrowLeft className="h-4 w-4" /> Back to list
                </Button>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{selected.contactName}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {identity(selected)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={selected.aiEnabled ? "destructive" : "default"}
                    size="sm"
                    onClick={() => void toggleAi()}
                    disabled={aiUpdating}
                  >
                    {aiUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {selected.aiEnabled ? "Take over AI" : "Resume AI"}
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {selected.aiEnabled ? "AI active" : "Human takeover"}
                  </Badge>
                  {selected.number && (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a
                        href={`https://wa.me/${selected.number.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Phone className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/25 p-4">
                {detailLoading && !detail ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : detailError && !detail ? (
                  <div
                    role="alert"
                    className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-destructive"
                  >
                    <p>{detailError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailReloadKey((current) => current + 1)}
                    >
                      <RefreshCw className="h-4 w-4" /> Retry
                    </Button>
                  </div>
                ) : detail?.messages.length ? (
                  detail.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No messages in this conversation
                  </div>
                )}
              </div>

              {composerVisible && (
                <div className="border-t border-border bg-card px-4 py-3" data-testid="live-composer">
                  {sendError && (
                    <p role="alert" className="mb-2 text-xs text-destructive">
                      {sendError}
                    </p>
                  )}
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value.slice(0, maxMessageLength))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendReply();
                        }
                      }}
                      placeholder="Write a reply as a manager"
                      aria-label="Reply message"
                      rows={2}
                      className="min-h-[44px] flex-1 resize-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void sendReply()}
                      disabled={sending || draft.trim().length === 0}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              )}

              {manualRepliesUnavailable && (
                <div className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                  Manual replies are not configured for this deployment yet.
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8" />
              <p>Select a conversation to view its live history.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
