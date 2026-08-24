import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardPlus,
  FileText,
  MessageCircle,
  Plus,
  Wrench,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import {
  formatUSD,
  formatPaterhausToday,
  getCheckInsToday,
  getCheckOutsToday,
  getDashboardTimeline,
  getDashboardMetrics,
  getHealthBreakdown,
  getRevenueDelta,
  getRevenueSeries,
  PATERHAUS_TODAY,
} from "@/data/paterhaus";
import { KpiCard, MetricIcon, SectionHeader, StatusPill, FeedRow } from "./shared";
import { toast } from "sonner";
import { OpsCopilot } from "./OpsCopilot";

type ActionKind = "property" | "snag" | "turnover" | "maintenance" | "conversation" | "statement" | "stay" | null;

interface ActionDraft {
  propertyId: string;
  ownerId: string;
  guestId: string;
  conversationId: string;
  vendorId: string;
  name: string;
  unitIdentifier: string;
  area: string;
  description: string;
  cost: string;
  message: string;
  checkIn: string;
  checkOut: string;
  bookingValue: string;
}

const actionTitles: Record<Exclude<ActionKind, null>, string> = {
  property: "Add Property",
  snag: "Create Snag Report",
  turnover: "Schedule Turnover",
  maintenance: "Log Maintenance Issue",
  conversation: "Start Owner Conversation",
  statement: "Create Owner Statement",
  stay: "Add Stay",
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export const PortfolioOverview = ({ onNavigate }: { onNavigate: (section: string, propertyId?: string) => void }) => {
  const workspace = usePaterhausWorkspace();
  const [actionKind, setActionKind] = useState<ActionKind>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft>({
    propertyId: workspace.properties[0]?.id ?? "",
    ownerId: workspace.owners[0]?.id ?? "",
    guestId: workspace.guests[0]?.id ?? "",
    conversationId: workspace.conversations.find((item) => item.contactType === "Owner")?.id ?? "",
    vendorId: workspace.vendors[0]?.id ?? "",
    name: "",
    unitIdentifier: "",
    area: "",
    description: "",
    cost: "250",
    message: "",
    checkIn: "2025-08-28",
    checkOut: "2025-08-31",
    bookingValue: "4200",
  });
  const metrics = useMemo(
    () =>
      getDashboardMetrics(
        workspace.properties,
        workspace.stays,
        workspace.tasks,
        workspace.compliance,
        workspace.statements,
      ),
    [workspace.properties, workspace.stays, workspace.tasks, workspace.compliance, workspace.statements],
  );
  const health = useMemo(() => getHealthBreakdown(workspace.properties), [workspace.properties]);
  const checkIns = getCheckInsToday(workspace.stays);
  const checkOuts = getCheckOutsToday(workspace.stays);
  const revenueSeries = getRevenueSeries(workspace.properties);
  const revenueDelta = getRevenueDelta(revenueSeries);
  const timeline = getDashboardTimeline(workspace.stays, workspace.tasks, workspace.compliance);
  const decisionProperties = new Set([
    ...workspace.tasks
      .filter(
        (task) =>
          task.status !== "Completed" && (task.priority === "Urgent" || task.status === "Waiting on owner approval"),
      )
      .map((task) => task.propertyId),
    ...workspace.compliance.filter((item) => item.status !== "Complete").map((item) => item.propertyId),
  ]);
  const attentionProperties = workspace.properties
    .filter((property) => property.healthScore < 80 || property.openIssueCount > 1 || property.readiness !== "Ready")
    .slice(0, 5);
  const ownerCommunications = workspace.conversations
    .filter((conversation) => conversation.contactType === "Owner")
    .slice(0, 3);
  const priorityNotifications = workspace.notifications.filter((notification) => !notification.read).slice(0, 4);
  const openAction = (kind: Exclude<ActionKind, null>) => {
    setActionKind(kind);
    setActionDraft((current) => ({
      ...current,
      propertyId: workspace.properties[0]?.id ?? current.propertyId,
      ownerId: workspace.owners[0]?.id ?? current.ownerId,
      guestId: workspace.guests[0]?.id ?? current.guestId,
      conversationId:
        workspace.conversations.find((item) => item.contactType === "Owner")?.id ?? current.conversationId,
      vendorId: workspace.vendors[0]?.id ?? current.vendorId,
      message: current.message || "I am reviewing this now and will update you shortly.",
    }));
  };
  const updateActionDraft = (field: keyof ActionDraft, value: string) => {
    setActionDraft((current) => ({ ...current, [field]: value }));
  };
  const confirmAction = () => {
    if (!actionKind) return;
    const property = workspace.properties.find((item) => item.id === actionDraft.propertyId);
    const owner = workspace.owners.find((item) => item.id === actionDraft.ownerId);
    const guest = workspace.guests.find((item) => item.id === actionDraft.guestId);
    const conversation = workspace.conversations.find((item) => item.id === actionDraft.conversationId);
    const vendor = workspace.vendors.find((item) => item.id === actionDraft.vendorId);
    if (actionKind === "property" && owner) {
      workspace.addProperty({
        name: actionDraft.name.trim() || "New Paterhaus property",
        unitIdentifier: actionDraft.unitIdentifier.trim() || "Unit pending",
        community: actionDraft.area.trim() || "Dubai",
        ownerId: owner.id,
        type: "Apartment",
      });
      toast.success("Property added to the local portfolio.");
    }
    if (actionKind === "snag" && property) {
      workspace.createSnag({
        propertyId: property.id,
        area: actionDraft.area.trim() || "General inspection",
        description: actionDraft.description.trim() || "Follow-up inspection issue recorded from the overview.",
        severity: "Medium",
        costEstimate: Number(actionDraft.cost) || 0,
        deadline: PATERHAUS_TODAY,
      });
      toast.success(`Snag recorded for ${property.name}.`);
    }
    if (actionKind === "turnover" && property) {
      workspace.createTask({
        propertyId: property.id,
        category: "Housekeeping",
        title: "Schedule turnover workflow",
        description: "Cleaning, linen verification, inspection and readiness approval.",
        priority: "High",
        dueAt: `${PATERHAUS_TODAY}T16:00:00`,
        vendorId: vendor?.id,
        assignee: "Maya Fernandes",
      });
      toast.success(`Turnover task created for ${property.name}.`);
    }
    if (actionKind === "maintenance" && property) {
      workspace.createTask({
        propertyId: property.id,
        category: "Maintenance",
        title: "Log maintenance issue",
        description: actionDraft.description.trim() || "Maintenance follow-up created from the overview.",
        priority: "Medium",
        dueAt: `${PATERHAUS_TODAY}T17:00:00`,
        vendorId: vendor?.id,
        costEstimate: Number(actionDraft.cost) || 0,
        assignee: "Faisal Nadeem",
      });
      toast.success(`Maintenance task created for ${property.name}.`);
    }
    if (actionKind === "conversation" && conversation) {
      workspace.sendMessage(conversation.id, actionDraft.message.trim());
      toast.success(`Message sent to ${conversation.contactName}.`);
    }
    if (actionKind === "statement" && property) {
      workspace.createOwnerStatement(property.id);
      toast.success(`Draft statement created for ${property.name}.`);
    }
    if (actionKind === "stay" && property && guest) {
      workspace.addStay({
        propertyId: property.id,
        guestId: guest.id,
        checkIn: actionDraft.checkIn,
        checkOut: actionDraft.checkOut,
        bookingValue: Number(actionDraft.bookingValue) || 0,
      });
      toast.success(`Stay added for ${guest.name} at ${property.name}.`);
    }
    setActionKind(null);
  };
  const quickActions = [
    {
      label: "Add Property",
      icon: Plus,
      onClick: () => openAction("property"),
    },
    {
      label: "Create Snag Report",
      icon: ClipboardPlus,
      onClick: () => openAction("snag"),
    },
    {
      label: "Schedule Turnover",
      icon: CalendarClock,
      onClick: () => openAction("turnover"),
    },
    {
      label: "Log Maintenance Issue",
      icon: Wrench,
      onClick: () => openAction("maintenance"),
    },
    {
      label: "Start Owner Conversation",
      icon: MessageCircle,
      onClick: () => openAction("conversation"),
    },
    {
      label: "Create Owner Statement",
      icon: FileText,
      onClick: () => openAction("statement"),
    },
    {
      label: "Add Stay",
      icon: CircleDollarSign,
      onClick: () => openAction("stay"),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={formatPaterhausToday()}
        title="Portfolio Overview"
        description="A live local view of readiness, guest movement, owner exposure and the work that needs attention today."
        action={
          <div className="flex flex-wrap gap-2">
            <OpsCopilot onOpenProperty={(propertyId) => onNavigate("properties", propertyId)} />
            <Button variant="outline" onClick={() => onNavigate("properties")}>
              <ArrowRight className="h-4 w-4" />
              Open properties
            </Button>
          </div>
        }
      />

      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-foreground">Today at Paterhaus</p>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">Demo workspace</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: `${workspace.marketingLeads.filter((lead) => lead.status === "new").length} new leads need first response`, section: "marketing" },
            { label: "2 property inspections scheduled", section: "calendar" },
            { label: `${workspace.tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length} urgent maintenance task${workspace.tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length === 1 ? "" : "s"}`, section: "operations" },
            { label: `${workspace.files.filter((file) => file.reviewStatus === "needs_review").length} files need review`, section: "files" },
            { label: "2 follow-ups overdue", section: "pipeline" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.section)}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              <span className="min-w-0 flex-1">{item.label}</span>
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Active Properties"
          value={`${metrics.activeProperties}`}
          detail={`${workspace.properties.length} total in workspace`}
          tone="good"
          icon={<MetricIcon kind="check" />}
        />
        <KpiCard
          label="Occupied Tonight"
          value={`${metrics.occupiedTonight}`}
          detail={`${metrics.activeProperties - metrics.occupiedTonight} available or blocked`}
          tone="info"
          icon={<MetricIcon kind="up" />}
        />
        <KpiCard
          label="Check-ins Today"
          value={`${metrics.checkInsToday}`}
          detail={`${checkIns.filter((stay) => stay.checkInStatus === "Ready").length} readiness-approved`}
          tone="info"
          icon={<MetricIcon kind="clock" />}
        />
        <KpiCard
          label="Check-outs Today"
          value={`${metrics.checkOutsToday}`}
          detail="Turnover windows created"
          tone="warning"
          icon={<MetricIcon kind="clock" />}
        />
        <KpiCard
          label="Occupancy Rate"
          value={`${metrics.occupancyRate}%`}
          detail="Portfolio average"
          tone="good"
          icon={<MetricIcon kind="up" />}
        />
        <KpiCard
          label="MTD Revenue"
          value={formatUSD(metrics.monthToDateRevenue)}
          detail={`${Math.round((metrics.monthToDateRevenue / metrics.revenueTarget) * 100)}% of target`}
          tone="good"
          icon={<MetricIcon kind="up" />}
        />
        <KpiCard
          label="Net Payouts Due"
          value={formatUSD(metrics.netOwnerPayoutsDue)}
          detail="September run · 5 Sep"
          tone="neutral"
          icon={<MetricIcon kind="flat" />}
        />
        <KpiCard
          label="Open Issues"
          value={`${metrics.openOperationalIssues}`}
          detail={`${metrics.overdueTasks} overdue task${metrics.overdueTasks === 1 ? "" : "s"}`}
          tone="critical"
          icon={<MetricIcon kind="alert" />}
        />
        <KpiCard
          label="Critical Compliance"
          value={`${metrics.criticalComplianceItems}`}
          detail="Due soon or missing documents"
          tone="warning"
          icon={<MetricIcon kind="alert" />}
        />
        <KpiCard
          label="Not Listing-Ready"
          value={`${metrics.notListingReady}`}
          detail="Needs setup or documentation"
          tone="critical"
          icon={<MetricIcon kind="alert" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Revenue vs target</h3>
              <p className="mt-1 text-sm text-muted-foreground">Weekly portfolio performance · USD</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">{formatUSD(metrics.monthToDateRevenue)}</p>
              <p className={revenueDelta >= 0 ? "text-xs text-emerald-300" : "text-xs text-red-300"}>
                {revenueDelta >= 0 ? "+" : ""}
                {revenueDelta.toFixed(1)}% vs previous period
              </p>
            </div>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="paterhausRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatUSD(value),
                    name === "target" ? "Target" : "Revenue",
                  ]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  fill="none"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#paterhausRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Revenue
            </span>
            <span className="flex items-center gap-2">
              <span className="h-px w-4 border-t border-dashed border-muted-foreground" />
              Target
            </span>
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Portfolio health</h3>
              <p className="mt-1 text-sm text-muted-foreground">Current operating state by property</p>
            </div>
            <StatusPill status={`${workspace.properties.length} assets`} />
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["Ready", "emerald"],
              ["Occupied", "blue"],
              ["Turnover in progress", "amber"],
              ["Maintenance required", "red"],
              ["Compliance risk", "amber"],
              ["Off market", "slate"],
            ].map(([label, tone]) => {
              const count = health[label] ?? 0;
              const toneClass =
                tone === "emerald"
                  ? "bg-emerald-400"
                  : tone === "blue"
                    ? "bg-blue-400"
                    : tone === "red"
                      ? "bg-red-400"
                      : tone === "amber"
                        ? "bg-amber-400"
                        : "bg-slate-500";
              return (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${toneClass}`} />
                  <span className="flex-1 text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{count}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${toneClass}`}
                      style={{ width: `${(count / workspace.properties.length) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
            {decisionProperties.size} {decisionProperties.size === 1 ? "property needs" : "properties need"} a decision
            today based on open urgent work, approvals and compliance risk.
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Priority feed</h3>
              <p className="mt-1 text-sm text-muted-foreground">Unread events requiring an operational decision</p>
            </div>
            <StatusPill status={`${priorityNotifications.length} unread`} />
          </div>
          <div className="mt-3 divide-y divide-border/60">
            {priorityNotifications.map((notification) => (
              <FeedRow
                key={notification.id}
                title={notification.title}
                description={notification.description}
                meta={formatTime(notification.createdAt)}
                status={notification.priority}
                onClick={() => workspace.markNotificationRead(notification.id)}
              />
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Today's critical timeline</h3>
              <p className="mt-1 text-sm text-muted-foreground">Guest movement and operational hand-offs</p>
            </div>
            <StatusPill status={PATERHAUS_TODAY} />
          </div>
          <div className="mt-4 space-y-3">
            {timeline.map((event) => (
              <div key={`${event.time}-${event.title}`} className="flex items-start gap-3">
                <div className="w-12 pt-1 text-xs font-medium text-muted-foreground">{event.time}</div>
                <div className="relative flex-1 rounded-xl border border-border/70 bg-background/30 p-3">
                  <span className="absolute -left-[22px] top-4 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                  <StatusPill status={event.tone} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Properties requiring attention</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("properties")}>
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {attentionProperties.map((property) => (
              <button
                key={property.id}
                type="button"
                onClick={() => onNavigate("properties", property.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left hover:border-border hover:bg-secondary/30"
              >
                <span className="h-8 w-8 rounded-lg bg-primary/10 p-2 text-primary">
                  <CircleDollarSign className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{property.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {property.community} · {property.openIssueCount} open issue
                    {property.openIssueCount === 1 ? "" : "s"}
                  </span>
                </span>
                <StatusPill status={property.status} />
              </button>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <h3 className="font-semibold text-foreground">Recent owner communications</h3>
          <div className="mt-3 space-y-3">
            {ownerCommunications.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() =>
                  workspace.sendMessage(conversation.id, "I am reviewing this now and will update you shortly.")
                }
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="rounded-lg bg-secondary p-2 text-primary">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{conversation.contactName}</span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {conversation.subject}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <h3 className="font-semibold text-foreground">Financial events</h3>
          <div className="mt-3 space-y-3">
            {workspace.statements
              .filter((statement) => statement.status === "Awaiting approval" || statement.status === "Exception")
              .slice(0, 3)
              .map((statement) => (
                <div key={statement.id} className="flex items-start gap-3">
                  <span className="rounded-lg bg-amber-500/10 p-2 text-amber-300">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{statement.period} statement</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatUSD(statement.netPayout)} net payout · {statement.status}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Quick actions</h3>
              <p className="mt-1 text-sm text-muted-foreground">Every action updates the local workspace state.</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(({ label, icon: Icon, onClick }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                className="h-auto justify-start px-3 py-3 text-left text-xs"
                onClick={onClick}
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </Button>
            ))}
          </div>
        </Card>
      <Dialog open={actionKind !== null} onOpenChange={(open) => !open && setActionKind(null)}>
        <DialogContent className="dark max-w-lg border-border bg-background">
          <DialogHeader>
            <DialogTitle>{actionKind ? actionTitles[actionKind] : "Confirm action"}</DialogTitle>
            <DialogDescription>
              Choose the related workspace records before applying this local demo action.
            </DialogDescription>
          </DialogHeader>
          {actionKind && (
            <div className="space-y-4">
              {actionKind === "property" && (
                <>
                  <label className="block text-sm text-foreground">
                    Property name
                    <input
                      value={actionDraft.name}
                      onChange={(event) => updateActionDraft("name", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      placeholder="Harbour View 408"
                    />
                  </label>
                  <label className="block text-sm text-foreground">
                    Unit identifier
                    <input
                      value={actionDraft.unitIdentifier}
                      onChange={(event) => updateActionDraft("unitIdentifier", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      placeholder="Unit 408"
                    />
                  </label>
                  <label className="block text-sm text-foreground">
                    Community / area
                    <input
                      value={actionDraft.area}
                      onChange={(event) => updateActionDraft("area", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      placeholder="Dubai Creek Harbour"
                    />
                  </label>
                  <label className="block text-sm text-foreground">
                    Owner
                    <select
                      value={actionDraft.ownerId}
                      onChange={(event) => updateActionDraft("ownerId", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    >
                      {workspace.owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {actionKind !== "property" && actionKind !== "conversation" && (
                <label className="block text-sm text-foreground">
                  Property
                  <select
                    value={actionDraft.propertyId}
                    onChange={(event) => updateActionDraft("propertyId", event.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                  >
                    {workspace.properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} · {property.community}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {(actionKind === "turnover" || actionKind === "maintenance") && (
                <>
                  <label className="block text-sm text-foreground">
                    Vendor
                    <select
                      value={actionDraft.vendorId}
                      onChange={(event) => updateActionDraft("vendorId", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    >
                      {workspace.vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-foreground">
                    {actionKind === "maintenance" ? "Issue description" : "Turnover note"}
                    <textarea
                      value={actionDraft.description}
                      onChange={(event) => updateActionDraft("description", event.target.value)}
                      className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </label>
                  {actionKind === "maintenance" && (
                    <label className="block text-sm text-foreground">
                      Cost estimate (USD)
                      <input
                        type="number"
                        min="0"
                        value={actionDraft.cost}
                        onChange={(event) => updateActionDraft("cost", event.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      />
                    </label>
                  )}
                </>
              )}
              {actionKind === "snag" && (
                <>
                  <label className="block text-sm text-foreground">
                    Area
                    <input
                      value={actionDraft.area}
                      onChange={(event) => updateActionDraft("area", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    />
                  </label>
                  <label className="block text-sm text-foreground">
                    Description
                    <textarea
                      value={actionDraft.description}
                      onChange={(event) => updateActionDraft("description", event.target.value)}
                      className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-foreground">
                    Cost estimate (USD)
                    <input
                      type="number"
                      min="0"
                      value={actionDraft.cost}
                      onChange={(event) => updateActionDraft("cost", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    />
                  </label>
                </>
              )}
              {actionKind === "conversation" && (
                <>
                  <label className="block text-sm text-foreground">
                    Owner conversation
                    <select
                      value={actionDraft.conversationId}
                      onChange={(event) => updateActionDraft("conversationId", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    >
                      {workspace.conversations
                        .filter((conversation) => conversation.contactType === "Owner")
                        .map((conversation) => (
                          <option key={conversation.id} value={conversation.id}>
                            {conversation.contactName} · {conversation.subject}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="block text-sm text-foreground">
                    Message
                    <textarea
                      value={actionDraft.message}
                      onChange={(event) => updateActionDraft("message", event.target.value)}
                      className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </label>
                </>
              )}
              {actionKind === "stay" && (
                <>
                  <label className="block text-sm text-foreground">
                    Guest
                    <select
                      value={actionDraft.guestId}
                      onChange={(event) => updateActionDraft("guestId", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    >
                      {workspace.guests.map((guest) => (
                        <option key={guest.id} value={guest.id}>
                          {guest.name} · {guest.nationality}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-foreground">
                      Check-in
                      <input
                        type="date"
                        value={actionDraft.checkIn}
                        onChange={(event) => updateActionDraft("checkIn", event.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      />
                    </label>
                    <label className="block text-sm text-foreground">
                      Check-out
                      <input
                        type="date"
                        value={actionDraft.checkOut}
                        onChange={(event) => updateActionDraft("checkOut", event.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                      />
                    </label>
                  </div>
                  <label className="block text-sm text-foreground">
                    Booking value (USD)
                    <input
                      type="number"
                      min="0"
                      value={actionDraft.bookingValue}
                      onChange={(event) => updateActionDraft("bookingValue", event.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
                    />
                  </label>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionKind(null)}>
              Cancel
            </Button>
            <Button onClick={confirmAction}>Confirm local action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
