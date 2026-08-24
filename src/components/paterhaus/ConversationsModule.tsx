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
  Paperclip,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { CURRENT_PATERHAUS_USER, PATERHAUS_AI_NAME, PATERHAUS_TEAM } from "@/data/paterhaus";
import type { Conversation } from "@/types/paterhaus";
import { EmptyState, StatusPill } from "./shared";

type InboxFilter = "all" | "unread" | "mine" | "owners" | "guests" | "vendors" | "internal" | "waiting" | "priority";
type MobilePane = "folders" | "list" | "detail";
type ComposerMode = "reply" | "note";
type AiAction = "summary" | "reply";

const inboxFolders: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mine", label: "Assigned to me" },
  { id: "owners", label: "Owners" },
  { id: "guests", label: "Guests" },
  { id: "vendors", label: "Vendors" },
  { id: "internal", label: "Internal" },
  { id: "waiting", label: "Waiting for reply" },
  { id: "priority", label: "Priority" },
];

const formatConversationTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};

const matchesFolder = (conversation: Conversation, filter: InboxFilter) => {
  if (filter === "unread") return conversation.unread;
  if (filter === "mine") return conversation.assignedTo === CURRENT_PATERHAUS_USER.name;
  if (filter === "owners") return conversation.contactType === "Owner";
  if (filter === "guests") return conversation.contactType === "Guest";
  if (filter === "vendors") return conversation.contactType === "Vendor";
  if (filter === "internal") return conversation.contactType === "Internal";
  if (filter === "waiting") return conversation.status === "Waiting for reply";
  if (filter === "priority") return conversation.priority === "High" || conversation.priority === "Urgent";
  return true;
};

