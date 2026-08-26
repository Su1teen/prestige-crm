import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardPlus,
  FileText,
  Flag,
  FolderOpen,
  Info,
  Paperclip,
  Phone,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CURRENT_PATERHAUS_USER, PATERHAUS_AI_NAME, PATERHAUS_TEAM } from "@/data/paterhaus";
import type { Conversation, Direction, Message } from "@/types/paterhaus";
import { EmptyState, StatusPill } from "./shared";

const intentTagLabels: Record<Direction, string> = {
  snagging: "Snagging",
  staging: "Staging",
  property_management: "Property management",
};

const intentTagClass = (intent: Direction): string =>
  intent === "snagging"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
    : intent === "staging"
      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
      : "border-sky-500/40 bg-sky-500/10 text-sky-300";

const attachmentKindLabel = (attachment: NonNullable<Message["attachment"]>): string => {
  if (attachment.kind) return attachment.kind;
  if (attachment.type === "image") return "image";
  if (attachment.type === "file") return "file";
  return attachment.name.toLowerCase().endsWith(".pdf") ? "pdf" : "document";
};

type InboxFilter = "all" | "unread" | "mine" | "owners" | "guests" | "vendors" | "internal" | "waiting" | "priority";
type MobilePane = "folders" | "list" | "detail";
type ComposerMode = "reply" | "note";
type AiAction = "summary" | "reply";

const inboxFolders: Array<{ id: InboxFilter; labelKey: string }> = [
  { id: "all", labelKey: "conversations.all" },
  { id: "unread", labelKey: "conversations.unread" },
  { id: "mine", labelKey: "conversations.mine" },
  { id: "owners", labelKey: "conversations.owners" },
  { id: "guests", labelKey: "conversations.guests" },
  { id: "vendors", labelKey: "conversations.vendors" },
  { id: "internal", labelKey: "conversations.internal" },
  { id: "waiting", labelKey: "conversations.waiting" },
  { id: "priority", labelKey: "conversations.priority" },
];

const formatConversationTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};

const matchesFolder = (conversation: Conversation, filter: InboxFilter) => {
  if (filter === "unread") return conversation.unread;
  if (filter === "mine") return conversation.assignedTo === CURRENT_PATERHAUS_USER.name;
  if (filter === "owners") return conversation.contactType === "Owner" || conversation.contactType === "Owner Lead";
  if (filter === "guests") return conversation.contactType === "Guest";
  if (filter === "vendors") return conversation.contactType === "Vendor";
  if (filter === "internal") return conversation.contactType === "Internal";
  if (filter === "waiting") return conversation.status === "Waiting for reply";
  if (filter === "priority") return conversation.priority === "High" || conversation.priority === "Urgent";
  return true;
};

const generateChatSummary = (messages: Message[]) => {
  if (messages.length === 0) {
    return {
      summary: "No messages in this conversation yet.",
      sentiment: "Neutral",
      recommendedActions: ["Send welcome message"]
    };
  }
  return {
    summary: "Guest is inquiring about property details and requesting additional services. They seem interested but need quick confirmation.",
    sentiment: "Urgent",
    recommendedActions: ["Send Snagging Quotation", "Request Title Deed", "Schedule Technician"]
  };
};

