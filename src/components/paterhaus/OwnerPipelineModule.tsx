import { useMemo, useState } from "react";
import { Download, FileImage, FileText, MessageCircle, Paperclip, Plus, Search, Send, Trash2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace, type NewOpportunityInput } from "@/contexts/PaterhausWorkspaceContext";
import { CURRENT_PATERHAUS_USER, formatUSD, formatPaterhausDateTime } from "@/data/paterhaus";
import type { OpportunityStage, OwnerOpportunity, Priority } from "@/types/paterhaus";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

const stages: OpportunityStage[] = [
  "New Lead",
  "Qualified",
  "Valuation / Revenue Proposal",
  "Property Visit Scheduled",
  "Agreement Sent",
  "Agreement Signed",
  "Onboarding",
  "Staging & Setup",
  "Listing Readiness",
  "Live & Managed",
  "Lost / Not Proceeding",
];

const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];
const propertyTypes = ["Apartment", "Villa", "Townhouse", "Penthouse", "Studio"] as const;

const stageValues: string[] = stages;
const priorityValues: string[] = priorities;
const isOpportunityStage = (value: string): value is OpportunityStage => stageValues.includes(value);
const isPriority = (value: string): value is Priority => priorityValues.includes(value);

const leadSources = ["Referral", "Meta Lead Ads", "Instagram DM", "Website", "Walk-in"] as const;

interface LeadForm {
  ownerName: string;
  prospectProperty: string;
  area: string;
  type: (typeof propertyTypes)[number];
  estimatedMonthlyRevenue: string;
  stage: OpportunityStage;
  assignedTo: string;
  leadSource: string;
  priority: Priority;
  nextAction: string;
  phone: string;
  email: string;
  campaignId: string;
  bedrooms: string;
  comment: string;
}

const initialLead: LeadForm = {
  ownerName: "",
  prospectProperty: "",
  area: "Dubai Marina",
  type: "Apartment",
  estimatedMonthlyRevenue: "18000",
  stage: "New Lead",
  assignedTo: CURRENT_PATERHAUS_USER.name,
  leadSource: "Referral",
  priority: "Medium",
  nextAction: "Qualify investment objectives",
  phone: "+971 ",
  email: "",
  campaignId: "",
  bedrooms: "",
  comment: "",
};

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

