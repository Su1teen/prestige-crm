import { useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { lostReasonLabel } from "@/data/paterhaus";
import { PATERHAUS_TODAY } from "@/data/paterhaus";
import type {
  LeadFileAttachment,
  LeadTask,
  LeadTaskType,
  OwnerOpportunity,
  TimelineEvent,
  TimelineEventType,
} from "@/types/paterhaus";
import { directionDefaultLabel, directionLabelKey, formatMinutes } from "./p0Shared";
import { BookingModal } from "./BookingModal";
import { StatusPill } from "./shared";

const eventTypeGlyph: Record<TimelineEventType, string> = {
  form_submitted: "📝",
  lead_created: "✨",
  assigned: "👤",
  stage_changed: "🔄",
  whatsapp_message: "💬",
  file_uploaded: "📎",
  note_added: "🗒️",
  task_created: "✅",
  task_completed: "✔️",
  booking_scheduled: "📅",
  lost: "✖️",
};

const eventTypeTone: Record<TimelineEventType, string> = {
  form_submitted: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  lead_created: "border-primary/40 bg-primary/10 text-primary",
  assigned: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  stage_changed: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  whatsapp_message: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  file_uploaded: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  note_added: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  task_created: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  task_completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  booking_scheduled: "border-indigo-500/40 bg-indigo-500/10 text-indigo-200",
  lost: "border-red-500/40 bg-red-500/10 text-red-200",
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const taskTypeGlyph: Record<LeadTaskType, string> = {
  call: "📞",
  whatsapp: "💬",
  email: "✉️",
  assessment: "🏠",
  proposal: "📄",
  follow_up: "🔁",
};

const taskStatusTone: Record<LeadTask["status"], string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  overdue: "border-red-500/40 bg-red-500/10 text-red-200",
};

const fileIcon = (type: LeadFileAttachment["type"]) => {
  if (type === "image") return <ImageIcon className="h-4 w-4 text-primary" />;
  return <FileText className="h-4 w-4 text-primary" />;
};

const formatFileSize = (sizeKb: number) => {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(2)} MB`;
  return `${sizeKb} KB`;
};

interface LeadDetailsModalProps {
  lead: OwnerOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetailsModal = ({ lead, isOpen, onClose }: LeadDetailsModalProps) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("basic");
  const [showBooking, setShowBooking] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<LeadTaskType>("call");
  const [newNote, setNewNote] = useState("");

  if (!lead) return null;

  // Always work with the latest version from workspace
  const current = workspace.opportunities.find((item) => item.id === lead.id) ?? lead;
  const timeline = current.timeline ?? [];
  const leadTasks = current.leadTasks ?? [];
  const leadFiles = current.leadFiles ?? [];
  const attribution = current.marketingAttribution;
  const campaign = current.campaignId ? workspace.campaigns.find((item) => item.id === current.campaignId) : undefined;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    workspace.addLeadTask(current.id, {
      type: newTaskType,
      title: newTaskTitle.trim(),
      dueAt: `${PATERHAUS_TODAY}T16:00:00`,
      status: "pending",
      assignee: current.assignedTo,
    });
    setNewTaskTitle("");
    toast.success(t("lead.taskCreated"));
  };

  const handleToggleTask = (taskId: string) => {
    workspace.toggleLeadTask(current.id, taskId);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    workspace.addTimelineEvent(current.id, {
      type: "note_added",
      timestamp: `${PATERHAUS_TODAY}T12:00:00`,
      userName: "You",
      details: newNote.trim(),
    });
    setNewNote("");
    toast.success(t("lead.noteAdded"));
  };

  const handleAddFile = () => {
    const fileName = `Note_${new Date().toISOString().slice(0, 10)}.pdf`;
    workspace.addLeadFile(current.id, {
      name: fileName,
      type: "document",
      sizeKb: 256,
      uploadedAt: `${PATERHAUS_TODAY}T12:00:00`,
      uploadedBy: "You",
    });
    toast.success(t("lead.fileUploaded"));
  };

  const handleRemoveFile = (fileId: string) => {
    workspace.removeLeadFile(current.id, fileId);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="dark max-h-[90vh] overflow-y-auto border-border bg-background sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">{t("lead.eyebrow")}</p>
                <DialogTitle className="mt-1 text-2xl">{current.ownerName}</DialogTitle>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
                  {current.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {current.phone}
                    </span>
                  )}
                  {current.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {current.email}
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusPill status={current.stage} />
                {current.direction && (
                  <StatusPill
                    status={t(directionLabelKey[current.direction]) || directionDefaultLabel[current.direction]}
                  />
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowBooking(true)}>
              <CalendarPlus className="h-4 w-4" />
              {t("lead.scheduleAssessment")}
            </Button>
            {current.phone && (
              <Button asChild size="sm" variant="outline">
                <a href={`https://wa.me/${current.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="basic" className="flex-1">
                {t("lead.tab.basic")}
              </TabsTrigger>
              <TabsTrigger value="attribution" className="flex-1">
                {t("lead.tab.attribution")}
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1">
                {t("lead.tab.timeline")}
                {timeline.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-[10px]">
                    {timeline.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1">
                {t("lead.tab.tasks")}
                {leadTasks.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-[10px]">
                    {leadTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1">
                {t("lead.tab.files")}
                {leadFiles.length > 0 && (
                  <Badge variant="outline" className="ml-1.5 px-1.5 py-0 text-[10px]">
                    {leadFiles.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Info */}
            <TabsContent value="basic">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border bg-card/60 p-4">
                  <h3 className="text-sm font-medium text-foreground">{t("lead.contactInfo")}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground">{current.ownerName}</span>
                    </div>
                    {current.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{current.phone}</span>
                      </div>
                    )}
                    {current.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{current.email}</span>
                      </div>
                    )}
                  </dl>
                </Card>
                <Card className="border-border bg-card/60 p-4">
                  <h3 className="text-sm font-medium text-foreground">{t("lead.leadDetails")}</h3>
                  <dl className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">{t("lead.source")}</dt>
                    <dd className="text-foreground">{current.leadSource}</dd>
                    <dt className="text-muted-foreground">{t("lead.direction")}</dt>
                    <dd className="text-foreground">
                      {current.direction
                        ? t(directionLabelKey[current.direction]) || directionDefaultLabel[current.direction]
                        : "—"}
                    </dd>
                    <dt className="text-muted-foreground">{t("lead.stage")}</dt>
                    <dd className="text-foreground">{current.stage}</dd>
                    <dt className="text-muted-foreground">{t("lead.assignedTo")}</dt>
                    <dd className="text-foreground">{current.assignedTo}</dd>
                    <dt className="text-muted-foreground">{t("lead.priority")}</dt>
                    <dd>
                      <StatusPill status={current.priority} />
                    </dd>
                    <dt className="text-muted-foreground">{t("lead.area")}</dt>
                    <dd className="text-foreground">{current.area}</dd>
                    <dt className="text-muted-foreground">{t("lead.property")}</dt>
                    <dd className="text-foreground">{current.prospectProperty}</dd>
                    <dt className="text-muted-foreground">{t("lead.monthlyRevenue")}</dt>
                    <dd className="font-medium text-foreground">
                      ${current.estimatedMonthlyRevenue.toLocaleString("en-US")}
                    </dd>
                  </dl>
                </Card>
                <Card className="border-border bg-card/60 p-4">
                  <h3 className="text-sm font-medium text-foreground">{t("lead.sla")}</h3>
                  <dl className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">{t("lead.firstResponse")}</dt>
                    <dd className="text-foreground">
                      {current.firstResponseAt ? formatTimestamp(current.firstResponseAt) : "—"}
                    </dd>
                    <dt className="text-muted-foreground">{t("lead.responseTime")}</dt>
                    <dd className="text-foreground">
                      {current.firstResponseMinutes !== undefined ? formatMinutes(current.firstResponseMinutes) : "—"}
                    </dd>
                    <dt className="text-muted-foreground">{t("lead.slaStatus")}</dt>
                    <dd>
                      {current.slaStatus ? <StatusPill status={current.slaStatus} /> : <span className="text-muted-foreground">—</span>}
                    </dd>
                    <dt className="text-muted-foreground">{t("lead.createdAt")}</dt>
                    <dd className="text-foreground">
                      {current.createdAt ? formatTimestamp(current.createdAt) : "—"}
                    </dd>
                  </dl>
                </Card>
                <Card className="border-border bg-card/60 p-4">
                  <h3 className="text-sm font-medium text-foreground">{t("lead.relatedEntities")}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    {current.relatedPropertyId && (
                      <p className="text-muted-foreground">
                        {t("lead.property")}: <span className="text-foreground">{current.relatedPropertyId}</span>
                      </p>
                    )}
                    {current.relatedOwnerId && (
                      <p className="text-muted-foreground">
                        {t("common.owner")}: <span className="text-foreground">{current.relatedOwnerId}</span>
                      </p>
                    )}
                    {current.relatedGuestId && (
                      <p className="text-muted-foreground">
                        {t("lead.guest")}: <span className="text-foreground">{current.relatedGuestId}</span>
                      </p>
                    )}
                    {campaign && (
                      <p className="text-muted-foreground">
                        {t("lead.campaign")}: <span className="text-foreground">{campaign.name}</span>
                      </p>
                    )}
                    {current.tags && current.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {current.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {!current.relatedPropertyId && !current.relatedOwnerId && !current.relatedGuestId && !campaign && (
                      <p className="text-muted-foreground">{t("lead.noRelated")}</p>
                    )}
                  </dl>
                </Card>
                {current.stage === "Lost / Not Proceeding" && (
                  <Card className="border-red-500/30 bg-red-500/5 p-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-red-200">{t("lead.lostReason")}</h3>
                    <p className="mt-2 text-sm text-foreground">
                      {lostReasonLabel(current.lostReasonCode) ?? current.lostReason ?? "—"}
                    </p>
                    {current.lostAt && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(current.lostAt)}</p>
                    )}
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Marketing Attribution */}
            <TabsContent value="attribution">
              {!attribution ? (
                <Card className="border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  {t("lead.noAttribution")}
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border bg-card/60 p-4">
                    <h3 className="text-sm font-medium text-foreground">{t("lead.source")}</h3>
                    <dl className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Original Source</dt>
                      <dd className="text-foreground">{attribution.originalSource}</dd>
                      <dt className="text-muted-foreground">Platform</dt>
                      <dd className="text-foreground">{attribution.platform ?? "—"}</dd>
                    </dl>
                  </Card>
                  <Card className="border-border bg-card/60 p-4">
                    <h3 className="text-sm font-medium text-foreground">{t("lead.campaign")}</h3>
                    <dl className="mt-3 grid grid-cols-[100px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">Campaign</dt>
                      <dd className="text-foreground">{attribution.campaignName ?? "—"}</dd>
                      <dt className="text-muted-foreground">Ad Set</dt>
                      <dd className="text-foreground">{attribution.adSetName ?? "—"}</dd>
                      <dt className="text-muted-foreground">Ad</dt>
                      <dd className="text-foreground">{attribution.adName ?? "—"}</dd>
                      <dt className="text-muted-foreground">Lead Form</dt>
                      <dd className="text-foreground">{attribution.leadFormName ?? "—"}</dd>
                    </dl>
                  </Card>
                  <Card className="border-border bg-card/60 p-4">
                    <h3 className="text-sm font-medium text-foreground">UTM</h3>
                    <dl className="mt-3 grid grid-cols-[100px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">utm_source</dt>
                      <dd className="text-foreground">{attribution.utmSource ?? "—"}</dd>
                      <dt className="text-muted-foreground">utm_medium</dt>
                      <dd className="text-foreground">{attribution.utmMedium ?? "—"}</dd>
                      <dt className="text-muted-foreground">utm_campaign</dt>
                      <dd className="text-foreground">{attribution.utmCampaign ?? "—"}</dd>
                      <dt className="text-muted-foreground">utm_content</dt>
                      <dd className="text-foreground">{attribution.utmContent ?? "—"}</dd>
                    </dl>
                  </Card>
                  <Card className="border-border bg-card/60 p-4">
                    <h3 className="text-sm font-medium text-foreground">{t("lead.timing")}</h3>
                    <dl className="mt-3 grid grid-cols-[100px_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm">
                      <dt className="text-muted-foreground">First Touch</dt>
                      <dd className="text-foreground">
                        {attribution.firstTouchAt ? formatTimestamp(attribution.firstTouchAt) : "—"}
                      </dd>
                      <dt className="text-muted-foreground">Captured</dt>
                      <dd className="text-foreground">
                        {attribution.capturedAt ? formatTimestamp(attribution.capturedAt) : "—"}
                      </dd>
                    </dl>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Timeline */}
            <TabsContent value="timeline">
              <Card className="border-border bg-card/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">{t("lead.timeline")}</h3>
                </div>
                {timeline.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t("lead.noTimeline")}</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {[...timeline].reverse().map((event: TimelineEvent) => (
                      <li key={event.id} className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs ${eventTypeTone[event.type]}`}
                        >
                          {eventTypeGlyph[event.type]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">{event.details}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)} · {event.userName ?? "System"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="mt-4 border-t border-border/60 pt-4">
                  <p className="text-xs font-medium text-foreground">{t("lead.addNote")}</p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder={t("lead.notePlaceholder")}
                      value={newNote}
                      onChange={(event) => setNewNote(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleAddNote();
                      }}
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tab 4: Tasks */}
            <TabsContent value="tasks">
              <Card className="border-border bg-card/60 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-foreground">{t("lead.tasks")}</h3>
                </div>
                {leadTasks.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t("lead.noTasks")}</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {leadTasks.map((task: LeadTask) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task.id)}
                            className="mt-0.5 flex-shrink-0"
                            aria-label={t("lead.toggleTask")}
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                              }`}
                            >
                              <span className="mr-1.5">{taskTypeGlyph[task.type]}</span>
                              {task.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {formatTimestamp(task.dueAt)}
                              {task.assignee && ` · ${task.assignee}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${taskStatusTone[task.status]}`}>
                          {task.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 border-t border-border/60 pt-4">
                  <p className="text-xs font-medium text-foreground">{t("lead.addTask")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select
                      aria-label="Task type"
                      value={newTaskType}
                      onChange={(event) => setNewTaskType(event.target.value as LeadTaskType)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="call">📞 {t("lead.taskType.call")}</option>
                      <option value="whatsapp">💬 {t("lead.taskType.whatsapp")}</option>
                      <option value="email">✉️ {t("lead.taskType.email")}</option>
                      <option value="assessment">🏠 {t("lead.taskType.assessment")}</option>
                      <option value="proposal">📄 {t("lead.taskType.proposal")}</option>
                      <option value="follow_up">🔁 {t("lead.taskType.follow_up")}</option>
                    </select>
                    <Input
                      placeholder={t("lead.taskTitlePlaceholder")}
                      value={newTaskTitle}
                      onChange={(event) => setNewTaskTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleAddTask();
                      }}
                      className="min-w-[180px] flex-1"
                    />
                    <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                      <Plus className="h-4 w-4" />
                      {t("lead.addTask")}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tab 5: Files */}
            <TabsContent value="files">
              <Card className="border-border bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">{t("lead.files")}</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAddFile}>
                    <Plus className="h-4 w-4" />
                    {t("lead.uploadFile")}
                  </Button>
                </div>
                {leadFiles.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">{t("lead.noFiles")}</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {leadFiles.map((file: LeadFileAttachment) => (
                      <li
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {fileIcon(file.type)}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {file.type} · {formatFileSize(file.sizeKb)} · {formatTimestamp(file.uploadedAt)} · {file.uploadedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" aria-label={t("lead.download")}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFile(file.id)}
                            aria-label={t("lead.removeFile")}
                          >
                            <Trash2 className="h-4 w-4 text-red-300" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BookingModal
        lead={current}
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
      />
    </>
  );
};