export const ConversationsModule = ({ onPropertySelect, initialConversationId }: { onPropertySelect?: (propertyId: string) => void; initialConversationId?: string }) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<InboxFilter>("all");
  const [viewsOpen, setViewsOpen] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [composerMode, setComposerMode] = useState<ComposerMode>("reply");
  const [composer, setComposer] = useState("");
  const [agentStopped, setAgentStopped] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiAction, setAiAction] = useState<AiAction>("summary");
  const selected = workspace.conversations.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (initialConversationId && workspace.conversations.some((item) => item.id === initialConversationId)) {
      setSelectedId(initialConversationId);
      setMobilePane("detail");
    }
  }, [initialConversationId, workspace.conversations]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return workspace.conversations
      .filter((conversation) => matchesFolder(conversation, folder))
      .filter((conversation) => `${conversation.contactName} ${conversation.subject} ${conversation.summary}`.toLowerCase().includes(normalized))
      .sort((first, second) => second.lastMessageAt.localeCompare(first.lastMessageAt));
  }, [folder, query, workspace.conversations]);

  const messages = selected
    ? workspace.messages.filter((message) => selected.messageIds.includes(message.id)).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    : [];
  const property = selected?.propertyId ? workspace.properties.find((item) => item.id === selected.propertyId) : undefined;
  const stay = selected?.stayId ? workspace.stays.find((item) => item.id === selected.stayId) : undefined;
  const openTasks = selected
    ? workspace.tasks.filter((task) => task.status !== "Completed" && (property ? task.propertyId === property.id : false))
    : [];
  const relatedLead = selected ? workspace.opportunities.find((item) => item.ownerName === selected.contactName) : undefined;
  const relatedFiles = selected
    ? workspace.files.filter(
        (file) =>
          (selected.propertyId && file.propertyId === selected.propertyId) ||
          (relatedLead && file.leadId === relatedLead.id),
      )
    : [];
  const whatsappHref = selected?.phone ? `https://wa.me/${selected.phone.replace(/[^\d]/g, "")}` : null;

  const folderCount = (filter: InboxFilter) => workspace.conversations.filter((conversation) => matchesFolder(conversation, filter)).length;
  const selectConversation = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    setMobilePane("detail");
    setAgentStopped(false);
    setComposer("");
    workspace.markConversationRead(conversation.id);
  };
  const send = () => {
    if (!selected || !composer.trim()) return;
    workspace.sendMessage(selected.id, composer, composerMode === "note");
    setComposer("");
    toast.success(composerMode === "note" ? t("conversations.noteAdded") : t("conversations.replyAdded"));
  };
  const createTask = () => {
    if (!selected) return;
    workspace.createTaskFromConversation(selected.id);
    toast.success(t("conversations.taskCreated"));
  };
  const stopAgent = () => {
    setAgentStopped(true);
    setComposerMode("reply");
    toast.success(t("conversations.agentStopped"));
  };
  const openAi = (action: AiAction) => { setAiAction(action); setAiOpen(true); };
  const aiDraft = selected ? `Hello ${selected.contactName},\n\nThank you for your message about ${selected.subject.toLowerCase()}. We are reviewing the linked property context and will confirm the next step shortly.\n\n${CURRENT_PATERHAUS_USER.name}` : "";

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("conversations.eyebrow")}</p><h2 className="mt-1 text-xl font-semibold text-foreground">{t("conversations.title")}</h2></div>
        <p className="text-xs text-muted-foreground">{workspace.conversations.filter((item) => item.unread).length} {t("conversations.unreadCount")}</p>
      </div>
      <div className={`grid h-[calc(100vh-8.25rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-border bg-card/70 ${viewsOpen ? "xl:grid-cols-[210px_320px_minmax(0,1fr)]" : "xl:grid-cols-[320px_minmax(0,1fr)]"}`}>
        <aside className={`${viewsOpen && mobilePane === "folders" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-r border-border bg-background/30 ${viewsOpen ? "xl:flex" : ""}`}>
          <div className="flex items-center justify-between border-b border-border p-4"><p className="font-semibold text-foreground">{t("conversations.views")}</p><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="hidden xl:inline-flex" aria-label={t("conversations.closeViews")} onClick={() => setViewsOpen(false)}><X className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" className="xl:hidden" onClick={() => setMobilePane("list")}>{t("conversations.conversations")} <ChevronRight className="h-4 w-4" /></Button></div></div>
          <nav className="space-y-1 overflow-y-auto p-2" aria-label={t("conversations.views")}>
            {inboxFolders.map((item) => (
              <button key={item.id} type="button" onClick={() => { setFolder(item.id); setMobilePane("list"); }} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${folder === item.id ? "bg-primary/12 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
                <span>{t(item.labelKey)}</span><span className="text-xs">{folderCount(item.id)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className={`${mobilePane === "list" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-r border-border xl:flex`}>
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Button type="button" variant="ghost" size="sm" className="xl:hidden" onClick={() => { setViewsOpen(true); setMobilePane("folders"); }}><FolderOpen className="h-4 w-4" /> {t("conversations.views")}</Button>{!viewsOpen && <Button type="button" variant="ghost" size="sm" className="hidden xl:inline-flex" onClick={() => setViewsOpen(true)}><FolderOpen className="h-4 w-4" /> {t("conversations.showViews")}</Button>}</div><p className="text-sm font-medium text-foreground">{t(inboxFolders.find((item) => item.id === folder)?.labelKey ?? "conversations.all")}</p></div>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("conversations.search")} className="pl-9" /></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length ? filtered.map((conversation) => {
              const linkedProperty = conversation.propertyId ? workspace.properties.find((item) => item.id === conversation.propertyId) : undefined;
              const lastMessage = workspace.messages.filter((message) => conversation.messageIds.includes(message.id)).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
              return (
                <button key={conversation.id} type="button" onClick={() => selectConversation(conversation)} className={`w-full border-b border-border/70 p-3 text-left transition-colors ${selectedId === conversation.id ? "border-l-4 border-l-primary bg-primary/10" : "border-l-4 border-l-transparent hover:bg-secondary/35"}`}>
                  <div className="flex items-start gap-3"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">{conversation.contactName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`truncate text-sm ${conversation.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{conversation.contactName}</p><span className="flex-shrink-0 text-[10px] text-muted-foreground">{formatConversationTime(conversation.lastMessageAt)}</span></div><div className="mt-0.5 flex items-center gap-1"><span className="text-[10px] uppercase tracking-wide text-primary">{conversation.contactType} · {conversation.channel}</span>{conversation.intentTags?.map((tag) => <span key={tag} className={`rounded-full border px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide ${intentTagClass(tag)}`}>{intentTagLabels[tag]}</span>)}{(conversation.priority === "High" || conversation.priority === "Urgent") && <Flag className="h-3 w-3 fill-amber-400 text-amber-400" />}{conversation.unread && <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">1</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{lastMessage?.text ?? conversation.summary}</p><div className="mt-2 flex min-w-0 items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="truncate">{linkedProperty?.name ?? t("conversations.noLinkedProperty")}</span><span className="flex-shrink-0">{conversation.assignedTo}</span></div></div></div>
                </button>
              );
            }) : <div className="p-6 text-center text-sm text-muted-foreground">{t("conversations.noMatch")}</div>}
          </div>
        </section>

        <section className={`${mobilePane === "detail" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col bg-background/20 xl:flex`}>
          {selected ? <>
            <div className="border-b border-border p-3">
              <div className="mb-2 xl:hidden"><Button type="button" variant="ghost" size="sm" onClick={() => setMobilePane("list")}><ArrowLeft className="h-4 w-4" /> {t("conversations.backToList")}</Button></div>
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-foreground">{selected.contactName}</h3><StatusPill status={selected.contactType} /><StatusPill status={selected.status} /></div><p className="mt-1 truncate text-sm text-muted-foreground">{selected.subject}</p>{selected.intentTags && selected.intentTags.length > 0 && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{selected.intentTags.map((tag) => <span key={tag} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${intentTagClass(tag)}`}>{intentTagLabels[tag]}</span>)}{selected.stage && <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{selected.stage}</span>}</div>}</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 border-r border-border pr-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-foreground">{!agentStopped ? "AI Agent Active" : "Manual Mode"}</span>
                      <span className="text-[10px] text-muted-foreground">{!agentStopped ? "AI is managing replies" : "Human has taken over"}</span>
                    </div>
                    <Switch
                      checked={!agentStopped}
                      onCheckedChange={(checked) => {
                        setAgentStopped(!checked);
                        if (!checked) toast.success("Switched to manual mode");
                        else toast.success("AI agent activated");
                      }}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="secondary" size="sm" onClick={() => openAi("summary")} className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 shadow-sm border border-sky-500/20">
                      <Sparkles className="h-4 w-4 mr-1.5" /> AI Summary
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openAi("reply")}><Bot className="h-4 w-4" /> {t("conversations.suggestReply")}</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={createTask}><ClipboardPlus className="h-4 w-4" /> {t("conversations.createTask")}</Button>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">{t("conversations.assignedTo")}</span><Select value={selected.assignedTo} onValueChange={(value) => workspace.assignConversation(selected.id, value)}><SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger><SelectContent>{PATERHAUS_TEAM.map((member) => <SelectItem key={member.name} value={member.name}>{member.name}</SelectItem>)}</SelectContent></Select>{property && <Button type="button" variant="outline" size="sm" onClick={() => onPropertySelect?.(property.id)}>{t("conversations.openProperty")}</Button>}{stay && <Button type="button" variant="outline" size="sm" onClick={() => toast.info(`${t("conversations.stay")} ${stay.reservationId}`)}>{t("conversations.stay")} {stay.reservationId}</Button>}{whatsappHref && <Button type="button" variant="outline" size="sm" asChild><a href={whatsappHref} target="_blank" rel="noreferrer"><Phone className="h-4 w-4" /> WhatsApp</a></Button>}<Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => workspace.setConversationStatus(selected.id, selected.status === "Resolved" ? "Open" : "Resolved")}><CheckCircle2 className="h-4 w-4" /> {selected.status === "Resolved" ? t("conversations.reopen") : t("conversations.resolve")}</Button></div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background/40 p-3 text-xs sm:grid-cols-3 lg:grid-cols-6">
                <div><p className="text-muted-foreground">{t("conversations.contact")}</p><p className="mt-0.5 truncate font-medium text-foreground">{selected.contactName}</p>{selected.phone && <p className="truncate text-muted-foreground">{selected.phone}</p>}</div>
                <div><p className="text-muted-foreground">{t("conversations.typeChannel")}</p><p className="mt-0.5 font-medium text-foreground">{selected.contactType}</p><p className="text-muted-foreground">{selected.channel}</p></div>
                <div><p className="text-muted-foreground">{t("conversations.property")}</p><p className="mt-0.5 truncate font-medium text-foreground">{property?.name ?? t("conversations.notLinked")}</p></div>
                <div><p className="text-muted-foreground">{t("conversations.currentStage")}</p><p className="mt-0.5 truncate font-medium text-foreground">{selected.stage ?? selected.status}</p></div>
                <div><p className="text-muted-foreground">{t("conversations.manager")}</p><p className="mt-0.5 truncate font-medium text-foreground">{selected.assignedTo}</p></div>
                <div><p className="text-muted-foreground">{t("conversations.openTasksFiles")}</p><p className="mt-0.5 font-medium text-foreground">{t("conversations.tasksFilesCount", { tasks: openTasks.length, files: relatedFiles.length })}</p>{relatedFiles[0] && <p className="flex items-center gap-1 truncate text-muted-foreground"><Info className="h-3 w-3 flex-shrink-0" />{relatedFiles[0].name}</p>}</div>
              </div>
            </div>
            {agentStopped ? <div className="border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"><span className="font-semibold">{t("conversations.humanHandoff")}</span> {t("conversations.humanHandoffHint")}</div> : <div className="border-b border-border bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">{t("conversations.agentActive")}</div>}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/25 p-4">
              {messages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-xl border p-3 ${message.internal ? "mx-auto border-amber-500/40 bg-amber-500/10" : message.author === "ai" ? "mr-auto border-sky-500/30 bg-sky-500/10" : message.author === "team" ? "ml-auto border-primary/30 bg-primary/10" : "mr-auto border-border bg-card"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-foreground">{message.author === "ai" ? PATERHAUS_AI_NAME : message.authorName}{message.author === "ai" && <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">{t("conversations.aiResponse")}</span>}{message.author === "team" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">{t("conversations.humanReply")}</span>}{message.internal && <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">{t("conversations.internalNote")}</span>}</p><time className="text-[10px] text-muted-foreground">{formatConversationTime(message.timestamp)}</time></div><p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-foreground">{message.text}</p>{message.attachment && <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-2 text-left hover:bg-secondary/50" onClick={() => toast.info(`${message.attachment?.name} is available in this demo thread.`)}><span className="rounded-md bg-primary/10 p-2 text-primary"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-foreground">{message.attachment.name}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{message.attachment.size} · {attachmentKindLabel(message.attachment)}</span></span><span className="text-[11px] text-primary">{t("conversations.open")}</span></button>}</div>)}
            </div>
            <div className="flex-shrink-0 border-t border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-1"><Button type="button" size="sm" variant={composerMode === "reply" ? "default" : "ghost"} onClick={() => setComposerMode("reply")}>{t("conversations.reply")}</Button><Button type="button" size="sm" variant={composerMode === "note" ? "default" : "ghost"} onClick={() => setComposerMode("note")}>{t("conversations.internalNote")}</Button><span className="ml-2 text-xs text-muted-foreground">{composerMode === "note" ? t("conversations.noteHint") : t("conversations.replyingVia", { channel: selected.channel })}</span></div>
              <div className={`flex items-end gap-2 rounded-xl border p-2 transition-colors ${!agentStopped ? "bg-secondary/20 border-border/50" : "bg-background border-border focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50"}`}>
                <Button type="button" variant="ghost" size="icon" className="h-[44px] w-[44px] shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full" aria-label={t("conversations.attachFile")} onClick={() => toast.info(t("conversations.attachFile"))}>
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Textarea aria-label={t("conversations.messageComposer")} value={composer} onChange={(event) => setComposer(event.target.value)} disabled={!agentStopped} placeholder={agentStopped ? (composerMode === "note" ? "Type an internal note..." : "Type a message...") : "AI is active. Switch to manual mode to reply."} className="min-h-[44px] max-h-[160px] flex-1 resize-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 text-sm leading-relaxed" />
                <Button type="button" size="icon" className="h-[44px] w-[44px] shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none" onClick={send} disabled={!agentStopped || !composer.trim()}>
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            </div>
          </> : <div className="flex h-full items-center justify-center p-6"><EmptyState title={t("conversations.selectConversation")} description={t("conversations.selectDescription")} /></div>}
        </section>
      </div>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{aiAction === "summary" ? "AI Insights" : t("conversations.suggestedReply")}</SheetTitle>
            <SheetDescription>{t("conversations.aiContext", { name: selected?.contactName ?? t("conversations.noConversation") })}</SheetDescription>
          </SheetHeader>
          
          {aiAction === "summary" ? (() => {
            const insights = selected ? generateChatSummary(messages) : null;
            return insights ? (
              <div className="mt-8 space-y-8">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Conversation Summary
                  </h4>
                  <div className="rounded-xl border border-border bg-card p-4 text-sm text-foreground leading-relaxed shadow-sm">
                    {insights.summary}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Sentiment
                  </h4>
                  <Badge variant="outline" className={`px-3 py-1 ${insights.sentiment === "Urgent" ? "border-red-500/50 text-red-400 bg-red-500/10" : "border-primary/50 text-primary bg-primary/10"}`}>
                    {insights.sentiment}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Recommended Actions
                  </h4>
                  <div className="space-y-2">
                    {insights.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:bg-secondary/40">
                        <span className="text-sm font-medium text-foreground">{action}</span>
                        <Button size="sm" variant="secondary" className="h-7 text-xs">Run</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null;
          })() : (
            <div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("conversations.aiDraft")}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">{aiDraft}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={() => { setComposerMode("reply"); setComposer(aiDraft); setAiOpen(false); toast.success(t("conversations.aiDraftAdded")); }}>{t("conversations.useSuggestion")}</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
