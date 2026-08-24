import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardPlus, MessageSquareText, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { CURRENT_PATERHAUS_USER, formatUSD, PATERHAUS_TODAY } from "@/data/paterhaus";
import type { TaskCategory } from "@/types/paterhaus";

interface CopilotProps {
  propertyId?: string;
  conversationId?: string;
  onOpenProperty?: (propertyId: string) => void;
  onDraftReply?: (text: string) => void;
}

type CopilotAction = "task" | "conversation-task" | "property" | "reply" | null;

interface CopilotResponse {
  title: string;
  blocks: Array<{ label: string; value: string }>;
  source: string;
  action: CopilotAction;
  targetPropertyId?: string;
}

const suggestions = [
  "Summarise today's operational risks",
  "Which properties are not ready for check-in?",
  "Prepare a response to the owner about the maintenance cost",
  "List overdue snagging tasks",
  "Draft an owner update for Marina Vista 2204",
  "Summarise the guest incident",
  "Create a turnover checklist",
  "Prepare the weekly owner update",
  "Which compliance items expire within 30 days?",
  "Explain the revenue variance",
  "Draft a vendor follow-up",
  "Recommend actions for a low-occupancy property",
  "Create a task from this conversation",
];

export const OpsCopilot = ({ propertyId, conversationId, onOpenProperty, onDraftReply }: CopilotProps) => {
  const workspace = usePaterhausWorkspace();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<CopilotAction>(null);
  const property = workspace.properties.find((item) => item.id === propertyId);
  const conversation = workspace.conversations.find((item) => item.id === conversationId);
  const contextLabel = property?.name ?? conversation?.subject ?? "Portfolio overview";
  const contextTasks = property
    ? workspace.tasks.filter((task) => task.propertyId === property.id && task.status !== "Completed")
    : workspace.tasks.filter((task) => task.status !== "Completed");
  const contextStays = property
    ? workspace.stays.filter((stay) => stay.propertyId === property.id && stay.checkOut >= PATERHAUS_TODAY)
    : workspace.stays.filter((stay) => stay.checkIn >= PATERHAUS_TODAY);

  const defaultResponse = useMemo<CopilotResponse>(
    () => ({
      title: "Today's operational risk summary",
      blocks: [
        {
          label: "Priority",
          value: `${workspace.tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length} urgent tasks require review.`,
        },
        {
          label: "Readiness",
          value: `${workspace.properties.filter((item) => item.readiness !== "Ready").length} properties are not fully ready.`,
        },
        {
          label: "Compliance",
          value: `${workspace.compliance.filter((item) => item.status !== "Complete").length} compliance items remain open.`,
        },
      ],
      source: `Based on ${contextTasks.length} open tasks, ${contextStays.length} upcoming stays and the current property calendar.`,
      action: null,
    }),
    [contextStays.length, contextTasks.length, workspace.compliance, workspace.properties, workspace.tasks],
  );

  const runPrompt = (value: string) => {
    const normalized = value.toLowerCase();
    if (!normalized.trim()) {
      setResponse(defaultResponse);
      return;
    }
    const maintenance = workspace.maintenance.find((item) => item.ownerApprovalRequired) ?? workspace.maintenance[0];
    const maintenanceProperty = workspace.properties.find((item) => item.id === maintenance?.propertyId);
    const incidentStay = workspace.stays.find((stay) => stay.lifecycle === "Incident");
    const incidentGuest = workspace.guests.find((guest) => guest.id === incidentStay?.guestId);
    const incidentProperty = workspace.properties.find((item) => item.id === incidentStay?.propertyId);
    const incidentConversation = workspace.conversations.find(
      (item) => item.stayId === incidentStay?.id && item.contactType === "Guest",
    );
    const lowOccupancy = [...workspace.properties].sort(
      (first, second) => first.occupancyRate - second.occupancyRate,
    )[0];
    const lowOccupancyTasks = workspace.tasks.filter(
      (task) => task.propertyId === lowOccupancy?.id && task.status !== "Completed",
    );
    const expiringCompliance = workspace.compliance.filter((item) => item.status === "Due soon");
    const vendorTask = workspace.tasks.find((task) => task.vendorId && task.status !== "Completed");
    const vendor = workspace.vendors.find((item) => item.id === vendorTask?.vendorId);
    const owner = workspace.owners.find((item) => item.id === maintenanceProperty?.ownerId);

    if (normalized.includes("maintenance") || normalized.includes("cost")) {
      const draft = `Hello ${owner?.name ?? "Owner"},\n\n${maintenanceProperty?.name ?? "The property"} requires ${
        maintenance ? formatUSD(maintenance.cost) : "non-routine"
      } maintenance work for ${maintenance?.title ?? "the reported issue"}. We recommend approval to protect the next stay.\n\n${CURRENT_PATERHAUS_USER.name}`;
      setResponse({
        title: "Owner maintenance-cost draft",
        blocks: [
          { label: "Issue", value: maintenance?.title ?? "Maintenance review" },
          { label: "Estimated cost", value: maintenance ? formatUSD(maintenance.cost) : "Not estimated" },
          { label: "Related task", value: contextTasks[0]?.title ?? "Owner approval follow-up" },
          { label: "Draft reply", value: draft },
        ],
        source: `Based on ${contextTasks.length} open tasks, ${contextStays.length} upcoming stays and the current property calendar.`,
        action: onDraftReply ? "reply" : "task",
        targetPropertyId: maintenanceProperty?.id,
      });
      return;
    }
    if (normalized.includes("not ready") || normalized.includes("check-in")) {
      const notReady = workspace.properties.filter((item) => item.readiness !== "Ready");
      setResponse({
        title: "Check-in readiness review",
        blocks: notReady.slice(0, 4).map((item) => ({
          label: item.name,
          value: `${item.readiness} · ${item.openIssueCount} open issue${item.openIssueCount === 1 ? "" : "s"}`,
        })),
        source: `Based on ${notReady.length} properties with readiness risk and ${contextTasks.length} open operational tasks.`,
        action: notReady[0] ? "property" : null,
        targetPropertyId: notReady[0]?.id,
      });
      return;
    }
    if (normalized.includes("snag")) {
      const overdue = workspace.tasks.filter(
        (task) =>
          task.category === "Snagging" && task.status !== "Completed" && task.dueAt.slice(0, 10) < PATERHAUS_TODAY,
      );
      setResponse({
        title: "Overdue snagging tasks",
        blocks: overdue
          .slice(0, 5)
          .map((task) => ({ label: task.title, value: `${task.propertyId} · due ${task.dueAt}` })),
        source: `Based on ${overdue.length} overdue snagging tasks in the local operations board.`,
        action: overdue[0] ? "task" : null,
        targetPropertyId: overdue[0]?.propertyId,
      });
      return;
    }
    if (normalized.includes("incident")) {
      setResponse({
        title: "Guest incident summary",
        blocks: [
          {
            label: "Guest and stay",
            value: `${incidentGuest?.name ?? "Guest"} · ${incidentStay?.reservationId ?? "Incident stay"}`,
          },
          { label: "Property", value: incidentProperty?.name ?? "Linked property unavailable" },
          {
            label: "Operational consequence",
            value: `${incidentConversation?.subject ?? "Guest incident"} is linked to an urgent follow-up task.`,
          },
        ],
        source: `Based on ${incidentStay ? "the incident stay, linked conversation and " : ""}${contextTasks.length} open local tasks.`,
        action: incidentProperty ? "property" : null,
        targetPropertyId: incidentProperty?.id,
      });
      return;
    }
    if (normalized.includes("turnover")) {
      const turnoverTasks = workspace.tasks.filter(
        (task) =>
          task.category === "Housekeeping" || task.category === "Laundry" || task.category === "Check-out inspection",
      );
      setResponse({
        title: "Turnover checklist",
        blocks: turnoverTasks
          .slice(0, 6)
          .map((task) => ({ label: task.category, value: `${task.title} · ${task.status}` })),
        source: `Based on ${turnoverTasks.length} housekeeping, linen and inspection tasks due across the local turnover chain.`,
        action: "task",
        targetPropertyId: turnoverTasks[0]?.propertyId,
      });
      return;
    }
    if (normalized.includes("weekly") || normalized.includes("owner update") || normalized.includes("draft an owner")) {
      const ownerProperty = property ?? workspace.properties[0];
      const ownerName = workspace.owners.find((item) => item.id === ownerProperty?.ownerId)?.name ?? "Owner";
      setResponse({
        title: "Weekly owner update",
        blocks: [
          { label: "Recipient", value: ownerName },
          {
            label: "Portfolio note",
            value: `${ownerProperty?.name ?? "Portfolio"} has ${contextTasks.length} open operational tasks.`,
          },
          {
            label: "Update draft",
            value: `Weekly update: readiness, upcoming stays and open actions for ${ownerProperty?.name ?? "your portfolio"} are being actively managed.`,
          },
        ],
        source: `Based on ${contextTasks.length} open tasks, ${contextStays.length} upcoming stays and current local owner activity.`,
        action: onDraftReply ? "reply" : null,
        targetPropertyId: ownerProperty?.id,
      });
      return;
    }
    if (normalized.includes("compliance") && (normalized.includes("30") || normalized.includes("expir"))) {
      setResponse({
        title: "Compliance expiring within 30 days",
        blocks: expiringCompliance.map((item) => ({ label: item.title, value: `${item.expiryDate} · ${item.status}` })),
        source: `Based on ${expiringCompliance.length} local compliance records in the due-soon renewal window.`,
        action: expiringCompliance[0] ? "task" : null,
        targetPropertyId: expiringCompliance[0]?.propertyId,
      });
      return;
    }
    if (normalized.includes("variance") || normalized.includes("revenue")) {
      const revenueChange = workspace.properties.reduce(
        (sum, item) => sum + item.monthlyRevenue - item.revenueTarget,
        0,
      );
      setResponse({
        title: "Revenue variance explanation",
        blocks: [
          { label: "Portfolio variance", value: formatUSD(revenueChange) },
          {
            label: "Read-through",
            value:
              revenueChange >= 0
                ? "Revenue is ahead of target."
                : "Revenue is below target and needs occupancy or pricing attention.",
          },
          {
            label: "Suggested focus",
            value: `${lowOccupancy?.name ?? "Lowest-occupancy property"} · ${lowOccupancy?.occupancyRate ?? 0}% occupancy`,
          },
        ],
        source: `Based on ${workspace.properties.length} property revenue targets and current local occupancy records.`,
        action: lowOccupancy ? "property" : null,
        targetPropertyId: lowOccupancy?.id,
      });
      return;
    }
    if (normalized.includes("vendor")) {
      setResponse({
        title: "Vendor follow-up draft",
        blocks: [
          { label: "Vendor", value: vendor?.name ?? "Assigned vendor" },
          { label: "Open work", value: vendorTask?.title ?? "No open vendor task found" },
          {
            label: "Draft follow-up",
            value: `Please confirm the completion time and upload proof for ${vendorTask?.title ?? "the open task"}.`,
          },
        ],
        source: `Based on ${vendorTask ? "the open vendor task, SLA context and " : ""}${contextTasks.length} local open tasks.`,
        action: onDraftReply ? "reply" : "task",
        targetPropertyId: vendorTask?.propertyId,
      });
      return;
    }
    if (normalized.includes("low-occupancy") || normalized.includes("low occupancy")) {
      setResponse({
        title: "Low-occupancy property action plan",
        blocks: [
          { label: "Property", value: lowOccupancy?.name ?? "No low-occupancy property found" },
          { label: "Current occupancy", value: `${lowOccupancy?.occupancyRate ?? 0}%` },
          {
            label: "Recommended actions",
            value: `Review listing readiness, pricing and ${lowOccupancyTasks.length} open operational tasks.`,
          },
        ],
        source: `Based on the lowest occupancy rate in ${workspace.properties.length} local property records and linked open tasks.`,
        action: lowOccupancy ? "property" : null,
        targetPropertyId: lowOccupancy?.id,
      });
      return;
    }
    if (normalized.includes("task") && conversationId) {
      setResponse({
        title: "Conversation follow-up task",
        blocks: [
          { label: "Conversation", value: conversation?.subject ?? "Selected conversation" },
          { label: "Task context", value: conversation?.summary ?? "Follow-up created from conversation context." },
          { label: "Linked property", value: property?.name ?? "Portfolio context" },
        ],
        source: `Based on the selected conversation, its linked property and ${contextTasks.length} open tasks.`,
        action: "conversation-task",
        targetPropertyId: property?.id,
      });
      return;
    }
    setResponse(defaultResponse);
  };

  const performAction = () => {
    if (!response || !confirmAction) return;
    const target = response.targetPropertyId
      ? workspace.properties.find((item) => item.id === response.targetPropertyId)
      : undefined;
    if (confirmAction === "task" && target) {
      workspace.createTask({
        propertyId: target.id,
        title: `Copilot follow-up: ${response.title}`,
        description: response.blocks.map((block) => `${block.label}: ${block.value}`).join(" · "),
        category: "Owner request" satisfies TaskCategory,
        priority: "High",
        dueAt: `${PATERHAUS_TODAY}T17:00:00`,
        ownerId: target.ownerId,
      });
      toast.success(`Task created for ${target.name} in the local Operations Board.`);
    }
    if (confirmAction === "conversation-task" && conversationId) {
      workspace.createTaskFromConversation(conversationId);
      toast.success("Task created from the selected conversation.");
    }
    if (confirmAction === "property" && target) {
      onOpenProperty?.(target.id);
      toast.success(`Opened ${target.name}.`);
    }
    if (confirmAction === "reply" && onDraftReply) {
      const draft = response.blocks.find(
        (block) => block.label === "Draft reply" || block.label === "Update draft",
      )?.value;
      if (draft) {
        onDraftReply(draft);
        toast.success("AI draft placed into the conversation composer. It has not been sent.");
      }
    }
    setConfirmAction(null);
  };

  const confirmationTarget = response?.targetPropertyId
    ? workspace.properties.find((item) => item.id === response.targetPropertyId)?.name
    : conversation?.subject;

  const visibleSuggestions = conversationId
    ? ["Summarise the guest incident", "Prepare a response to the owner about the maintenance cost", "Create a task from this conversation", "Draft a vendor follow-up"]
    : propertyId
      ? ["Prepare the weekly owner update", "Which properties are not ready for check-in?", "List overdue snagging tasks", "Explain the revenue variance"]
      : suggestions.slice(0, 6);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" /> Ops Copilot
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Ops Copilot</SheetTitle>
            <SheetDescription>Current context: {contextLabel}</SheetDescription>
          </SheetHeader>
          <Card className="mt-6 border-primary/25 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary/15 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Paterhaus Ops Copilot</p>
          <h3 className="mt-1 font-semibold text-foreground">Operational support, on demand</h3>
          <p className="mt-1 text-xs text-muted-foreground">Analysing: {contextLabel}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPrompt(suggestion);
              runPrompt(suggestion);
            }}
          >
            {suggestion}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          aria-label="Ask Paterhaus Ops Copilot"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && runPrompt(prompt)}
          placeholder="Ask about a property, stay, task or owner update"
        />
        <Button type="button" onClick={() => runPrompt(prompt)}>
          Analyse
        </Button>
      </div>
      {response && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-background/60 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <p className="font-medium text-foreground">{response.title}</p>
          </div>
          <div className="mt-3 space-y-2">
            {response.blocks.map((block) => (
              <div key={block.label} className="rounded-lg border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{block.label}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{block.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{response.source}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {response.action === "task" && (
              <Button
                type="button"
                size="sm"
                disabled={!response.targetPropertyId}
                onClick={() => setConfirmAction("task")}
              >
                <ClipboardPlus className="h-4 w-4" /> Create task
              </Button>
            )}
            {response.action === "conversation-task" && (
              <Button type="button" size="sm" onClick={() => setConfirmAction("conversation-task")}>
                <ClipboardPlus className="h-4 w-4" /> Create task from conversation
              </Button>
            )}
            {response.action === "property" && response.targetPropertyId && (
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmAction("property")}>
                <ArrowRight className="h-4 w-4" /> Open property
              </Button>
            )}
            {response.action === "reply" && (
              <Button type="button" size="sm" onClick={() => setConfirmAction("reply")}>
                <MessageSquareText className="h-4 w-4" /> Draft reply
              </Button>
            )}
          </div>
        </div>
      )}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>Confirm Copilot action</DialogTitle>
            <DialogDescription>
              {confirmAction === "property"
                ? `Open ${confirmationTarget ?? "the selected property"}?`
                : confirmAction === "reply"
                  ? `Place the draft for ${confirmationTarget ?? "this context"} into the composer?`
                  : `Create a local task for ${confirmationTarget ?? "the selected conversation"}?`}{" "}
              This does not send messages or call external services.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={performAction}>
              Confirm local action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </Card>
        </SheetContent>
      </Sheet>
    </>
  );
};