const OpportunityDetail = ({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: OwnerOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const [draft, setDraft] = useState("");
  if (!opportunity) return null;
  const linkedTasks = workspace.tasks.filter((task) => opportunity.taskIds?.includes(task.id));
  const linkedConversations = workspace.conversations.filter((conversation) =>
    opportunity.conversationIds?.includes(conversation.id),
  );
  const checklist = opportunity.onboardingChecklist ?? [];
  const attachments = workspace.files.filter((file) => file.leadId === opportunity.id);
  const messages = workspace.leadMessages.filter((message) => message.opportunityId === opportunity.id);
  const campaign = workspace.campaigns.find((item) => item.id === opportunity.campaignId);
  const sendDraft = () => {
    if (!draft.trim()) return;
    workspace.sendLeadMessage(opportunity.id, draft);
    setDraft("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary">Owner opportunity</p>
              <SheetTitle className="mt-1 text-2xl">{opportunity.ownerName}</SheetTitle>
              <SheetDescription>
                {opportunity.prospectProperty} · {opportunity.area} · {opportunity.type}
              </SheetDescription>
            </div>
            <StatusPill status={opportunity.stage} />
          </div>
          {opportunity.phone && (
            <div className="mt-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={waLink(opportunity.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          )}
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Contact profile</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Owner</span>
                <span className="text-foreground">{opportunity.ownerName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Assigned account manager</span>
                <span className="text-foreground">{opportunity.assignedTo}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Lead source</span>
                <span className="text-foreground">{opportunity.leadSource}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Last communication</span>
                <span className="text-foreground">{opportunity.lastCommunication}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Phone</span>
                <span className="text-foreground">{opportunity.phone ?? "Not captured"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Email</span>
                <span className="break-all text-foreground">{opportunity.email ?? "Not captured"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Campaign</span>
                <span className="text-foreground">{campaign?.name ?? "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Bedrooms</span>
                <span className="text-foreground">{opportunity.bedrooms !== undefined ? `${opportunity.bedrooms} BR` : "—"}</span>
              </p>
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Property prospect and proposal</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Monthly revenue</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUSD(opportunity.estimatedMonthlyRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annual revenue</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUSD(opportunity.estimatedAnnualRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Potential fee</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUSD(opportunity.potentialManagementFee)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Expected range: {formatUSD(opportunity.expectedRevenueMin ?? opportunity.estimatedMonthlyRevenue)}–
              {formatUSD(opportunity.expectedRevenueMax ?? opportunity.estimatedMonthlyRevenue)}
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">{opportunity.notes}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Proposal status: {opportunity.proposalStatus ?? "Draft"} · Next action: {opportunity.nextAction}
            </p>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Documents and follow-up</h3>
            <div className="mt-3 space-y-2">
              {(opportunity.documents ?? ["Revenue proposal", "Management agreement draft"]).map((document) => (
                <div key={document} className="flex items-center gap-2 rounded-lg border border-border/70 p-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{document}</span>
                  <StatusPill status="Draft" className="ml-auto" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Follow-up reminder: {opportunity.followUpAt ? formatPaterhausDateTime(opportunity.followUpAt) : "Not scheduled"}
            </p>
          </Card>
          <Card className="border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-foreground">Attachments</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  workspace.addFile({
                    name: `Note_${opportunity.ownerName.split(" ")[0]}_${attachments.length + 1}.pdf`,
                    type: "document",
                    sizeKb: 240,
                    leadId: opportunity.id,
                    description: "Demo upload from Owner Pipeline",
                  })
                }
              >
                <Paperclip className="h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files attached to this lead yet.</p>
              ) : (
                attachments.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-lg border border-border/70 p-2 text-sm">
                    {file.type === "image" ? (
                      <FileImage className="h-4 w-4 flex-shrink-0 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                    <span className="min-w-0">
                      <span className="block break-all text-foreground">{file.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {file.sizeKb} KB · {file.uploadedAt}
                      </span>
                    </span>
                    <span className="ml-auto flex flex-shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Download ${file.name}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={`Delete ${file.name}`}
                        onClick={() => workspace.removeFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-foreground">Conversation</h3>
              {opportunity.phone && (
                <a
                  href={waLink(opportunity.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Open in WhatsApp
                </a>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages with this owner yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.direction === "outbound"
                        ? "ml-8 rounded-xl rounded-br-sm border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-sm text-foreground"
                        : "mr-8 rounded-xl rounded-bl-sm border border-border/70 bg-background/40 p-2.5 text-sm text-foreground"
                    }
                  >
                    <p>{message.text}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {message.direction === "outbound" ? "You" : opportunity.ownerName} · WhatsApp
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendDraft();
                }}
                placeholder="Type a WhatsApp message"
              />
              <Button onClick={sendDraft} disabled={!draft.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
          {checklist.length > 0 && (
            <Card className="border-primary/30 bg-primary/5 p-4">
              <h3 className="font-medium text-foreground">Onboarding checklist</h3>
              <div className="mt-3 space-y-2">
                {checklist.map((item, index) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 text-xs text-primary">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Linked work and conversation history</h3>
            <div className="mt-3 space-y-2">
              {linkedTasks.map((task) => (
                <p key={task.id} className="text-sm text-muted-foreground">
                  Task · <span className="text-foreground">{task.title}</span> · {task.status}
                </p>
              ))}
              {linkedConversations.map((conversation) => (
                <p key={conversation.id} className="text-sm text-muted-foreground">
                  Conversation · <span className="text-foreground">{conversation.subject}</span> · {conversation.status}
                </p>
              ))}
              {linkedTasks.length === 0 && linkedConversations.length === 0 && (
                <p className="text-sm text-muted-foreground">No linked work has been created yet.</p>
              )}
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Activity timeline</h3>
            <div className="mt-3 space-y-2">
              {(opportunity.activity ?? [`Lead created on ${opportunity.lastCommunication}`]).map((event) => (
                <p key={event} className="border-l border-primary/40 pl-3 text-sm text-muted-foreground">
                  {event}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const OwnerPipelineModule = () => {
  const workspace = usePaterhausWorkspace();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<OpportunityStage | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [selected, setSelected] = useState<OwnerOpportunity | null>(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [lostOpportunity, setLostOpportunity] = useState<OwnerOpportunity | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [lead, setLead] = useState<LeadForm>(initialLead);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return workspace.opportunities.filter((opportunity) => {
      const text = `${opportunity.ownerName} ${opportunity.prospectProperty} ${opportunity.area}`.toLowerCase();
      return (
        text.includes(normalized) &&
        (stageFilter === "All" || opportunity.stage === stageFilter) &&
        (priorityFilter === "All" || opportunity.priority === priorityFilter)
      );
    });
  }, [priorityFilter, query, stageFilter, workspace.opportunities]);
  const createLead = () => {
    if (!lead.ownerName.trim() || !lead.prospectProperty.trim()) return;
    const input: NewOpportunityInput = {
      ...lead,
      estimatedMonthlyRevenue: Number(lead.estimatedMonthlyRevenue) || 0,
      phone: lead.phone.trim() || undefined,
      email: lead.email.trim() || undefined,
      campaignId: lead.campaignId || undefined,
      bedrooms: Number(lead.bedrooms) || undefined,
      notes: lead.comment.trim() || undefined,
    };
    workspace.addOpportunity(input);
    setShowLeadDialog(false);
    setLead(initialLead);
  };
  const changeStage = (opportunity: OwnerOpportunity, nextStage: string) => {
    if (!isOpportunityStage(nextStage)) return;
    if (nextStage === "Lost / Not Proceeding") {
      setLostOpportunity(opportunity);
      return;
    }
    workspace.moveOpportunityStage(opportunity.id, nextStage);
  };
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Owner acquisition and onboarding"
        title="Owner Pipeline"
        description="Move prospective owners from first conversation through signed agreement and listing readiness."
        action={
          <Button onClick={() => setShowLeadDialog(true)}>
            <Plus className="h-4 w-4" />
            Add lead
          </Button>
        }
      />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search owner, property or area"
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter pipeline stage"
            value={stageFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isOpportunityStage(event.target.value)) {
                setStageFilter(event.target.value);
              }
            }}
            className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option>All</option>
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
          <select
            aria-label="Filter pipeline priority"
            value={priorityFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isPriority(event.target.value)) setPriorityFilter(event.target.value);
            }}
            className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option>All</option>
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description="Adjust the search or filters to see pipeline records."
        />
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Scroll horizontally to review every stage</span>
            <span aria-hidden="true">Shift + wheel →</span>
          </div>
          <div className="overflow-x-auto overscroll-x-contain pb-4">
            <div className="flex w-max min-w-full gap-4">
              {stages.map((stage) => {
                const opportunities = filtered.filter((opportunity) => opportunity.stage === stage);
                return (
                  <Card key={stage} className="w-[300px] min-w-[300px] border-border/80 bg-card/60 p-3">
                    <div className="flex min-h-12 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-foreground">{stage}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{opportunities.length} opportunities</p>
                      </div>
                      <StatusPill status={`${opportunities.length}`} />
                    </div>
                    <div className="mt-3 space-y-3">
                      {opportunities.map((opportunity) => (
                        <div key={opportunity.id} className="overflow-hidden rounded-xl border border-border/70 bg-background/40 p-3">
                          <button type="button" onClick={() => setSelected(opportunity)} className="w-full text-left">
                            <div className="flex items-start gap-2">
                              <UserRound className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span className="min-w-0">
                                <span className="block break-words text-sm font-semibold leading-5 text-foreground">{opportunity.ownerName}</span>
                                <span className="mt-1 block break-words text-xs leading-5 text-muted-foreground">{opportunity.prospectProperty}</span>
                              </span>
                            </div>
                            <dl className="mt-3 grid grid-cols-[84px_minmax(0,1fr)] gap-x-2 gap-y-2 text-xs">
                              <dt className="text-muted-foreground">Area</dt><dd className="min-w-0 break-words text-foreground">{opportunity.area}</dd>
                              <dt className="text-muted-foreground">Monthly revenue</dt><dd className="font-medium text-foreground">{formatUSD(opportunity.estimatedMonthlyRevenue)}</dd>
                              <dt className="text-muted-foreground">Source</dt><dd className="min-w-0 break-words text-foreground">{opportunity.leadSource}</dd>
                              <dt className="text-muted-foreground">Priority</dt><dd><StatusPill status={opportunity.priority} /></dd>
                              <dt className="text-muted-foreground">Next action</dt><dd className="min-w-0 break-words leading-5 text-foreground">{opportunity.nextAction}</dd>
                              <dt className="text-muted-foreground">Assignee</dt><dd className="min-w-0 break-words text-foreground">{opportunity.assignedTo}</dd>
                            </dl>
                          </button>
                          <select aria-label={`Move ${opportunity.ownerName} opportunity`} value={opportunity.stage} onChange={(event) => changeStage(opportunity, event.target.value)} className="mt-3 h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs">
                            {stages.map((nextStage) => <option key={nextStage}>{nextStage}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <OpportunityDetail
        opportunity={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>Add owner lead</DialogTitle>
            <DialogDescription>
              Create a typed local opportunity with an initial stage and follow-up reminder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Owner name"
              value={lead.ownerName}
              onChange={(event) => setLead((current) => ({ ...current, ownerName: event.target.value }))}
            />
            <Input
              placeholder="Prospect property"
              value={lead.prospectProperty}
              onChange={(event) => setLead((current) => ({ ...current, prospectProperty: event.target.value }))}
            />
            <Input
              placeholder="Phone (+971 XX XXX XXXX)"
              value={lead.phone}
              onChange={(event) => setLead((current) => ({ ...current, phone: event.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={lead.email}
              onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
            />
            <select
              aria-label="Lead source"
              value={lead.leadSource}
              onChange={(event) => setLead((current) => ({ ...current, leadSource: event.target.value }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {leadSources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
            <select
              aria-label="Campaign"
              value={lead.campaignId}
              onChange={(event) => setLead((current) => ({ ...current, campaignId: event.target.value }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">No campaign</option>
              {workspace.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Area"
              value={lead.area}
              onChange={(event) => setLead((current) => ({ ...current, area: event.target.value }))}
            />
            <select
              aria-label="Property type"
              value={lead.type}
              onChange={(event) =>
                setLead((current) => ({ ...current, type: event.target.value as LeadForm["type"] }))
              }
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              placeholder="Bedrooms"
              value={lead.bedrooms}
              onChange={(event) => setLead((current) => ({ ...current, bedrooms: event.target.value }))}
            />
            <Input
              type="number"
              min="0"
              placeholder="Monthly revenue"
              value={lead.estimatedMonthlyRevenue}
              onChange={(event) => setLead((current) => ({ ...current, estimatedMonthlyRevenue: event.target.value }))}
            />
            <select
              aria-label="Lead stage"
              value={lead.stage}
              onChange={(event) => {
                const nextStage = event.target.value;
                if (isOpportunityStage(nextStage)) setLead((current) => ({ ...current, stage: nextStage }));
              }}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
            <select
              aria-label="Lead priority"
              value={lead.priority}
              onChange={(event) => {
                const nextPriority = event.target.value;
                if (isPriority(nextPriority)) setLead((current) => ({ ...current, priority: nextPriority }));
              }}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {priorities.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
            <Input
              placeholder="Comment (optional)"
              value={lead.comment}
              onChange={(event) => setLead((current) => ({ ...current, comment: event.target.value }))}
              className="sm:col-span-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createLead} disabled={!lead.ownerName.trim() || !lead.prospectProperty.trim()}>
              Add lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={lostOpportunity !== null} onOpenChange={(open) => !open && setLostOpportunity(null)}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>Capture lost reason</DialogTitle>
            <DialogDescription>Keep the reason visible for future acquisition review.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason the owner is not proceeding"
            value={lostReason}
            onChange={(event) => setLostReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpportunity(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (lostOpportunity && lostReason.trim()) {
                  workspace.moveOpportunityStage(lostOpportunity.id, "Lost / Not Proceeding", lostReason.trim());
                  setLostOpportunity(null);
                  setLostReason("");
                }
              }}
              disabled={!lostReason.trim()}
            >
              Save lost reason
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
