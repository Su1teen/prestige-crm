import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPlus, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { PATERHAUS_TODAY } from "@/data/paterhaus";
import { SectionHeader, StatusPill } from "./shared";

const daysBetween = (first: string, second: string) =>
  Math.round((new Date(`${first}T00:00:00Z`).getTime() - new Date(`${second}T00:00:00Z`).getTime()) / 86400000);

export const ComplianceModule = () => {
  const workspace = usePaterhausWorkspace();
  const buckets = useMemo(
    () => ({
      critical: workspace.compliance.filter((item) => item.risk === "High" || item.risk === "Critical"),
      due7: workspace.compliance.filter((item) => {
        const days = daysBetween(item.expiryDate, PATERHAUS_TODAY);
        return days >= 0 && days <= 7 && item.status !== "Complete";
      }),
      due30: workspace.compliance.filter((item) => {
        const days = daysBetween(item.expiryDate, PATERHAUS_TODAY);
        return days > 7 && days <= 30 && item.status !== "Complete";
      }),
      due60: workspace.compliance.filter((item) => {
        const days = daysBetween(item.expiryDate, PATERHAUS_TODAY);
        return days > 30 && days <= 60 && item.status !== "Complete";
      }),
      expired: workspace.compliance.filter((item) => daysBetween(item.expiryDate, PATERHAUS_TODAY) < 0),
      complete: workspace.compliance.filter((item) => item.status === "Complete"),
      missing: workspace.compliance.filter((item) => item.status === "Missing documents"),
    }),
    [workspace.compliance],
  );
  const createFollowUp = (itemId: string) => {
    const item = workspace.compliance.find((compliance) => compliance.id === itemId);
    if (!item) return;
    workspace.createTask({
      propertyId: item.propertyId,
      title: `Compliance follow-up: ${item.title}`,
      description: item.documentName ?? "Collect or review the required compliance document.",
      category: "Compliance",
      priority: item.risk === "High" || item.risk === "Critical" ? "Urgent" : "High",
      dueAt: item.dueAt,
      assignee: item.assignedTo,
      complianceItemId: item.id,
    });
    toast.success(`Follow-up task created for ${item.title}.`);
  };
  const renderBucket = (title: string, items: typeof workspace.compliance, icon: typeof AlertTriangle) => {
    const Icon = icon;
    return (
      <Card className="border-border/80 bg-card/80 p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
        </div>
        <div className="mt-3 space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {workspace.properties.find((property) => property.id === item.propertyId)?.name} · {item.assignedTo}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
              {item.documentName ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.documentName} · expires {item.expiryDate}
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-200">Missing document</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => createFollowUp(item.id)}
              >
                <ClipboardPlus className="h-4 w-4" /> Open / create follow-up
              </Button>
            </div>
          ))}
        </div>
      </Card>
    );
  };
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operational compliance"
        title="Compliance"
        description="Track documents, licences, verification and inspection follow-ups across the managed portfolio."
      />
      <Card className="border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        This workspace tracks operational compliance tasks and documentation. It does not replace legal or regulatory
        advice.
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {renderBucket("Critical items", buckets.critical, AlertTriangle)}
        {renderBucket("Due in 7 days", buckets.due7, AlertTriangle)}
        {renderBucket("Due in 30 days", buckets.due30, FileWarning)}
        {renderBucket("Due in 60 days", buckets.due60, FileWarning)}
        {renderBucket("Expired", buckets.expired, AlertTriangle)}
        {renderBucket("Complete", buckets.complete, CheckCircle2)}
        {renderBucket("Missing documents", buckets.missing, FileWarning)}
      </div>
      <Card className="border-border/80 bg-card/80 p-4">
        <h3 className="font-semibold text-foreground">Compliance tracker</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Property</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {workspace.compliance.map((item) => (
                <tr key={item.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-3 text-foreground">
                    {item.title}
                    <span className="block text-xs text-muted-foreground">
                      {item.documentName ?? "No document linked"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{item.type}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {workspace.properties.find((property) => property.id === item.propertyId)?.name}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={item.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Button type="button" variant="ghost" size="sm" onClick={() => createFollowUp(item.id)}>
                      Follow up
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
