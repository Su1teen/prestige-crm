import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Download,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { leadsApi, type ProductionLead } from "@/lib/paterhausApi";
import {
  archiveLiveConversation,
  createLiveAttachmentDownloadUrl,
  fetchLiveConversationAttachments,
  fetchLiveConversationCapabilities,
  fetchLiveConversationMessages,
  fetchLiveConversations,
  LiveConversationsError,
  sendLiveConversationMessage,
  updateLiveConversationAi,
  type LiveAttachment,
  type LiveAttachmentKind,
  type LiveConversation,
  type LiveConversationCapabilities,
  type LiveConversationDetail,
  type LiveConversationMessage,
  type LiveFile,
} from "@/lib/paterhausConversationsApi";
import { downloadSignedAttachment } from "@/lib/paterhausAttachmentDownload";

interface LiveConversationsModuleProps {
  email: string;
  targetChatId?: string | null;
}

const formatTimestamp = (sentAt: string | null, timeRaw: string | null): string => {
  if (!sentAt) return timeRaw ?? "—";
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return timeRaw ?? "—";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatSize = (size: number | null): string => {
  if (size === null || size === undefined) return "Размер не указан";
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};

const identity = (conversation: LiveConversation): string =>
  conversation.number ?? conversation.chatId ?? `Диалог ${conversation.id}`;

const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

const kindLabel: Record<LiveAttachmentKind, string> = {
  image: "Изображение",
  audio: "Аудиозапись",
  pdf: "PDF документ",
  word: "Word документ",
  spreadsheet: "Таблица",
  text: "Текстовый файл",
  other: "Документ",
};

const attachmentTypeLabel = (fileName: string, kind: LiveAttachmentKind): string => {
  const baseName = fileName.trim().split(/[\\/]/).pop() ?? "";
  const extension = baseName.match(/\.([a-z0-9]{1,10})$/i)?.[1];
  return extension ? extension.toUpperCase() : kindLabel[kind];
};

const AttachmentIcon = ({ kind }: { kind: LiveAttachmentKind }) => {
  const className = "h-5 w-5";
  if (kind === "image") return <FileImage className={className} />;
  if (kind === "audio") return <FileAudio className={className} />;
  if (kind === "spreadsheet") return <FileSpreadsheet className={className} />;
  if (kind === "pdf" || kind === "word" || kind === "text") return <FileText className={className} />;
  return <File className={className} />;
};

const attachmentDownloadError = (error: unknown): string => {
  if (error instanceof LiveConversationsError) {
    if (error.status === 401 || error.status === 403) return "У вас нет прав для скачивания этого файла.";
    if (error.status === 404) return "Вложение больше недоступно.";
    if (error.status === 503) return "Файловое хранилище временно недоступно.";
  }
  return "Не удалось создать ссылку для скачивания.";
};

const AttachmentCard = ({
  attachment,
  downloading,
  onDownload,
}: {
  attachment: LiveAttachment;
  downloading: boolean;
  onDownload: (attachment: LiveAttachment) => void;
}) => (
  <div className="mt-2.5 min-w-0 rounded-lg border border-border bg-card/90 p-3 shadow-sm transition-colors hover:border-primary/40">
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
        <AttachmentIcon kind={attachment.kind} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{attachment.fileName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{attachmentTypeLabel(attachment.fileName, attachment.kind)}</span>
          {attachment.sizeBytes != null && (
            <>
              <span>•</span>
              <span>{formatSize(attachment.sizeBytes)}</span>
            </>
          )}
        </div>
        {attachment.caption && (
          <p className="mt-1 text-xs text-muted-foreground">{attachment.caption}</p>
        )}
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Download"
        className="h-8 gap-1.5 text-xs"
        onClick={() => onDownload(attachment)}
        disabled={downloading}
      >
        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Скачать
      </Button>
    </div>
  </div>
);

const MessageBubble = ({
  message,
  downloadingId,
  onDownload,
}: {
  message: LiveConversationMessage;
  downloadingId: string | null;
  onDownload: (attachment: LiveAttachment) => void;
}) => {
  const attachments = message.attachments ?? [];
  return (
    <div
      data-testid={`live-message-${message.id}`}
      className={`min-w-0 max-w-[92%] rounded-xl border p-3.5 sm:max-w-[82%] shadow-sm ${
        message.direction === "outbound"
          ? "ml-auto border-accent/30 bg-accent/10"
          : "mr-auto border-border bg-card"
      }`}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-semibold text-foreground [overflow-wrap:anywhere]">
          {message.senderName}
          {message.senderType === "ai" && (
            <span className="ml-2 inline-flex rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Ответ AI
            </span>
          )}
          {message.senderType === "human" && (
            <span className="ml-2 inline-flex rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Менеджер
            </span>
          )}
        </p>
        <time className="flex-none text-[10px] text-muted-foreground">
          {formatTimestamp(message.sentAt, message.timeRaw)}
        </time>
      </div>
      {message.text && (
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
          {message.text}
        </p>
      )}
      {attachments.map((attachment) => (
        <AttachmentCard
          key={attachment.id}
          attachment={attachment}
          downloading={downloadingId === attachment.id}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
};

export const LiveConversationsModule = ({ email, targetChatId }: LiveConversationsModuleProps) => {
  const [conversations, setConversations] = useState<LiveConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<LiveConversationDetail | null>(null);
  const [conversationAttachments, setConversationAttachments] = useState<LiveFile[]>([]);
  const [activeTab, setActiveTab] = useState<"messages" | "files">("messages");
  const [fileSearchQuery, setFileSearchQuery] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiUpdating, setAiUpdating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<LiveConversationCapabilities | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [leads, setLeads] = useState<ProductionLead[]>([]);
  const listRequestActive = useRef(false);
  const listRequestId = useRef(0);
  const selectedIdRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  selectedIdRef.current = selectedId;

  // Load CRM leads for potential deal amounts without requiring TanStack QueryContext in tests
  useEffect(() => {
    let active = true;
    try {
      leadsApi.list(1, false).then((res) => {
        if (active && res?.data) setLeads(res.data);
      }).catch(() => {});
    } catch {
      // Ignored in test environment
    }
    return () => {
      active = false;
    };
  }, []);

  const loadConversations = useCallback(async (signal?: AbortSignal) => {
    if (listRequestActive.current) return;
    listRequestActive.current = true;
    const requestId = ++listRequestId.current;
    try {
      const response = await fetchLiveConversations(email, signal, showArchived);
      if (requestId !== listRequestId.current) return;
      setConversations(response.items);
      setSelectedId((current) =>
        current && response.items.some((item) => item.id === current)
          ? current
          : response.items[0]?.id ?? null,
      );
      setListError(null);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      if (requestId === listRequestId.current) setListError("Диалоги временно недоступны.");
    } finally {
      if (requestId === listRequestId.current) {
        listRequestActive.current = false;
        setListLoading(false);
      }
    }
  }, [email, showArchived]);

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

  // Navigate to specific chat from Pipeline or custom event
  const selectMatchingChat = useCallback((target: string | null | undefined, name?: string) => {
    if (!target && !name) return;
    const targetDigits = (target ?? "").replace(/\D/g, "");
    const match = conversations.find((c) =>
      (target && (c.chatId === target || c.number === target)) ||
      (targetDigits.length >= 7 && (c.number?.replace(/\D/g, "").includes(targetDigits) || targetDigits.includes(c.number?.replace(/\D/g, "") || "---"))) ||
      (name && c.contactName.toLowerCase().includes(name.toLowerCase()))
    );
    if (match) {
      setSelectedId(match.id);
      setActiveTab("messages");
      setMobileDetail(true);
    }
  }, [conversations]);

  useEffect(() => {
    if (targetChatId) {
      selectMatchingChat(targetChatId);
    }
  }, [targetChatId, selectMatchingChat]);

  useEffect(() => {
    const handleOpenChatEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ chatId?: string; number?: string; name?: string }>;
      const target = customEvent.detail?.chatId ?? customEvent.detail?.number;
      selectMatchingChat(target, customEvent.detail?.name);
    };
    window.addEventListener("paterhaus:open-chat", handleOpenChatEvent);
    return () => window.removeEventListener("paterhaus:open-chat", handleOpenChatEvent);
  }, [selectMatchingChat]);

  // Load message history AND conversation attachments concurrently
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setConversationAttachments([]);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    setConversationAttachments([]);
    let requestActive = false;

    const refresh = async () => {
      if (requestActive) return;
      requestActive = true;
      setDetailLoading(true);
      try {
        const [messagesResult, attachmentsResult] = await Promise.allSettled([
          fetchLiveConversationMessages(email, selectedId, controller.signal),
          fetchLiveConversationAttachments(email, selectedId, controller.signal).catch(() => ({ items: [] as LiveFile[] })),
        ]);

        if (selectedIdRef.current === selectedId) {
          if (messagesResult.status === "fulfilled") {
            setDetail(messagesResult.value);
            setDetailError(null);
          } else {
            const err = messagesResult.reason;
            if (!(err instanceof DOMException && err.name === "AbortError")) {
              setDetailError("История сообщений временно недоступна.");
            }
          }

          // Combine attachments from fetchLiveConversationAttachments and message attachments
          const fromApi: LiveFile[] = attachmentsResult.status === "fulfilled" ? (attachmentsResult.value?.items ?? []) : [];
          const fromDetail = messagesResult.status === "fulfilled"
            ? ((messagesResult.value.attachments as LiveFile[] | undefined) ?? messagesResult.value.messages.flatMap((m) => m.attachments as LiveFile[]))
            : [];

          const seen = new Set<string>();
          const merged: LiveFile[] = [];

          for (const item of [...fromApi, ...fromDetail]) {
            if (item && item.id && !seen.has(String(item.id))) {
              seen.add(String(item.id));
              merged.push(item);
            }
          }

          setConversationAttachments(merged);
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
    fetchLiveConversationCapabilities(email, controller.signal).then(setCapabilities).catch(() => setCapabilities(null));
    return () => controller.abort();
  }, [email]);

  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView?.({ block: "end" });
    }
  }, [detail?.messages.length, selectedId, activeTab]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.contactName} ${conversation.number ?? ""} ${conversation.chatId ?? ""} ${conversation.lastMessagePreview ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [conversations, query]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  // Match current conversation with CRM lead to display deal amount
  const matchedLead = useMemo(() => {
    if (!selected || leads.length === 0) return null;
    const selectedDigits = (selected.number ?? selected.chatId ?? "").replace(/\D/g, "");
    return leads.find((lead) => {
      if (lead.externalChatId && (lead.externalChatId === selected.chatId || lead.externalChatId === selected.number)) return true;
      if (selectedDigits.length >= 7 && lead.phone) {
        const leadDigits = lead.phone.replace(/\D/g, "");
        if (leadDigits.length >= 7 && (leadDigits.includes(selectedDigits) || selectedDigits.includes(leadDigits))) return true;
      }
      if (lead.name && selected.contactName && lead.name.toLowerCase() === selected.contactName.toLowerCase()) return true;
      return false;
    }) ?? null;
  }, [selected, leads]);

  const selectConversation = (conversationId: number) => {
    setSelectedId(conversationId);
    setActiveTab("messages");
    setMobileDetail(true);
    setDraft("");
    setSendError(null);
  };

  const maxMessageLength = capabilities?.maxMessageLength ?? 4096;
  const composerVisible = Boolean(selected && !selected.aiEnabled && capabilities?.manualMessages);
  const manualRepliesUnavailable = Boolean(selected && !selected.aiEnabled && capabilities && !capabilities.manualMessages);

  const download = async (attachment: LiveAttachment) => {
    if (downloadingId) return;
    setDownloadingId(attachment.id);
    try {
      const { url } = await createLiveAttachmentDownloadUrl(email, attachment.id);
      downloadSignedAttachment(url);
    } catch (requestError) {
      toast.error(attachmentDownloadError(requestError));
    } finally {
      setDownloadingId(null);
    }
  };

  const sendReply = async () => {
    const text = draft.trim();
    if (!selected || !composerVisible || sending || text.length === 0) return;
    setSending(true);
    setSendError(null);
    try {
      const { message } = await sendLiveConversationMessage(email, selected.id, text, crypto.randomUUID());
      setDraft("");
      setDetail((current) =>
        current && current.conversation.id === selected.id
          ? {
              ...current,
              messages: current.messages.some((item) => item.id === message.id)
                ? current.messages
                : [...current.messages, message],
            }
          : current,
      );
      toast.success("Сообщение отправлено");
    } catch {
      setSendError("Не удалось доставить сообщение. Текст сохранён.");
      toast.error("Ошибка отправки сообщения");
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
        current.map((item) => (item.id === selected.id ? { ...item, aiEnabled: updated.aiEnabled } : item)),
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
      setActionError(null);
      toast.success(updated.aiEnabled ? "AI активирован" : "Включён ручной режим");
    } catch {
      setActionError("Не удалось обновить статус AI. Попробуйте снова.");
      toast.error("Ошибка переключения AI");
    } finally {
      setAiUpdating(false);
    }
  };

  const toggleArchive = async () => {
    if (!selected) return;
    const willArchive = !showArchived;
    try {
      await archiveLiveConversation(email, selected.id, willArchive);
      toast.success(willArchive ? "Чат перемещён в архив" : "Чат восстановлен из архива");
      void loadConversations();
    } catch {
      toast.error("Не удалось изменить статус архива");
    }
  };

  const filteredAttachments = useMemo(() => {
    const q = fileSearchQuery.trim().toLowerCase();
    if (!q) return conversationAttachments;
    return conversationAttachments.filter((file) =>
      `${file.fileName} ${file.caption ?? ""} ${file.summary ?? ""}`.toLowerCase().includes(q),
    );
  }, [conversationAttachments, fileSearchQuery]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex flex-none flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Live WhatsApp inbox</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Диалоги WhatsApp</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void loadConversations()}
          disabled={listRequestActive.current}
        >
          <RefreshCw className="h-4 w-4" /> Обновить
        </Button>
      </div>
      {actionError && (
        <div role="alert" className="mb-3 flex-none rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        {/* Left Column: Conversations List */}
        <section
          className={`${mobileDetail ? "hidden" : "flex"} ${
            listCollapsed ? "lg:hidden" : "lg:flex lg:w-[340px]"
          } min-h-0 min-w-0 flex-1 flex-col border-r border-border lg:flex-none`}
        >
          {/* Active / Archive Toggle Tabs */}
          <div className="flex border-b border-border bg-muted/20">
            <button
              type="button"
              onClick={() => {
                setShowArchived(false);
                setSelectedId(null);
              }}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                !showArchived
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Активные
            </button>
            <button
              type="button"
              onClick={() => {
                setShowArchived(true);
                setSelectedId(null);
              }}
              className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${
                showArchived
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Архив
            </button>
          </div>

          <div className="flex-none border-b border-border bg-card p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск диалогов…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                  className={`w-full min-w-0 border-b border-border/70 border-l-4 p-3 text-left transition-colors ${
                    selectedId === conversation.id
                      ? "border-l-primary bg-primary/10"
                      : "border-l-transparent hover:bg-secondary/55"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {initials(conversation.contactName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium text-foreground">{conversation.contactName}</p>
                        <span className="flex-none text-[10px] text-muted-foreground">
                          {formatTimestamp(conversation.lastMessageAt, conversation.lastMessageTimeRaw)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{identity(conversation)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {conversation.lastMessagePreview ?? "Нет сообщений"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-2 text-[10px] ${
                          conversation.aiEnabled
                            ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {conversation.aiEnabled ? "AI активен" : "Ручной режим"}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            ) : listError ? (
              <div className="space-y-3 p-6 text-center text-sm text-destructive">
                <p>{listError}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void loadConversations()}>
                  <RefreshCw className="h-4 w-4" /> Повторить
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {conversations.length === 0
                  ? showArchived
                    ? "В архиве нет диалогов"
                    : "Пока нет диалогов"
                  : "Диалоги не найдены"}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Chat History, Files & Composer */}
        <section
          className={`${
            mobileDetail ? "flex" : "hidden"
          } min-h-0 min-w-0 flex-1 flex-col bg-background/40 lg:flex`}
        >
          {selected ? (
            <>
              {/* Header */}
              <div className="flex-none border-b border-border bg-card p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-2 lg:hidden"
                  onClick={() => setMobileDetail(false)}
                >
                  <ArrowLeft className="h-4 w-4" /> Назад к списку
                </Button>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hidden h-8 w-8 flex-none lg:inline-flex"
                      aria-label={listCollapsed ? "Expand conversation list" : "Collapse conversation list"}
                      onClick={() => setListCollapsed((value) => !value)}
                    >
                      {listCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground text-base">{selected.contactName}</h3>
                        {/* Potential deal amount displayed prominently */}
                        {matchedLead ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400"
                          >
                            {matchedLead.agreedAmount != null
                              ? `${matchedLead.currency || "AED"} ${Number(matchedLead.agreedAmount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}`
                              : matchedLead.quotedAmount != null
                              ? `КП: ${matchedLead.currency || "AED"} ${Number(matchedLead.quotedAmount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}`
                              : `${matchedLead.currency || "AED"} 0.00`}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground font-medium text-xs">
                            Потенциал: AED 0
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{identity(selected)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Switch to Files button */}
                    <Button
                      type="button"
                      variant={activeTab === "files" ? "secondary" : "outline"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setActiveTab((current) => (current === "files" ? "messages" : "files"))}
                    >
                      <Paperclip className="h-4 w-4" />
                      <span>Файлы ({conversationAttachments.length})</span>
                    </Button>
                    {/* Manual Archive Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => void toggleArchive()}
                    >
                      {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      {showArchived ? "Восстановить" : "В архив"}
                    </Button>
                    {/* AI toggle button */}
                    <Button
                      type="button"
                      variant={selected.aiEnabled ? "destructive" : "default"}
                      size="sm"
                      aria-label={selected.aiEnabled ? "Take over AI" : "Resume AI"}
                      onClick={() => void toggleAi()}
                      disabled={aiUpdating}
                    >
                      {aiUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                      {selected.aiEnabled ? "Take over AI" : "Resume AI"}
                    </Button>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={
                      selected.aiEnabled
                        ? "border-emerald-600/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                    }
                  >
                    {selected.aiEnabled ? "AI активен" : "Ручной режим"}
                  </Badge>
                  {selected.number && (
                    <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs" asChild>
                      <a href={`https://wa.me/${selected.number.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">
                        <Phone className="h-3.5 w-3.5 mr-1" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex border-b border-border bg-muted/15 px-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("messages")}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTab === "messages"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Сообщения {detail?.messages?.length ? `(${detail.messages.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("files")}
                  className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTab === "files"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Файлы переписки {conversationAttachments.length ? `(${conversationAttachments.length})` : ""}
                </button>
              </div>

              {/* Messages View */}
              {activeTab === "messages" && (
                <>
                  <div
                    className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-background/55 p-4"
                    data-testid="live-messages-scroll"
                  >
                    {/* Notice bar if files exist in the conversation */}
                    {conversationAttachments.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/80 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Paperclip className="h-3.5 w-3.5 text-primary" />
                          В диалоге {conversationAttachments.length}{" "}
                          {conversationAttachments.length === 1
                            ? "файл"
                            : conversationAttachments.length < 5
                            ? "файла"
                            : "файлов"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("files")}
                          className="font-semibold text-primary hover:underline"
                        >
                          Показать все файлы →
                        </button>
                      </div>
                    )}

                    {detailLoading && !detail ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : detailError && !detail ? (
                      <div
                        role="alert"
                        className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-destructive"
                      >
                        <p>
                          {detailError}
                          <span className="sr-only">Live conversation history is temporarily unavailable.</span>
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailReloadKey((value) => value + 1)}
                        >
                          <RefreshCw className="h-4 w-4" /> Повторить
                        </Button>
                      </div>
                    ) : detail?.messages.length ? (
                      detail.messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          downloadingId={downloadingId}
                          onDownload={download}
                        />
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        <span className="sr-only">No messages in this conversation</span>
                        В этом диалоге пока нет сообщений
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {composerVisible && (
                    <div className="flex-none border-t border-border bg-card px-4 py-3" data-testid="live-composer">
                      {sendError && (
                        <p role="alert" className="mb-2 text-xs text-destructive">
                          {sendError}
                          <span className="sr-only">The reply could not be delivered. Your text was kept.</span>
                        </p>
                      )}
                      <div className="flex min-w-0 items-end gap-2">
                        <Textarea
                          value={draft}
                          onChange={(event) => setDraft(event.target.value.slice(0, maxMessageLength))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              void sendReply();
                            }
                          }}
                          placeholder="Напишите ответ от лица Руслана…"
                          aria-label="Reply message"
                          rows={2}
                          className="min-h-[44px] min-w-0 flex-1 resize-none"
                        />
                        <Button
                          type="button"
                          size="sm"
                          aria-label="Send"
                          onClick={() => void sendReply()}
                          disabled={sending || draft.trim().length === 0}
                        >
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                        </Button>
                      </div>
                    </div>
                  )}
                  {manualRepliesUnavailable && (
                    <div className="flex-none border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
                      Ручные ответы не настроены для данного развёртывания.
                      <span className="sr-only">Manual replies are not configured for this deployment yet.</span>
                    </div>
                  )}
                </>
              )}

              {/* Files View: Comprehensive List of All Files in This Conversation */}
              {activeTab === "files" && (
                <div className="min-h-0 flex-1 flex flex-col bg-background/55">
                  <div className="flex-none border-b border-border bg-card/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={fileSearchQuery}
                          onChange={(event) => setFileSearchQuery(event.target.value)}
                          placeholder="Поиск по названию файла…"
                          className="pl-9 h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setActiveTab("messages")}
                      >
                        <ArrowLeft className="h-4 w-4" /> К сообщениям
                      </Button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredAttachments.length === 0 ? (
                      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground p-6">
                        <File className="h-10 w-10 text-muted-foreground/60" />
                        <p className="font-semibold text-foreground">В этом диалоге пока нет файлов</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {fileSearchQuery
                            ? "По вашему запросу ничего не найдено."
                            : "Все полученные документы, фотографии и вложения WhatsApp отображаются здесь."}
                        </p>
                      </div>
                    ) : (
                      filteredAttachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary/20"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <AttachmentIcon kind={file.kind} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-foreground break-words [overflow-wrap:anywhere]">
                                {file.fileName}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                  {attachmentTypeLabel(file.fileName, file.kind)}
                                </Badge>
                                <span>•</span>
                                <span>{formatSize(file.sizeBytes)}</span>
                                {file.createdAt && (
                                  <>
                                    <span>•</span>
                                    <span>{formatTimestamp(file.createdAt, null)}</span>
                                  </>
                                )}
                              </div>
                              {file.summary && (
                                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {file.summary}
                                </p>
                              )}
                              {file.caption && (
                                <p className="mt-1 text-xs text-foreground/80 italic">
                                  Подпись: &ldquo;{file.caption}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label="Download"
                              className="gap-1.5 h-9"
                              onClick={() => void download(file)}
                              disabled={downloadingId === file.id}
                            >
                              {downloadingId === file.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Скачать
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                aria-label="Expand conversation list"
                onClick={() => setListCollapsed(false)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
              <MessageSquare className="h-8 w-8" />
              <p>Выберите диалог из списка слева для просмотра сообщений.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
