import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Download, FileImage, FileText, LayoutGrid, MessageCircle, Paperclip, Plus, Search, Send, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace, type NewOpportunityInput } from "@/contexts/PaterhausWorkspaceContext";
import { CURRENT_PATERHAUS_USER, formatUSD, formatPaterhausDateTime, LOST_REASONS, TAG_PRESETS } from "@/data/paterhaus";
import type { LostReason, OpportunityStage, OwnerOpportunity, Priority, SlaStatus } from "@/types/paterhaus";
import {
  DIRECTIONS,
  directionDefaultLabel,
  directionLabelKey,
  exportToCsv,
  formatMinutes,
  PIPELINE_STAGES,
  slaStatusGlyph,
  slaStatusKey,
  slaStatusTone,
  type Direction,
} from "./p0Shared";
import { LeadDetailsModal } from "./LeadDetailsModal";
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
  direction: Direction;
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
  direction: "property_management",
};

const SlaBadge = ({ status, minutes }: { status: SlaStatus; minutes?: number }) => {
  const { t } = useLanguage();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${slaStatusTone[status]}`}
      title={`${t(slaStatusKey[status])}${minutes !== undefined ? ` · ${formatMinutes(minutes)}` : ""}`}
    >
      <Clock3 className="h-3 w-3" />
      {slaStatusGlyph[status]} {t(slaStatusKey[status])}
      {minutes !== undefined && status !== "on_track" && <span className="opacity-70">· {formatMinutes(minutes)}</span>}
    </span>
  );
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
  const { t } = useLanguage();
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
              <p className="text-xs uppercase tracking-[0.16em] text-primary">{t("pipeline.ownerOpportunity")}</p>
              <SheetTitle className="mt-1 text-2xl">{opportunity.ownerName}</SheetTitle>
              <SheetDescription>
                {opportunity.prospectProperty} · {opportunity.area} · {opportunity.type}
              </SheetDescription>
            </div>
            <StatusPill status={opportunity.stage} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {opportunity.phone && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={waLink(opportunity.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  {t("pipeline.chatWhatsApp")}
                </a>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                // Defer to allow sheet close animation; parent will pick up the lead
                setTimeout(() => {
                  const event = new CustomEvent("paterhaus:openLeadCard", { detail: opportunity.id });
                  window.dispatchEvent(event);
                }, 50);
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              {t("lead.eyebrow")}
            </Button>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">{t("pipeline.contactProfile")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.owner")}</span>
                <span className="text-foreground">{opportunity.ownerName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.assignedManager")}</span>
                <span className="text-foreground">{opportunity.assignedTo}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.leadSource")}</span>
                <span className="text-foreground">{opportunity.leadSource}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.lastCommunication")}</span>
                <span className="text-foreground">{opportunity.lastCommunication}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.phone")}</span>
                <span className="text-foreground">{opportunity.phone ?? "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.email")}</span>
                <span className="break-all text-foreground">{opportunity.email ?? "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.campaign")}</span>
                <span className="text-foreground">{campaign?.name ?? "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.bedrooms")}</span>
                <span className="text-foreground">{opportunity.bedrooms !== undefined ? `${opportunity.bedrooms} BR` : "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.direction")}</span>
                <span className="text-foreground">
                  {opportunity.direction ? (t(directionLabelKey[opportunity.direction]) || directionDefaultLabel[opportunity.direction]) : "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("pipeline.firstResponseSla")}</span>
                <span className="text-foreground">
                  {opportunity.slaStatus ? (
                    <SlaBadge status={opportunity.slaStatus} minutes={opportunity.firstResponseMinutes} />
                  ) : (
                    "—"
                  )}
                </span>
              </p>
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">{t("pipeline.propertyProspect")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("pipeline.monthlyRevenueLabel")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUSD(opportunity.estimatedMonthlyRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("pipeline.annualRevenue")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatUSD(opportunity.estimatedAnnualRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("pipeline.potentialFee")}</p>
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
            <h3 className="font-medium text-foreground">{t("pipeline.documentsFollowUp")}</h3>
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
              <h3 className="font-medium text-foreground">{t("pipeline.attachments")}</h3>
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
              <h3 className="font-medium text-foreground">{t("pipeline.conversation")}</h3>
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
              <h3 className="font-medium text-foreground">{t("pipeline.onboardingChecklist")}</h3>
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
            <h3 className="font-medium text-foreground">{t("pipeline.linkedWork")}</h3>
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
            <h3 className="font-medium text-foreground">{t("pipeline.activityTimeline")}</h3>
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
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<OpportunityStage | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [directionFilter, setDirectionFilter] = useState<Direction | "All">("All");
  const [selected, setSelected] = useState<OwnerOpportunity | null>(null);
  const [leadModal, setLeadModal] = useState<OwnerOpportunity | null>(null);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [lostOpportunity, setLostOpportunity] = useState<OwnerOpportunity | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [lostReasonCode, setLostReasonCode] = useState<LostReason | "">("");
  const [lead, setLead] = useState<LeadForm>(initialLead);
  // P1.4 — Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTag, setBulkTag] = useState("");

  // P1.1 — Listen for "open lead card" events from the OpportunityDetail sheet
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const lead = workspace.opportunities.find((item) => item.id === customEvent.detail);
      if (lead) setLeadModal(lead);
    };
    window.addEventListener("paterhaus:openLeadCard", handler);
    return () => window.removeEventListener("paterhaus:openLeadCard", handler);
  }, [workspace.opportunities]);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return workspace.opportunities.filter((opportunity) => {
      const text = `${opportunity.ownerName} ${opportunity.prospectProperty} ${opportunity.area}`.toLowerCase();
      return (
        text.includes(normalized) &&
        (stageFilter === "All" || opportunity.stage === stageFilter) &&
        (priorityFilter === "All" || opportunity.priority === priorityFilter) &&
        (directionFilter === "All" || opportunity.direction === directionFilter)
      );
    });
  }, [directionFilter, priorityFilter, query, stageFilter, workspace.opportunities]);
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

  // P1.4 — Bulk handlers
  const allSelected = filtered.length > 0 && filtered.every((opportunity) => selectedIds.includes(opportunity.id));
  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((opportunity) => opportunity.id) : []);
  };
  const toggleSelectLead = (id: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  };
  const handleBulkAssign = (assignee: string) => {
    workspace.bulkAssignOpportunities(selectedIds, assignee);
    toast.success(t("bulk.assigned"));
    setSelectedIds([]);
  };
  const handleBulkChangeStage = (stage: OpportunityStage) => {
    workspace.bulkChangeStage(selectedIds, stage);
    toast.success(t("bulk.stageChanged"));
    setSelectedIds([]);
  };
  const handleBulkAddTag = () => {
    if (!bulkTag.trim()) return;
    workspace.bulkAddTag(selectedIds, bulkTag.trim());
    toast.success(t("bulk.tagAdded"));
    setBulkTag("");
  };
  const handleBulkRemoveTag = (tag: string) => {
    workspace.bulkRemoveTag(selectedIds, tag);
    toast.success(t("bulk.tagRemoved"));
  };
  const handleBulkExport = () => {
    const leadsToExport = workspace.opportunities.filter((opportunity) => selectedIds.includes(opportunity.id));
    exportToCsv(
      leadsToExport,
      "paterhaus-pipeline-bulk.csv",
      [
        { header: "id", accessor: (row) => row.id },
        { header: "owner_name", accessor: (row) => row.ownerName },
        { header: "prospect_property", accessor: (row) => row.prospectProperty },
        { header: "area", accessor: (row) => row.area },
        { header: "direction", accessor: (row) => row.direction ?? "property_management" },
        { header: "stage", accessor: (row) => row.stage },
        { header: "priority", accessor: (row) => row.priority },
        { header: "assigned_to", accessor: (row) => row.assignedTo },
        { header: "lead_source", accessor: (row) => row.leadSource },
        { header: "monthly_revenue", accessor: (row) => row.estimatedMonthlyRevenue },
        { header: "phone", accessor: (row) => row.phone ?? "" },
        { header: "email", accessor: (row) => row.email ?? "" },
        { header: "tags", accessor: (row) => (row.tags ?? []).join("; ") },
      ],
    );
    toast.success(t("bulk.exported"));
  };
  const handleBulkWhatsApp = () => {
    const leads = workspace.opportunities.filter((opportunity) => selectedIds.includes(opportunity.id) && opportunity.phone);
    leads.forEach((lead) => {
      window.open(`https://wa.me/${lead.phone!.replace(/[^0-9]/g, "")}`, "_blank");
    });
    toast.success(t("bulk.whatsappOpened"));
  };
  const exportPipelineCsv = () => {
    exportToCsv(
      filtered,
      `paterhaus-pipeline-${directionFilter}.csv`,
      [
        { header: "id", accessor: (row) => row.id },
        { header: "owner_name", accessor: (row) => row.ownerName },
        { header: "prospect_property", accessor: (row) => row.prospectProperty },
        { header: "area", accessor: (row) => row.area },
        { header: "type", accessor: (row) => row.type },
        { header: "direction", accessor: (row) => row.direction ?? "property_management" },
        { header: "stage", accessor: (row) => row.stage },
        { header: "stage_id", accessor: (row) => row.stageId ?? "" },
        { header: "priority", accessor: (row) => row.priority },
        { header: "assigned_to", accessor: (row) => row.assignedTo },
        { header: "lead_source", accessor: (row) => row.leadSource },
        { header: "campaign_id", accessor: (row) => row.campaignId ?? "" },
        { header: "monthly_revenue", accessor: (row) => row.estimatedMonthlyRevenue },
        { header: "annual_revenue", accessor: (row) => row.estimatedAnnualRevenue },
        { header: "potential_fee", accessor: (row) => row.potentialManagementFee },
        { header: "phone", accessor: (row) => row.phone ?? "" },
        { header: "email", accessor: (row) => row.email ?? "" },
        { header: "bedrooms", accessor: (row) => row.bedrooms ?? "" },
        { header: "first_response_at", accessor: (row) => row.firstResponseAt ?? "" },
        { header: "first_response_minutes", accessor: (row) => row.firstResponseMinutes ?? "" },
        { header: "sla_status", accessor: (row) => row.slaStatus ?? "" },
        { header: "lost_reason", accessor: (row) => row.lostReason ?? "" },
        { header: "last_communication", accessor: (row) => row.lastCommunication },
        { header: "next_action", accessor: (row) => row.nextAction },
      ],
    );
    toast.success(t("export.opportunities"));
  };

  const slaStats = useMemo(() => {
    const total = filtered.length;
    const overdue = filtered.filter((o) => o.slaStatus === "overdue").length;
    const warning = filtered.filter((o) => o.slaStatus === "warning").length;
    const onTrack = filtered.filter((o) => o.slaStatus === "on_track").length;
    const responded = filtered.filter((o) => o.firstResponseMinutes !== undefined);
    const avgResponse =
      responded.length === 0
        ? 0
        : responded.reduce((sum, o) => sum + (o.firstResponseMinutes ?? 0), 0) / responded.length;
    return {
      total,
      overdue,
      warning,
      onTrack,
      withinSlaPct: total === 0 ? 0 : Math.round((onTrack / total) * 100),
      avgResponseMinutes: Math.round(avgResponse * 10) / 10,
    };
  }, [filtered]);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("pipeline.eyebrow")}
        title={t("pipeline.title")}
        description={t("pipeline.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportPipelineCsv}>
              <Download className="h-4 w-4" />
              {t("export.opportunities")}
            </Button>
            <Button onClick={() => setShowLeadDialog(true)}>
              <Plus className="h-4 w-4" />
              {t("pipeline.add_lead")}
            </Button>
          </div>
        }
      />
      {/* P0.2 — Direction tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-card/50 p-1" role="group" aria-label="Direction filter">
        <Button
          type="button"
          size="sm"
          variant={directionFilter === "All" ? "secondary" : "ghost"}
          onClick={() => setDirectionFilter("All")}
        >
          {t("common.all")}
        </Button>
        {DIRECTIONS.map((direction) => (
          <Button
            key={direction}
            type="button"
            size="sm"
            variant={directionFilter === direction ? "secondary" : "ghost"}
            onClick={() => setDirectionFilter(direction)}
          >
            {t(directionLabelKey[direction]) || directionDefaultLabel[direction]}
          </Button>
        ))}
      </div>
      {/* P0.5 — SLA stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-border/80 bg-card/70 p-4">
          <p className="text-xs text-muted-foreground">{t("marketing.leads")}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{slaStats.total}</p>
        </Card>
        <Card className="border-border/80 bg-card/70 p-4">
          <p className="text-xs text-muted-foreground">{t("sla.metrics.contacted15")}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{slaStats.withinSlaPct}%</p>
        </Card>
        <Card className="border-border/80 bg-card/70 p-4">
          <p className="text-xs text-muted-foreground">{t("sla.metrics.avgFirstResponse")}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{formatMinutes(slaStats.avgResponseMinutes)}</p>
        </Card>
        <Card className="border-border/80 bg-card/70 p-4">
          <p className="text-xs text-muted-foreground">{t("sla.overdue")}</p>
          <p className="mt-1 text-lg font-semibold text-red-300">{slaStats.overdue}</p>
        </Card>
      </div>
      {/* P1.4 — Bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <Card className="sticky top-0 z-10 border-primary/40 bg-primary/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} {t("bulk.selected")}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("bulk.assignTo")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t("bulk.assignTo")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Array.from(new Set(workspace.opportunities.map((o) => o.assignedTo))).map((assignee) => (
                  <DropdownMenuItem key={assignee} onClick={() => handleBulkAssign(assignee)}>
                    {assignee}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("bulk.changeStage")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t("bulk.changeStage")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stages.map((stage) => (
                  <DropdownMenuItem key={stage} onClick={() => handleBulkChangeStage(stage)}>
                    {stage}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1">
              <Input
                placeholder={t("bulk.tagPlaceholder")}
                value={bulkTag}
                onChange={(event) => setBulkTag(event.target.value)}
                className="h-9 w-32"
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleBulkAddTag();
                }}
              />
              <Button variant="outline" size="sm" onClick={handleBulkAddTag} disabled={!bulkTag.trim()}>
                {t("bulk.addTag")}
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("bulk.removeTag")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t("bulk.removeTag")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TAG_PRESETS.map((tag) => (
                  <DropdownMenuItem key={tag} onClick={() => handleBulkRemoveTag(tag)}>
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleBulkWhatsApp}>
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              {t("bulk.sendWhatsapp")}
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkExport}>
              <Download className="h-4 w-4" />
              {t("bulk.export")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              <X className="h-4 w-4" />
              {t("bulk.clear")}
            </Button>
          </div>
        </Card>
      )}
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("pipeline.search_placeholder")}
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
            <option>{t("pipeline.all")}</option>
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
            <option>{t("pipeline.all")}</option>
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
            <span>{t("pipeline.scrollHorizontal")}</span>
            <span aria-hidden="true">Shift + wheel →</span>
          </div>
          <div className="overflow-x-auto overscroll-x-contain pb-4">
            <div className="flex w-max min-w-full gap-5">
              {stages.map((stage) => {
                const opportunities = filtered.filter((opportunity) => opportunity.stage === stage);
                return (
                  <Card key={stage} className="w-[340px] min-w-[340px] shrink-0 border-border/80 bg-card/60 p-3">
                    <div className="flex min-h-12 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Checkbox
                          checked={opportunities.length > 0 && opportunities.every((o) => selectedIds.includes(o.id))}
                          onCheckedChange={(checked) => {
                            const ids = opportunities.map((o) => o.id);
                            setSelectedIds((current) =>
                              checked === true
                                ? Array.from(new Set([...current, ...ids]))
                                : current.filter((id) => !ids.includes(id)),
                            );
                          }}
                          aria-label={t("bulk.selectAll")}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5 text-foreground">{stage}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{opportunities.length} {t("pipeline.opportunities")}</p>
                        </div>
                      </div>
                      <StatusPill status={`${opportunities.length}`} />
                    </div>
                    <div className="mt-3 space-y-3">
                      {opportunities.map((opportunity) => (
                        <div
                          key={opportunity.id}
                          className={`rounded-xl border bg-background/40 p-3 transition-colors ${
                            selectedIds.includes(opportunity.id) ? "border-primary/60 bg-primary/5" : "border-border/70"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={selectedIds.includes(opportunity.id)}
                              onCheckedChange={(checked) => toggleSelectLead(opportunity.id, checked === true)}
                              className="mt-1"
                              aria-label={`Select ${opportunity.ownerName}`}
                            />
                            <button type="button" onClick={() => setSelected(opportunity)} className="min-w-0 flex-1 text-left">
                              <div className="flex items-start gap-2">
                                <UserRound className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <span className="min-w-0 flex-1">
                                  <span className="block break-words whitespace-normal text-sm font-semibold leading-snug text-foreground">{opportunity.ownerName}</span>
                                  <span className="mt-1 block break-words whitespace-normal text-xs leading-5 text-muted-foreground">{opportunity.prospectProperty}</span>
                                </span>
                                {opportunity.direction && (
                                  <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {t(directionLabelKey[opportunity.direction]) || directionDefaultLabel[opportunity.direction]}
                                  </span>
                                )}
                              </div>
                              <dl className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
                                <dt className="text-muted-foreground">{t("pipeline.area")}</dt><dd className="min-w-0 break-words text-foreground">{opportunity.area}</dd>
                                <dt className="text-muted-foreground">{t("pipeline.monthlyRevenue")}</dt><dd className="font-medium text-foreground">{formatUSD(opportunity.estimatedMonthlyRevenue)}</dd>
                                <dt className="text-muted-foreground">{t("pipeline.source")}</dt><dd className="min-w-0 break-words text-foreground">{opportunity.leadSource}</dd>
                                <dt className="text-muted-foreground">{t("pipeline.priority")}</dt><dd><StatusPill status={opportunity.priority} /></dd>
                                <dt className="text-muted-foreground">{t("pipeline.sla")}</dt>
                                <dd>
                                  {opportunity.slaStatus ? (
                                    <SlaBadge status={opportunity.slaStatus} minutes={opportunity.firstResponseMinutes} />
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </dd>
                                <dt className="text-muted-foreground">{t("pipeline.nextAction")}</dt><dd className="min-w-0 break-words leading-5 text-foreground">{opportunity.nextAction}</dd>
                                <dt className="text-muted-foreground">{t("pipeline.assignee")}</dt><dd className="min-w-0 break-words text-foreground">{opportunity.assignedTo}</dd>
                              </dl>
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <select aria-label={`Move ${opportunity.ownerName} opportunity`} value={opportunity.stage} onChange={(event) => changeStage(opportunity, event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs">
                              {stages.map((nextStage) => <option key={nextStage}>{nextStage}</option>)}
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLeadModal(opportunity)}
                              aria-label={t("lead.eyebrow")}
                            >
                              <LayoutGrid className="h-3.5 w-3.5" />
                              {t("lead.eyebrow")}
                            </Button>
                          </div>
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
      <LeadDetailsModal lead={leadModal} isOpen={leadModal !== null} onClose={() => setLeadModal(null)} />
      <Dialog open={showLeadDialog} onOpenChange={setShowLeadDialog}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>{t("pipeline.addOwnerLead")}</DialogTitle>
            <DialogDescription>
              {t("pipeline.addOwnerLeadDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={t("pipeline.ownerNamePlaceholder")}
              value={lead.ownerName}
              onChange={(event) => setLead((current) => ({ ...current, ownerName: event.target.value }))}
            />
            <Input
              placeholder={t("pipeline.prospectPropertyPlaceholder")}
              value={lead.prospectProperty}
              onChange={(event) => setLead((current) => ({ ...current, prospectProperty: event.target.value }))}
            />
            <Input
              placeholder={t("pipeline.phonePlaceholder")}
              value={lead.phone}
              onChange={(event) => setLead((current) => ({ ...current, phone: event.target.value }))}
            />
            <Input
              type="email"
              placeholder={t("pipeline.emailPlaceholder")}
              value={lead.email}
              onChange={(event) => setLead((current) => ({ ...current, email: event.target.value }))}
            />
            <select
              aria-label={t("pipeline.leadSourceLabel")}
              value={lead.leadSource}
              onChange={(event) => setLead((current) => ({ ...current, leadSource: event.target.value }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {leadSources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </select>
            <select
              aria-label={t("pipeline.campaignLabel")}
              value={lead.campaignId}
              onChange={(event) => setLead((current) => ({ ...current, campaignId: event.target.value }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("pipeline.noCampaign")}</option>
              {workspace.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <Input
              placeholder={t("pipeline.areaPlaceholder")}
              value={lead.area}
              onChange={(event) => setLead((current) => ({ ...current, area: event.target.value }))}
            />
            <select
              aria-label={t("pipeline.propertyTypeLabel")}
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
              placeholder={t("pipeline.bedroomsPlaceholder")}
              value={lead.bedrooms}
              onChange={(event) => setLead((current) => ({ ...current, bedrooms: event.target.value }))}
            />
            <Input
              type="number"
              min="0"
              placeholder={t("pipeline.monthlyRevenuePlaceholder")}
              value={lead.estimatedMonthlyRevenue}
              onChange={(event) => setLead((current) => ({ ...current, estimatedMonthlyRevenue: event.target.value }))}
            />
            <select
              aria-label={t("pipeline.leadStageLabel")}
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
              aria-label={t("pipeline.leadPriorityLabel")}
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
              placeholder={t("pipeline.commentPlaceholder")}
              value={lead.comment}
              onChange={(event) => setLead((current) => ({ ...current, comment: event.target.value }))}
              className="sm:col-span-2"
            />
            <select
              aria-label={t("pipeline.directionLabel")}
              value={lead.direction}
              onChange={(event) => setLead((current) => ({ ...current, direction: event.target.value as Direction }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm sm:col-span-2"
            >
              {DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {t(directionLabelKey[direction]) || directionDefaultLabel[direction]}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeadDialog(false)}>
              {t("pipeline.cancel")}
            </Button>
            <Button onClick={createLead} disabled={!lead.ownerName.trim() || !lead.prospectProperty.trim()}>
              {t("pipeline.addLeadButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={lostOpportunity !== null} onOpenChange={(open) => !open && setLostOpportunity(null)}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>{t("lost.title")}</DialogTitle>
            <DialogDescription>{t("lost.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <select
              aria-label={t("lost.selectReason")}
              value={lostReasonCode}
              onChange={(event) => {
                const value = event.target.value;
                setLostReasonCode(value as LostReason | "");
                const reason = LOST_REASONS.find((item) => item.value === value);
                if (reason) setLostReason(t(reason.labelKey) || reason.label);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("lost.selectReason")}</option>
              {LOST_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {t(reason.labelKey) || reason.label}
                </option>
              ))}
            </select>
            <Input
              placeholder={t("lost.description")}
              value={lostReason}
              onChange={(event) => setLostReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpportunity(null)}>
              {t("common.close")}
            </Button>
            <Button
              onClick={() => {
                if (lostOpportunity && lostReasonCode) {
                  workspace.moveOpportunityStage(
                    lostOpportunity.id,
                    "Lost / Not Proceeding",
                    lostReason.trim() || undefined,
                    lostReasonCode as LostReason,
                  );
                  setLostOpportunity(null);
                  setLostReason("");
                  setLostReasonCode("");
                }
              }}
              disabled={!lostReasonCode}
            >
              {t("lost.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
