import { useState } from "react";
import { Check, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import type { PaterhausSettings } from "@/types/paterhaus";
import { SectionHeader } from "./shared";

type BooleanSettingKey =
  | "notifyReadinessRisk"
  | "notifyOwnerMessages"
  | "notifyTurnoverDelays"
  | "notifyGuestIncidents"
  | "notifyOwnerApprovals"
  | "notifyComplianceExpiries"
  | "notifyVendorSlas"
  | "notifyStatementApprovals";

const notificationRules: Array<{ label: string; key: BooleanSettingKey }> = [
  { label: "Check-in readiness risk alerts", key: "notifyReadinessRisk" },
  { label: "New owner messages", key: "notifyOwnerMessages" },
  { label: "Turnover delays", key: "notifyTurnoverDelays" },
  { label: "Guest incidents", key: "notifyGuestIncidents" },
  { label: "Owner approvals", key: "notifyOwnerApprovals" },
  { label: "Compliance expiries", key: "notifyComplianceExpiries" },
  { label: "Vendor SLA risks", key: "notifyVendorSlas" },
  { label: "Statement approvals", key: "notifyStatementApprovals" },
];

const integrations = [
  ["Airbnb", "Demo data"],
  ["Booking.com", "Demo data"],
  ["Expedia", "Coming soon"],
  ["WhatsApp Business", "Not connected"],
  ["Email", "Demo data"],
  ["Payment provider", "Coming soon"],
  ["Accounting platform", "Coming soon"],
  ["Revenue intelligence", "Coming soon"],
] as const;

export const SettingsModule = () => {
  const workspace = usePaterhausWorkspace();
  const [draft, setDraft] = useState<PaterhausSettings>(workspace.settings);
  const updateDraft = <K extends keyof PaterhausSettings>(key: K, value: PaterhausSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const updateTemplate = (index: number, value: string) => {
    const templates = draft.communicationTemplates.map((template, templateIndex) =>
      templateIndex === index ? value : template,
    );
    updateDraft("communicationTemplates", templates);
  };
  const save = () => {
    workspace.updateSettings({
      ...draft,
      expenseApprovalThreshold: Number(draft.expenseApprovalThreshold) || 0,
    });
    toast.success("Workspace settings saved locally.");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Local workspace preferences, operational defaults and explicit demo integration statuses."
      />
      <div className="flex justify-end">
        <Button type="button" onClick={save}>
          <Check className="h-4 w-4" /> Save workspace settings
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/80 p-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Workspace profile</h3>
          </div>
          <label className="mt-4 block text-xs text-muted-foreground">
            Workspace name
            <Input
              value={draft.workspaceName}
              onChange={(event) => updateDraft("workspaceName", event.target.value)}
              className="mt-1"
            />
          </label>
          <p className="mt-4 text-xs text-muted-foreground">Team roles</p>
          <div className="mt-2 space-y-2">
            {[
              "Operations Director",
              "Compliance & Onboarding Lead",
              "Guest Experience Manager",
              "Finance Coordinator",
            ].map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm text-foreground"
              >
                <span>{role}</span>
                <span className="text-xs text-emerald-300">Active</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <h3 className="font-semibold text-foreground">Approval and reminders</h3>
          <label className="mt-4 block text-xs text-muted-foreground">
            Expense approval threshold (USD)
            <Input
              type="number"
              value={draft.expenseApprovalThreshold}
              onChange={(event) => updateDraft("expenseApprovalThreshold", Number(event.target.value))}
              className="mt-1"
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Maintenance items above this threshold require owner review. Saved local threshold: ${" "}
            {workspace.settings.expenseApprovalThreshold.toLocaleString("en-GB")}.
          </p>
          <label className="mt-4 block text-xs text-muted-foreground">
            Compliance reminder windows
            <Input
              value={draft.complianceReminderWindows}
              onChange={(event) => updateDraft("complianceReminderWindows", event.target.value)}
              className="mt-1"
            />
          </label>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <h3 className="font-semibold text-foreground">Notification rules</h3>
          <div className="mt-2 space-y-2">
            {notificationRules.map((rule) => (
              <div
                key={rule.key}
                className="flex items-center justify-between rounded-lg border border-border/70 p-3 text-sm text-foreground"
              >
                <label htmlFor={rule.key}>{rule.label}</label>
                <Switch
                  id={rule.key}
                  checked={draft[rule.key]}
                  onCheckedChange={(checked) => updateDraft(rule.key, checked)}
                  aria-label={rule.label}
                />
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5">
          <h3 className="font-semibold text-foreground">Property defaults and owner reports</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Default check-in
              <Input
                value={draft.defaultCheckInTime}
                onChange={(event) => updateDraft("defaultCheckInTime", event.target.value)}
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Default check-out
              <Input
                value={draft.defaultCheckOutTime}
                onChange={(event) => updateDraft("defaultCheckOutTime", event.target.value)}
                className="mt-1"
              />
            </label>
          </div>
          <label className="mt-4 block text-xs text-muted-foreground">
            Owner report preference
            <Select
              value={draft.ownerReportDelivery}
              onValueChange={(value) => {
                if (value === "Monthly" || value === "Quarterly") updateDraft("ownerReportDelivery", value);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose report cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground">Communication templates</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit the templates used by the Conversations composer. Changes apply when workspace settings are saved.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {draft.communicationTemplates.map((template, index) => (
              <label key={`template-${index}`} className="text-xs text-muted-foreground">
                Template {index + 1}
                <Input
                  value={template}
                  onChange={(event) => updateTemplate(index, event.target.value)}
                  className="mt-1"
                />
              </label>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground">Integrations</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            These cards describe local demo data only; no live connection is implied.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map(([name, status]) => (
              <div key={name} className="rounded-lg border border-border/70 p-3">
                <p className="text-sm text-foreground">{name}</p>
                <p className="mt-2 text-xs text-muted-foreground">{status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