export const ConversationsModule = ({ onPropertySelect, initialConversationId }: { onPropertySelect?: (propertyId: string) => void; initialConversationId?: string }) => {
  const workspace = usePaterhausWorkspace();
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
    toast.success(composerMode === "note" ? "Internal note added." : "Reply added to the conversation.");
  };
  const createTask = () => {
    if (!selected) return;
    workspace.createTaskFromConversation(selected.id);
    toast.success("Follow-up task created in Operations.");
  };
  const stopAgent = () => {
    setAgentStopped(true);
    setComposerMode("reply");
    toast.success("Agent stopped. You are now replying as a human.");
  };
  const openAi = (action: AiAction) => { setAiAction(action); setAiOpen(true); };
  const aiDraft = selected ? `Hello ${selected.contactName},\n\nThank you for your message about ${selected.subject.toLowerCase()}. We are reviewing the linked property context and will confirm the next step shortly.\n\n${CURRENT_PATERHAUS_USER.name}` : "";

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Shared inbox</p><h2 className="mt-1 text-xl font-semibold text-foreground">Inbox</h2></div>
        <p className="text-xs text-muted-foreground">{workspace.conversations.filter((item) => item.unread).length} unread conversations</p>
      </div>
      <div className={`grid h-[calc(100vh-8.25rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-border bg-card/70 ${viewsOpen ? "xl:grid-cols-[210px_320px_minmax(0,1fr)]" : "xl:grid-cols-[320px_minmax(0,1fr)]"}`}>
        <aside className={`${viewsOpen && mobilePane === "folders" ? "flex" : "hidden"} min-w-0 flex-col border-r border-border bg-background/30 ${viewsOpen ? "xl:flex" : ""}`}>
          <div className="flex items-center justify-between border-b border-border p-4"><p className="font-semibold text-foreground">Views</p><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="hidden xl:inline-flex" aria-label="Close views" onClick={() => setViewsOpen(false)}><X className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" className="xl:hidden" onClick={() => setMobilePane("list")}>Conversations <ChevronRight className="h-4 w-4" /></Button></div></div>
          <nav className="space-y-1 overflow-y-auto p-2" aria-label="Inbox views">
            {inboxFolders.map((item) => (
              <button key={item.id} type="button" onClick={() => { setFolder(item.id); setMobilePane("list"); }} className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${folder === item.id ? "bg-primary/12 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
                <span>{item.label}</span><span className="text-xs">{folderCount(item.id)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className={`${mobilePane === "list" ? "flex" : "hidden"} min-w-0 flex-col border-r border-border xl:flex`}>
          <div className="border-b border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Button type="button" variant="ghost" size="sm" className="xl:hidden" onClick={() => { setViewsOpen(true); setMobilePane("folders"); }}><FolderOpen className="h-4 w-4" /> Views</Button>{!viewsOpen && <Button type="button" variant="ghost" size="sm" className="hidden xl:inline-flex" onClick={() => setViewsOpen(true)}><FolderOpen className="h-4 w-4" /> Show views</Button>}</div><p className="text-sm font-medium text-foreground">{inboxFolders.find((item) => item.id === folder)?.label}</p></div>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="pl-9" /></div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length ? filtered.map((conversation) => {
              const linkedProperty = conversation.propertyId ? workspace.properties.find((item) => item.id === conversation.propertyId) : undefined;
              const lastMessage = workspace.messages.filter((message) => conversation.messageIds.includes(message.id)).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
              return (
                <button key={conversation.id} type="button" onClick={() => selectConversation(conversation)} className={`w-full border-b border-border/70 p-3 text-left transition-colors ${selectedId === conversation.id ? "border-l-4 border-l-primary bg-primary/10" : "border-l-4 border-l-transparent hover:bg-secondary/35"}`}>
                  <div className="flex items-start gap-3"><div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">{conversation.contactName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className={`truncate text-sm ${conversation.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{conversation.contactName}</p><span className="flex-shrink-0 text-[10px] text-muted-foreground">{formatConversationTime(conversation.lastMessageAt)}</span></div><div className="mt-0.5 flex items-center gap-1"><span className="text-[10px] uppercase tracking-wide text-primary">{conversation.contactType}</span>{(conversation.priority === "High" || conversation.priority === "Urgent") && <Flag className="h-3 w-3 fill-amber-400 text-amber-400" />}{conversation.unread && <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">1</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{lastMessage?.text ?? conversation.summary}</p><div className="mt-2 flex min-w-0 items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="truncate">{linkedProperty?.name ?? "No linked property"}</span><span className="flex-shrink-0">{conversation.assignedTo}</span></div></div></div>
                </button>
              );
            }) : <div className="p-6 text-center text-sm text-muted-foreground">No conversations match this view.</div>}
          </div>
        </section>

        <section className={`${mobilePane === "detail" ? "flex" : "hidden"} min-w-0 flex-col bg-background/20 xl:flex`}>
          {selected ? <>
            <div className="border-b border-border p-3">
              <div className="mb-2 xl:hidden"><Button type="button" variant="ghost" size="sm" onClick={() => setMobilePane("list")}><ArrowLeft className="h-4 w-4" /> Back to conversations</Button></div>
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold text-foreground">{selected.contactName}</h3><StatusPill status={selected.contactType} /><StatusPill status={selected.status} /></div><p className="mt-1 truncate text-sm text-muted-foreground">{selected.subject}</p></div><div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => openAi("summary")}><Sparkles className="h-4 w-4" /> Summarise</Button><Button type="button" variant="ghost" size="sm" onClick={() => openAi("reply")}><Bot className="h-4 w-4" /> Suggest reply</Button><Button type="button" variant="ghost" size="sm" onClick={createTask}><ClipboardPlus className="h-4 w-4" /> Create task</Button>{!agentStopped && <Button type="button" variant="outline" size="sm" onClick={stopAgent}><Bot className="h-4 w-4" /> Stop agent</Button>}</div></div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Assigned to</span><Select value={selected.assignedTo} onValueChange={(value) => workspace.assignConversation(selected.id, value)}><SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger><SelectContent>{PATERHAUS_TEAM.map((member) => <SelectItem key={member.name} value={member.name}>{member.name}</SelectItem>)}</SelectContent></Select>{property && <Button type="button" variant="outline" size="sm" onClick={() => onPropertySelect?.(property.id)}>Open property</Button>}{stay && <Button type="button" variant="outline" size="sm" onClick={() => toast.info(`Stay ${stay.reservationId} is linked to this conversation.`)}>Stay {stay.reservationId}</Button>}<Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => workspace.setConversationStatus(selected.id, selected.status === "Resolved" ? "Open" : "Resolved")}><CheckCircle2 className="h-4 w-4" /> {selected.status === "Resolved" ? "Reopen" : "Resolve"}</Button></div>
            </div>
            {agentStopped ? <div className="border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200"><span className="font-semibold">Human handoff active.</span> The agent is stopped and your replies will be sent as the property management team.</div> : <div className="border-b border-border bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">Agent is handling this thread. Stop the agent to take over manually.</div>}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/25 p-4">
              {messages.map((message) => <div key={message.id} className={`max-w-[82%] rounded-xl border p-3 ${message.internal ? "mx-auto border-amber-500/40 bg-amber-500/10" : message.author === "ai" ? "mr-auto border-sky-500/30 bg-sky-500/10" : message.author === "team" ? "ml-auto border-primary/30 bg-primary/10" : "mr-auto border-border bg-card"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-foreground">{message.author === "ai" ? PATERHAUS_AI_NAME : message.authorName}{message.author === "ai" && <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sky-200">AI response</span>}{message.author === "team" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">Human reply</span>}{message.internal && <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">Internal note</span>}</p><time className="text-[10px] text-muted-foreground">{formatConversationTime(message.timestamp)}</time></div><p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-foreground">{message.text}</p>{message.attachment && <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-2 text-left hover:bg-secondary/50" onClick={() => toast.info(`${message.attachment?.name} is available in this demo thread.`)}><span className="rounded-md bg-primary/10 p-2 text-primary"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-foreground">{message.attachment.name}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{message.attachment.size} · {message.attachment.kind}</span></span><span className="text-[11px] text-primary">Open</span></button>}</div>)}
            </div>
            <div className="flex-shrink-0 border-t border-border bg-card p-3">
              <div className="mb-2 flex items-center gap-1 rounded-lg bg-secondary/60 p-1"><Button type="button" size="sm" variant={composerMode === "reply" ? "default" : "ghost"} onClick={() => setComposerMode("reply")}>Reply</Button><Button type="button" size="sm" variant={composerMode === "note" ? "default" : "ghost"} onClick={() => setComposerMode("note")}>Internal note</Button><span className="ml-2 text-xs text-muted-foreground">{composerMode === "note" ? "Only your team can see this" : `Replying via ${selected.channel}`}</span></div>
              <div className="flex items-end gap-2"><Button type="button" variant="ghost" size="icon" aria-label="Attach file" onClick={() => toast.info("Choose an attachment for this demo conversation.")}><Paperclip className="h-4 w-4" /></Button><Textarea aria-label="Message composer" value={composer} onChange={(event) => setComposer(event.target.value)} disabled={!agentStopped} placeholder={agentStopped ? (composerMode === "note" ? "Add an internal note…" : "Write a human reply…") : "Stop the agent to reply manually…"} className="min-h-16 flex-1 resize-none" /><Button type="button" onClick={send} disabled={!agentStopped || !composer.trim()}><Send className="h-4 w-4" /><span className="hidden sm:inline">{composerMode === "note" ? "Add note" : "Send"}</span></Button></div>
            </div>
          </> : <div className="flex h-full items-center justify-center p-6"><EmptyState title="Select a conversation" description="Choose a conversation to review its history and reply." /></div>}
        </section>
      </div>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-md"><SheetHeader><SheetTitle>{aiAction === "summary" ? "Conversation summary" : "Suggested reply"}</SheetTitle><SheetDescription>Current context: {selected?.contactName ?? "No conversation selected"}</SheetDescription></SheetHeader><div className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">AI draft</p>{aiAction === "summary" ? <div className="mt-3 space-y-2 text-sm text-foreground"><p>{selected?.summary}</p><p className="text-muted-foreground">Priority: {selected?.priority} · Status: {selected?.status} · {messages.length} messages</p></div> : <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">{aiDraft}</p>}</div><div className="mt-4 flex flex-wrap gap-2">{aiAction === "reply" && <Button type="button" onClick={() => { setComposerMode("reply"); setComposer(aiDraft); setAiOpen(false); toast.success("AI draft added to the composer. It has not been sent."); }}>Use draft</Button>}<Button type="button" variant="outline" onClick={() => setAiOpen(false)}>Close</Button></div></SheetContent>
      </Sheet>
    </div>
  );
};
