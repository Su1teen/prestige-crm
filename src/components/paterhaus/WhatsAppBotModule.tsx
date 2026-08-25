import { useMemo, useState } from "react";
import { Bot, MessageCircle, Phone, Plus, Send, Sparkles, UserRound } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace, type NewOpportunityInput } from "@/contexts/PaterhausWorkspaceContext";
import {
  demoWhatsAppLeads,
  firstResponseTemplates,
  routeWhatsAppLead,
  whatsappIntentLabelKey,
  type WhatsAppIntent,
  type WhatsAppLead,
} from "@/data/paterhaus/marketing";
import { CURRENT_PATERHAUS_USER, PATERHAUS_TODAY } from "@/data/paterhaus";
import {
  DIRECTIONS,
  directionDefaultLabel,
  directionLabelKey,
  FIRST_RESPONSE_SLA_MINUTES,
  formatMinutes,
  slaStatusGlyph,
  slaStatusKey,
  slaStatusTone,
  type Direction,
} from "./p0Shared";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

const intents: WhatsAppIntent[] = ["owner_lead", "owner_issue", "guest_issue", "vendor"];

const formatWaTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

const LeadDetail = ({
  lead,
  open,
  onOpenChange,
}: {
  lead: WhatsAppLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useLanguage();
  if (!lead) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary">{t("wa.title")}</p>
              <SheetTitle className="mt-1 text-2xl">{lead.contactName}</SheetTitle>
              <SheetDescription>
                {lead.phoneNumber} · {t(whatsappIntentLabelKey[lead.intent])}
              </SheetDescription>
            </div>
            <StatusPill status={t(directionLabelKey[lead.direction]) || directionDefaultLabel[lead.direction]} />
          </div>
          <div className="mt-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={waLink(lead.phoneNumber)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                WhatsApp
              </a>
            </Button>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">{t("wa.intake")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("wa.firstResponse")}</span>
                <span className="text-foreground">
                  {lead.firstResponseAt ? formatWaTime(lead.firstResponseAt) : "—"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("wa.slaTarget")}</span>
                <span className="text-foreground">{FIRST_RESPONSE_SLA_MINUTES} min</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("wa.qualified")}</span>
                <span className="text-foreground">{lead.qualified ? "✓" : "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("wa.escalated")}</span>
                <span className="text-foreground">{lead.escalated ? "✓" : "—"}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("wa.assignedTo")}</span>
                <span className="text-foreground">{lead.assignedTo ?? "—"}</span>
              </p>
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Conversation</h3>
            <div className="mt-3 space-y-2">
              {lead.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.direction === "outbound"
                      ? message.author === "ai"
                        ? "ml-8 rounded-xl rounded-br-sm border border-sky-500/30 bg-sky-500/10 p-2.5 text-sm text-foreground"
                        : "ml-8 rounded-xl rounded-br-sm border border-primary/30 bg-primary/10 p-2.5 text-sm text-foreground"
                      : "mr-8 rounded-xl rounded-bl-sm border border-border/70 bg-background/40 p-2.5 text-sm text-foreground"
                  }
                >
                  <p>{message.text}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {message.author === "ai" ? "AI" : message.author === "team" ? "Team" : lead.contactName} · {formatWaTime(message.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const WhatsAppBotModule = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [selected, setSelected] = useState<WhatsAppLead | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<WhatsAppIntent | "All">("All");
  const [directionFilter, setDirectionFilter] = useState<Direction | "All">("All");

  const [form, setForm] = useState({
    contactName: "",
    phoneNumber: "+971 ",
    intent: "owner_lead" as WhatsAppIntent,
    direction: "property_management" as Direction,
    message: "",
  });

  const leads = useMemo(
    () =>
      demoWhatsAppLeads.filter(
        (lead) =>
          (filter === "All" || lead.intent === filter) &&
          (directionFilter === "All" || lead.direction === directionFilter),
      ),
    [directionFilter, filter],
  );

  const slaStats = useMemo(() => {
    const total = demoWhatsAppLeads.length;
    const responded = demoWhatsAppLeads.filter((lead) => lead.firstResponseAt).length;
    const withinSla = demoWhatsAppLeads.filter(
      (lead) => lead.firstResponseMinutes !== undefined && lead.firstResponseMinutes <= FIRST_RESPONSE_SLA_MINUTES,
    ).length;
    const avgResponse =
      demoWhatsAppLeads.reduce((sum, lead) => sum + (lead.firstResponseMinutes ?? 0), 0) / Math.max(1, responded);
    return {
      total,
      responded,
      withinSlaPct: total === 0 ? 0 : Math.round((withinSla / total) * 100),
      avgResponseMinutes: Math.round(avgResponse * 10) / 10,
    };
  }, []);

  const createLead = () => {
    if (!form.contactName.trim() || !form.phoneNumber.trim() || !form.message.trim()) return;
    const assignedTo = routeWhatsAppLead(form.intent, form.direction);
    const template = firstResponseTemplates[form.intent];
    toast.success(t("wa.leadCreated"));

    // Create an opportunity in the pipeline for owner leads
    if (form.intent === "owner_lead") {
      const input: NewOpportunityInput = {
        ownerName: form.contactName.trim(),
        prospectProperty: `${form.direction === "snagging" ? "Snagging" : form.direction === "staging" ? "Staging" : "Property"} prospect`,
        area: "Dubai",
        type: "Apartment",
        estimatedMonthlyRevenue: form.direction === "property_management" ? 18000 : 0,
        stage: "New Lead",
        assignedTo,
        leadSource: "WhatsApp",
        priority: "Medium",
        nextAction: "Contact new WhatsApp lead",
        phone: form.phoneNumber.trim(),
        direction: form.direction,
      };
      workspace.addOpportunity(input);
    }

    setShowCreate(false);
    setForm({ contactName: "", phoneNumber: "+971 ", intent: "owner_lead", direction: "property_management", message: "" });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("wa.intake")}
        title={t("wa.title")}
        description={`${FIRST_RESPONSE_SLA_MINUTES} min ${t("sla.firstResponse").toLowerCase()}`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            {t("wa.createLead")}
          </Button>
        }
      />

      {/* SLA stats */}
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
          <p className="text-xs text-muted-foreground">{t("wa.escalated")}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {demoWhatsAppLeads.filter((l) => l.escalated).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-card/50 p-1" role="group">
        <Button type="button" size="sm" variant={filter === "All" ? "secondary" : "ghost"} onClick={() => setFilter("All")}>
          {t("common.all")}
        </Button>
        {intents.map((intent) => (
          <Button
            key={intent}
            type="button"
            size="sm"
            variant={filter === intent ? "secondary" : "ghost"}
            onClick={() => setFilter(intent)}
          >
            {t(whatsappIntentLabelKey[intent])}
          </Button>
        ))}
        <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        <Button type="button" size="sm" variant={directionFilter === "All" ? "secondary" : "ghost"} onClick={() => setDirectionFilter("All")}>
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

      {/* Leads list */}
      {leads.length === 0 ? (
        <EmptyState title={t("wa.title")} description={t("wa.noLeads")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => {
            const slaStatus =
              lead.firstResponseMinutes === undefined
                ? "warning"
                : lead.firstResponseMinutes <= FIRST_RESPONSE_SLA_MINUTES
                  ? "on_track"
                  : "overdue";
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelected(lead)}
                className="rounded-xl border border-border/70 bg-card/70 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {lead.contactName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{lead.contactName}</p>
                      <p className="truncate text-xs text-muted-foreground">{lead.phoneNumber}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${slaStatusTone[slaStatus]}`}>
                    {slaStatusGlyph[slaStatus]} {formatMinutes(lead.firstResponseMinutes ?? 0)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={t(whatsappIntentLabelKey[lead.intent])} />
                  <StatusPill status={t(directionLabelKey[lead.direction]) || directionDefaultLabel[lead.direction]} />
                  {lead.qualified && <StatusPill status={t("wa.qualified")} />}
                  {lead.escalated && <StatusPill status={t("wa.escalated")} />}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {lead.messages[lead.messages.length - 1]?.text}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {formatWaTime(lead.createdAt)} · {lead.assignedTo ?? "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <LeadDetail lead={selected} open={selected !== null} onOpenChange={(open) => !open && setSelected(null)} />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>{t("wa.createLead")}</DialogTitle>
            <DialogDescription>{t("wa.intake")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={t("common.owner")}
              value={form.contactName}
              onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
            />
            <Input
              placeholder="Phone (+971 XX XXX XXXX)"
              value={form.phoneNumber}
              onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            />
            <select
              aria-label="Intent"
              value={form.intent}
              onChange={(event) => setForm((current) => ({ ...current, intent: event.target.value as WhatsAppIntent }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {intents.map((intent) => (
                <option key={intent} value={intent}>
                  {t(whatsappIntentLabelKey[intent])}
                </option>
              ))}
            </select>
            <select
              aria-label="Direction"
              value={form.direction}
              onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value as Direction }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {t(directionLabelKey[direction]) || directionDefaultLabel[direction]}
                </option>
              ))}
            </select>
            <Input
              placeholder="Message"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="sm:col-span-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={createLead} disabled={!form.contactName.trim() || !form.phoneNumber.trim() || !form.message.trim()}>
              {t("wa.createLead")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
