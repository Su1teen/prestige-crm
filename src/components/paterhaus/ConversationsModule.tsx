import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardPlus, MessageCircle, Paperclip, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { OpsCopilot } from "./OpsCopilot";
import { EmptyState, SectionHeader, StatusPill } from "./shared";
import type { Conversation, ConversationContactType, ConversationStatus } from "@/types/paterhaus";

const contactTypes: Array<ConversationContactType | "All"> = ["All", "Owner", "Guest", "Vendor", "Internal"];
const statuses: Array<ConversationStatus | "All"> = [
  "All",
  "Open",
  "Waiting for reply",
  "Waiting for internal action",
  "Resolved",
];
const contactTypeValues: string[] = contactTypes;
const statusValues: string[] = statuses;
const isContactType = (value: string): value is ConversationContactType | "All" => contactTypeValues.includes(value);
const isConversationStatus = (value: string): value is ConversationStatus | "All" => statusValues.includes(value);
export const ConversationsModule = ({
  onPropertySelect,
  initialConversationId,
}: {
  onPropertySelect?: (propertyId: string) => void;
  initialConversationId?: string;
}) => {
  const workspace = usePaterhausWorkspace();
  const [query, setQuery] = useState("");
  const [contactFilter, setContactFilter] = useState<ConversationContactType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "All">("All");
  const [selectedId, setSelectedId] = useState(workspace.conversations[0]?.id ?? "");
  const [composer, setComposer] = useState("");
  const selected = workspace.conversations.find((item) => item.id === selectedId) ?? null;
  useEffect(() => {
    if (initialConversationId && workspace.conversations.some((item) => item.id === initialConversationId)) {
      setSelectedId(initialConversationId);
    }
  }, [initialConversationId, workspace.conversations]);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return workspace.conversations.filter((conversation) => {
      const matchesSearch = `${conversation.contactName} ${conversation.subject} ${conversation.summary}`
        .toLowerCase()
        .includes(normalized);
      return (
        matchesSearch &&
        (contactFilter === "All" || conversation.contactType === contactFilter) &&
        (statusFilter === "All" || conversation.status === statusFilter)
      );
    });
  }, [contactFilter, query, statusFilter, workspace.conversations]);
  const messages = selected
    ? workspace.messages
        .filter((message) => selected.messageIds.includes(message.id))
        .sort((first, second) => first.timestamp.localeCompare(second.timestamp))
    : [];
  const property = selected?.propertyId
    ? workspace.properties.find((item) => item.id === selected.propertyId)
    : undefined;
  const stay = selected?.stayId ? workspace.stays.find((item) => item.id === selected.stayId) : undefined;

  const selectConversation = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    workspace.markConversationRead(conversation.id);
  };

  const send = () => {
    if (!selected || !composer.trim()) return;
    workspace.sendMessage(selected.id, composer);
    setComposer("");
    toast.success("Message added to the local conversation thread.");
  };

  const createTask = () => {
    if (!selected) return;
    workspace.createTaskFromConversation(selected.id);
    toast.success("Follow-up task created from this conversation.");
  };

  const placeTemplate = (template: string) => setComposer(template);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Unified shared inbox"
        title="Conversations"
        description="Owner, guest, vendor and internal threads with local task consequences and operational context."
      />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="border-border/80 bg-card/80 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="pl-9"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="min-w-36 flex-1 text-xs text-muted-foreground">
              Contact type
              <Select
                value={contactFilter}
                onValueChange={(value) => {
                  if (isContactType(value)) setContactFilter(value);
                }}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Filter by contact" />
                </SelectTrigger>
                <SelectContent>
                  {contactTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "All" ? "All contact types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="min-w-36 flex-1 text-xs text-muted-foreground">
              Conversation status
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (isConversationStatus(value)) setStatusFilter(value);
                }}
              >
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "All" ? "All conversation statuses" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div className="mt-3 space-y-1">
            {filtered.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => selectConversation(conversation)}
                className={`w-full rounded-xl border p-3 text-left ${selectedId === conversation.id ? "border-primary/50 bg-primary/10" : "border-transparent hover:border-border hover:bg-secondary/30"}`}
              >
                <div className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{conversation.subject}</span>
                      {conversation.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {conversation.contactName} · {conversation.channel}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      <StatusPill status={conversation.priority} />
                      <StatusPill status={conversation.status} />
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
        {selected ? (
          <Card className="border-border/80 bg-card/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-primary">
                  {selected.contactType} · {selected.channel}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{selected.subject}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.contactName} · {selected.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill status={selected.priority} />
                <StatusPill status={selected.status} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="text-xs text-muted-foreground">
                First response context
                <span className="mt-1 block text-sm text-foreground">{selected.slaMinutes} min SLA window</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Assigned inbox owner<span className="mt-1 block text-sm text-foreground">{selected.assignedTo}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Intent / urgency
                <span className="mt-1 block text-sm text-foreground">
                  {selected.intent} · {selected.priority}
                </span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {property && (
                <Button type="button" variant="outline" size="sm" onClick={() => onPropertySelect?.(property.id)}>
                  Open {property.name}
                </Button>
              )}
              {stay && (
                <span className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                  Stay {stay.reservationId}
                </span>
              )}
              <Button type="button" size="sm" onClick={createTask}>
                <ClipboardPlus className="h-4 w-4" /> Create task
              </Button>
              <label className="text-xs text-muted-foreground">
                Shared inbox owner
                <Select
                  value={selected.assignedTo}
                  onValueChange={(value) => workspace.assignConversation(selected.id, value)}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Assign owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Amelia Hart", "Priya Nair", "Omar Rahman"].map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="text-xs text-muted-foreground">
                Thread status
                <Select
                  value={selected.status}
                  onValueChange={(value) => {
                    if (isConversationStatus(value) && value !== "All") {
                      workspace.setConversationStatus(selected.id, value);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.slice(1).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <div className="mt-5 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-2xl rounded-xl border p-3 ${message.internal ? "ml-8 border-amber-500/30 bg-amber-500/10" : message.author === "team" ? "border-primary/20 bg-primary/5" : "border-border bg-background/30"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">
                      {message.authorName}
                      {message.internal ? " · Internal note" : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{message.timestamp.replace("T", " ")}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{message.text}</p>
                  {message.id === messages[messages.length - 1]?.id && selected.contactType === "Vendor" && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300">
                      <Check className="h-3 w-3" /> Consequence logged in Operations
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2">
                {workspace.settings.communicationTemplates.map((template) => (
                  <Button
                    key={template}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => placeTemplate(template)}
                  >
                    {template.slice(0, 32)}…
                  </Button>
                ))}
              </div>
              <div className="mt-3 flex items-end gap-2">
                <Textarea
                  aria-label="Conversation composer"
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  placeholder="Write a professional response or internal note…"
                  className="min-h-24 flex-1 rounded-md border border-input bg-background p-3 text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button type="button" onClick={send}>
                    Send
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.info("Attachment/media placeholder opened for this demo thread.")}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                External message draft · confirm content before sending. Attachments are local placeholders.
              </p>
            </div>
            <div className="mt-5">
              <OpsCopilot
                propertyId={selected.propertyId ?? undefined}
                conversationId={selected.id}
                onOpenProperty={onPropertySelect}
                onDraftReply={setComposer}
              />
            </div>
          </Card>
        ) : (
          <EmptyState
            title="Select a conversation"
            description="Choose a thread to review messages and operational context."
          />
        )}
      </div>
    </div>
  );
};
