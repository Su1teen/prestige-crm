import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart2, ChevronDown, ChevronUp, Eye, MousePointer, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { campaignsApi, leadsApi, paterhausRequest, type ProductionCampaign, type ProductionLead } from "@/lib/paterhausApi";
import { EmptyState, SectionHeader } from "./shared";

type Tab = "campaigns" | "leads" | "analytics";
type LeadEntryTab = "list" | "add";

const directions = ["PROPERTY_MANAGEMENT", "SNAGGING", "STAGING"];
const platforms = ["FACEBOOK", "INSTAGRAM", "GOOGLE", "WHATSAPP", "REFERRAL", "OTHER"];
const statuses = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const objectives = ["AWARENESS", "REACH", "TRAFFIC", "LEAD_GENERATION", "CONVERSIONS", "ENGAGEMENT"];
const bidStrategies = ["LOWEST_COST", "COST_CAP", "BID_CAP"];

const platformLabel: Record<string, string> = {
  FACEBOOK: "Facebook", INSTAGRAM: "Instagram", GOOGLE: "Google",
  WHATSAPP: "WhatsApp", REFERRAL: "Реферал", OTHER: "Другое",
};
const directionLabel: Record<string, string> = {
  PROPERTY_MANAGEMENT: "Управление недв.", SNAGGING: "Snagging", STAGING: "Staging",
};
const statusLabel: Record<string, string> = {
  DRAFT: "Черновик", ACTIVE: "Активна", PAUSED: "На паузе", COMPLETED: "Завершена",
};
const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700", COMPLETED: "bg-blue-100 text-blue-700",
};
const serviceOptions = ["snagging", "home_staging", "property_management"];
const serviceLabel: Record<string, string> = {
  snagging: "Snagging", home_staging: "Хоум-стейджинг", property_management: "Управление недв.",
};
const propertyTypes = ["apartment", "villa", "townhouse", "studio", "other"];

type CampaignForm = {
  name: string; platform: string; direction: string; status: string;
  spendAmount: string; currency: string; notes: string;
  objective: string; targetAudienceJson: string; adCreativeUrl: string;
  impressions: string; clicks: string; reach: string; conversions: string;
  dailyBudget: string; lifetimeBudget: string; bidStrategy: string; externalCampaignId: string;
};
type LeadForm = {
  name: string; phone: string; email: string; direction: string;
  stage: string; source: string; campaignId: string; note: string;
};
type LeadEntryForm = {
  entryDate: string; name: string; phone: string; email: string;
  propertyType: string; service: string; firstFollowUp: string;
  secondFollowUp: string; comments: string; campaignId: string;
};

interface MarketingLeadEntry {
  id: string; entryDate: string; name: string; phone: string | null;
  email: string | null; propertyType: string | null; service: string | null;
  firstFollowUp: string | null; secondFollowUp: string | null;
  comments: string | null; archivedAt: string | null; campaignId: string | null;
  campaign: { id: string; name: string } | null;
}

const newCampaign = (): CampaignForm => ({
  name: "", platform: "INSTAGRAM", direction: "SNAGGING", status: "DRAFT",
  spendAmount: "0", currency: "AED", notes: "",
  objective: "LEAD_GENERATION", targetAudienceJson: "", adCreativeUrl: "",
  impressions: "", clicks: "", reach: "", conversions: "",
  dailyBudget: "", lifetimeBudget: "", bidStrategy: "LOWEST_COST", externalCampaignId: "",
});
const newLead = (): LeadForm => ({
  name: "", phone: "", email: "", direction: "SNAGGING",
  stage: "new", source: "MANUAL", campaignId: "", note: "",
});
const newLeadEntry = (): LeadEntryForm => ({
  entryDate: new Date().toISOString().slice(0, 10), name: "", phone: "", email: "",
  propertyType: "apartment", service: "snagging", firstFollowUp: "offer sent",
  secondFollowUp: "", comments: "", campaignId: "",
});

const amountLabel = (amount: string | number | null, currency: string) =>
  amount == null ? "—" : `${currency} ${Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const safeDiv = (a: number, b: number, factor = 1): number | null =>
  b > 0 ? (a / b) * factor : null;
const pct = (v: number | null) => v == null ? "—" : `${v.toFixed(1)}%`;
const money = (v: number | null, currency = "AED") =>
  v == null ? "—" : `${currency} ${v.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;

interface MarketingSummary {
  spend: Record<string, string>; leads: number; qualified: number; proposals: number; signed: number;
  cpl: Record<string, string> | null; costPerSigned: Record<string, string> | null;
  leadToQualified: number | null; byDirection: Record<string, { leads: number; qualified: number; signed: number }>;
}

const selectCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export const ProductionMarketingModule = () => {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("campaigns");
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<ProductionCampaign | null>(null);
  const [editingLead, setEditingLead] = useState<ProductionLead | null>(null);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(newCampaign);
  const [leadForm, setLeadForm] = useState<LeadForm>(newLead);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: Tab | "entry"; id: string; name: string } | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  // Lead entries (from Excel table)
  const [leadsTab, setLeadsTab] = useState<LeadEntryTab>("list");
  const [leadsArchived, setLeadsArchived] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [entryForm, setEntryForm] = useState<LeadEntryForm>(newLeadEntry);
  const [editingEntry, setEditingEntry] = useState<MarketingLeadEntry | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);

  const campaigns = useQuery({ queryKey: ["paterhaus", "campaigns"], queryFn: () => campaignsApi.list() });
  const leads = useQuery({ queryKey: ["paterhaus", "marketing-leads", archived], queryFn: () => leadsApi.list(1, archived) });
  const summary = useQuery({ queryKey: ["paterhaus", "marketing-overview"], queryFn: () => paterhausRequest<MarketingSummary>("/api/paterhaus/marketing/overview") });
  const marketingLeads = useQuery({
    queryKey: ["paterhaus", "marketing-lead-entries", leadsArchived],
    queryFn: () => paterhausRequest<{ items: MarketingLeadEntry[]; total: number }>(`/api/paterhaus/marketing-leads?archived=${leadsArchived}&limit=200`),
  });

  const reload = () => client.invalidateQueries({ queryKey: ["paterhaus"] });

  const saveCampaign = useMutation({
    mutationFn: (input: CampaignForm) => {
      const body = {
        name: input.name, platform: input.platform, direction: input.direction,
        status: input.status, currency: input.currency, notes: input.notes || null,
        spendAmount: Number(input.spendAmount),
        objective: input.objective || null,
        targetAudienceJson: input.targetAudienceJson || null,
        adCreativeUrl: input.adCreativeUrl || null,
        impressions: input.impressions ? Number(input.impressions) : null,
        clicks: input.clicks ? Number(input.clicks) : null,
        reach: input.reach ? Number(input.reach) : null,
        conversions: input.conversions ? Number(input.conversions) : null,
        dailyBudget: input.dailyBudget ? Number(input.dailyBudget) : null,
        lifetimeBudget: input.lifetimeBudget ? Number(input.lifetimeBudget) : null,
        bidStrategy: input.bidStrategy || null,
        externalCampaignId: input.externalCampaignId || null,
      };
      return editingCampaign ? campaignsApi.update(editingCampaign.id, body) : campaignsApi.create(body);
    },
    onSuccess: async () => { await reload(); setCampaignOpen(false); },
  });

  const saveLead = useMutation({
    mutationFn: (input: LeadForm) => {
      const body = { ...input, name: input.name.trim(), phone: input.phone || undefined,
        email: input.email || undefined, campaignId: input.campaignId || null, note: input.note || null };
      if (!editingLead) return leadsApi.create({ ...body, campaignId: input.campaignId || undefined });
      return leadsApi.update(editingLead.id, body);
    },
    onSuccess: async () => { await reload(); setLeadOpen(false); },
  });

  const saveEntry = useMutation({
    mutationFn: (input: LeadEntryForm) => {
      const body = {
        entryDate: new Date(input.entryDate).toISOString(),
        name: input.name.trim(),
        phone: input.phone || null, email: input.email || null,
        propertyType: input.propertyType || null, service: input.service || null,
        firstFollowUp: input.firstFollowUp || null, secondFollowUp: input.secondFollowUp || null,
        comments: input.comments || null, campaignId: input.campaignId || null,
      };
      if (editingEntry) return paterhausRequest(`/api/paterhaus/marketing-leads/${editingEntry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      return paterhausRequest("/api/paterhaus/marketing-leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    onSuccess: async () => { await reload(); setEntryOpen(false); setEditingEntry(null); setEntryForm(newLeadEntry()); },
    onError: (cause) => setError(cause.message),
  });

  const changeRecord = useMutation({
    mutationFn: async (input: { type: Tab | "entry"; id: string; archived?: boolean; deleteRecord?: boolean }) => {
      if (input.type === "entry") {
        if (input.deleteRecord) return paterhausRequest(`/api/paterhaus/marketing-leads/${input.id}`, { method: "DELETE" });
        return paterhausRequest(`/api/paterhaus/marketing-leads/${input.id}/archive`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: Boolean(input.archived) }) });
      }
      if (input.type === "campaigns") return input.deleteRecord ? campaignsApi.delete(input.id) : campaignsApi.archive(input.id, Boolean(input.archived));
      return input.deleteRecord ? leadsApi.delete(input.id) : leadsApi.archive(input.id, Boolean(input.archived));
    },
    onSuccess: async () => { await reload(); setConfirm(null); },
    onError: (cause) => setError(cause.message),
  });

  const visibleCampaigns = useMemo(() =>
    (campaigns.data?.data ?? []).filter((c) => Boolean(c.archivedAt) === archived && c.name.toLowerCase().includes(search.toLowerCase())),
    [campaigns.data, archived, search]);

  const visibleLeads = useMemo(() =>
    (leads.data?.data ?? []).filter((l) => (l.name ?? "").toLowerCase().includes(search.toLowerCase())),
    [leads.data, search]);

  const visibleEntries = useMemo(() =>
    (marketingLeads.data?.items ?? []).filter((e) =>
      e.name.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      (e.phone ?? "").includes(leadsSearch) ||
      (e.email ?? "").toLowerCase().includes(leadsSearch.toLowerCase())
    ),
    [marketingLeads.data, leadsSearch]);

  // Analytics computed from campaigns
  const analyticsData = useMemo(() => {
    const cList = campaigns.data?.data ?? [];
    const totalImpressions = cList.reduce((s, c) => s + ((c as unknown as Record<string, number>)["impressions"] ?? 0), 0);
    const totalClicks = cList.reduce((s, c) => s + ((c as unknown as Record<string, number>)["clicks"] ?? 0), 0);
    const totalConversions = cList.reduce((s, c) => s + ((c as unknown as Record<string, number>)["conversions"] ?? 0), 0);
    const totalSpend = cList.reduce((s, c) => s + Number(c.spendAmount ?? c.spendUsd ?? 0), 0);
    return {
      impressions: totalImpressions, clicks: totalClicks, conversions: totalConversions, spend: totalSpend,
      ctr: safeDiv(totalClicks, totalImpressions, 100),
      cpc: safeDiv(totalSpend, totalClicks),
      cpm: safeDiv(totalSpend, totalImpressions, 1000),
      conversionRate: safeDiv(totalConversions, totalClicks, 100),
    };
  }, [campaigns.data]);

  const campaignEdit = (campaign?: ProductionCampaign) => {
    setEditingCampaign(campaign ?? null);
    const extra = campaign as unknown as Record<string, unknown>;
    setCampaignForm(campaign ? {
      name: campaign.name, platform: campaign.platform, direction: campaign.direction,
      status: campaign.status, spendAmount: String(campaign.spendAmount ?? campaign.spendUsd),
      currency: campaign.currency ?? "AED", notes: campaign.notes ?? "",
      objective: String(extra["objective"] ?? "LEAD_GENERATION"),
      targetAudienceJson: String(extra["targetAudienceJson"] ?? ""),
      adCreativeUrl: String(extra["adCreativeUrl"] ?? ""),
      impressions: String(extra["impressions"] ?? ""),
      clicks: String(extra["clicks"] ?? ""),
      reach: String(extra["reach"] ?? ""),
      conversions: String(extra["conversions"] ?? ""),
      dailyBudget: String(extra["dailyBudget"] ?? ""),
      lifetimeBudget: String(extra["lifetimeBudget"] ?? ""),
      bidStrategy: String(extra["bidStrategy"] ?? "LOWEST_COST"),
      externalCampaignId: String(extra["externalCampaignId"] ?? ""),
    } : newCampaign());
    setError(null); setCampaignOpen(true);
  };

  const leadEdit = (lead?: ProductionLead) => {
    setEditingLead(lead ?? null);
    setLeadForm(lead ? {
      name: lead.name ?? "", phone: lead.phone ?? "", email: lead.email ?? "",
      direction: lead.direction, stage: lead.stage, source: lead.source,
      campaignId: lead.campaignId ?? "", note: lead.note ?? "",
    } : newLead());
    setError(null); setLeadOpen(true);
  };

  const openEntryEdit = (entry?: MarketingLeadEntry) => {
    setEditingEntry(entry ?? null);
    setEntryForm(entry ? {
      entryDate: entry.entryDate.slice(0, 10),
      name: entry.name, phone: entry.phone ?? "", email: entry.email ?? "",
      propertyType: entry.propertyType ?? "apartment", service: entry.service ?? "snagging",
      firstFollowUp: entry.firstFollowUp ?? "", secondFollowUp: entry.secondFollowUp ?? "",
      comments: entry.comments ?? "", campaignId: entry.campaignId ?? "",
    } : newLeadEntry());
    setError(null); setEntryOpen(true);
  };

  const saveCampaignForm = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!campaignForm.spendAmount.trim() || !Number.isFinite(Number(campaignForm.spendAmount)) || Number(campaignForm.spendAmount) < 0) {
      setError("Укажите корректный бюджет."); return;
    }
    saveCampaign.mutate(campaignForm, { onError: (cause) => setError(cause.message) });
  };

  const saveLeadForm = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    saveLead.mutate(leadForm, { onError: (cause) => setError(cause.message) });
  };

  const saveEntryForm = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!entryForm.name.trim()) { setError("Укажите имя клиента."); return; }
    saveEntry.mutate(entryForm);
  };

  const s = summary.data;

  return (
    <div className="space-y-5" data-testid="production-marketing">
      <SectionHeader
        eyebrow="Shared production data"
        title="Маркетинг"
        description="Кампании, лиды и аналитика хранятся в базе данных Paterhaus."
        action={
          <div className="flex gap-2">
            {tab === "campaigns" && <Button onClick={() => campaignEdit()}>+ Кампания</Button>}
            {tab === "leads" && <Button onClick={() => leadEdit()}>+ Лид (CRM)</Button>}
            {tab === "analytics" && null}
          </div>
        }
      />

      {/* KPI Summary */}
      {s && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Лиды</p>
            <p className="mt-1 text-2xl font-semibold">{s.leads}</p>
            <p className="text-xs text-muted-foreground mt-1">Квалиф.: {s.qualified}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Подписано</p>
            <p className="mt-1 text-2xl font-semibold">{s.signed}</p>
            <p className="text-xs text-muted-foreground mt-1">Предложений: {s.proposals}</p>
          </Card>
          <Card className="p-4 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Расходы</p>
            <p className="mt-1 text-xl font-semibold">
              {Object.entries(s.spend).map(([cur, amt]) => amountLabel(amt, cur)).join(" · ") || "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">CPL: {s.cpl ? Object.entries(s.cpl).map(([c, a]) => amountLabel(a, c)).join(" · ") : "—"}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Лид → Квалиф.</p>
            <p className="mt-1 text-2xl font-semibold">{s.leadToQualified == null ? "—" : `${(s.leadToQualified * 100).toFixed(1)}%`}</p>
            <p className="text-xs text-muted-foreground mt-1">Конверсия воронки</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-2">
        {(["campaigns", "leads", "analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            {t === "campaigns" ? "Кампании" : t === "leads" ? "CRM Лиды" : "Аналитика"}
          </button>
        ))}
        {tab !== "analytics" && (
          <>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
              Архив
            </label>
            <Input className="w-48" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
          </>
        )}
      </div>

      {/* ── CAMPAIGNS TAB ── */}
      {tab === "campaigns" && (
        campaigns.isPending ? <p role="status">Загрузка кампаний…</p> :
        campaigns.isError ? <p role="alert">Ошибка загрузки. <Button variant="outline" onClick={() => void reload()}>Повторить</Button></p> :
        !visibleCampaigns.length ? <EmptyState title="Нет кампаний" description="Добавьте кампанию для отслеживания расходов и конверсий." /> :
        <div className="space-y-3">
          {visibleCampaigns.map((campaign) => {
            const extra = campaign as unknown as Record<string, unknown>;
            const imp = Number(extra["impressions"] ?? 0);
            const clk = Number(extra["clicks"] ?? 0);
            const conv = Number(extra["conversions"] ?? 0);
            const spd = Number(campaign.spendAmount ?? campaign.spendUsd ?? 0);
            const ctr = safeDiv(clk, imp, 100);
            const cpc = safeDiv(spd, clk);
            const isExpanded = expandedCampaign === campaign.id;
            return (
              <Card key={campaign.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{campaign.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[campaign.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[campaign.status] ?? campaign.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {platformLabel[campaign.platform] ?? campaign.platform} · {directionLabel[campaign.direction] ?? campaign.direction}
                      {extra["objective"] ? ` · ${extra["objective"] as string}` : ""}
                      {extra["externalCampaignId"] ? ` · ID: ${extra["externalCampaignId"] as string}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span><span className="text-muted-foreground text-xs">Расходы</span><br /><strong>{amountLabel(campaign.spendAmount ?? campaign.spendUsd, campaign.currency ?? "AED")}</strong></span>
                      {imp > 0 && <span><span className="text-muted-foreground text-xs">Показы</span><br /><strong>{imp.toLocaleString()}</strong></span>}
                      {clk > 0 && <span><span className="text-muted-foreground text-xs">Клики</span><br /><strong>{clk.toLocaleString()}</strong></span>}
                      {ctr != null && <span><span className="text-muted-foreground text-xs">CTR</span><br /><strong>{pct(ctr)}</strong></span>}
                      {cpc != null && <span><span className="text-muted-foreground text-xs">CPC</span><br /><strong>{money(cpc, campaign.currency ?? "AED")}</strong></span>}
                      {conv > 0 && <span><span className="text-muted-foreground text-xs">Конверсии</span><br /><strong>{conv}</strong></span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => campaignEdit(campaign)}>Изменить</Button>
                    <Button variant="outline" size="sm" onClick={() => changeRecord.mutate({ type: "campaigns", id: campaign.id, archived: !archived })}>
                      {archived ? "Восстановить" : "Архивировать"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setConfirm({ type: "campaigns", id: campaign.id, name: campaign.name })}>
                      Удалить
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-muted/20 px-4 py-3 space-y-2 text-sm">
                    {extra["targetAudienceJson"] && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Аудитория</p>
                        <p className="mt-1 font-mono text-xs">{String(extra["targetAudienceJson"])}</p>
                      </div>
                    )}
                    {extra["adCreativeUrl"] && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Креатив</p>
                        <a href={String(extra["adCreativeUrl"])} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
                          {String(extra["adCreativeUrl"])}
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                      {extra["dailyBudget"] != null && <span className="text-xs"><span className="text-muted-foreground">Дневной бюджет:</span> {amountLabel(extra["dailyBudget"] as string, campaign.currency ?? "AED")}</span>}
                      {extra["lifetimeBudget"] != null && <span className="text-xs"><span className="text-muted-foreground">Общий бюджет:</span> {amountLabel(extra["lifetimeBudget"] as string, campaign.currency ?? "AED")}</span>}
                      {extra["bidStrategy"] && <span className="text-xs"><span className="text-muted-foreground">Стратегия ставки:</span> {String(extra["bidStrategy"])}</span>}
                    </div>
                    {campaign.notes && <p className="text-xs text-muted-foreground">{campaign.notes}</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── CRM LEADS TAB ── */}
      {tab === "leads" && (
        <div className="space-y-4">
          {/* Sub-tabs for CRM leads vs Excel-style entry table */}
          <div className="flex gap-2 items-center border-b pb-2">
            <button type="button" onClick={() => setLeadsTab("list")}
              className={`text-sm px-3 py-1 rounded ${leadsTab === "list" ? "bg-secondary font-medium" : "text-muted-foreground"}`}>
              Таблица лидов
            </button>
            <button type="button" onClick={() => setLeadsTab("add")}
              className={`text-sm px-3 py-1 rounded ${leadsTab === "add" ? "bg-secondary font-medium" : "text-muted-foreground"}`}>
              CRM воронка
            </button>
            {leadsTab === "list" && (
              <>
                <Button size="sm" className="ml-auto" onClick={() => { setEditingEntry(null); setEntryForm(newLeadEntry()); setEntryOpen(true); }}>+ Добавить</Button>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={leadsArchived} onChange={(e) => setLeadsArchived(e.target.checked)} />
                  Архив
                </label>
                <Input className="w-40" placeholder="Поиск" value={leadsSearch} onChange={(e) => setLeadsSearch(e.target.value)} />
              </>
            )}
          </div>

          {/* Excel-style lead entries */}
          {leadsTab === "list" && (
            marketingLeads.isPending ? <p role="status">Загрузка…</p> :
            marketingLeads.isError ? <p role="alert">Ошибка загрузки. <Button variant="outline" onClick={() => void marketingLeads.refetch()}>Повторить</Button></p> :
            !visibleEntries.length ? <EmptyState title="Нет записей" description="Добавьте клиента из таблицы лидов." /> :
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Дата</th>
                    <th className="px-3 py-2 text-left">Имя</th>
                    <th className="px-3 py-2 text-left">Телефон</th>
                    <th className="px-3 py-2 text-left">Тип объекта</th>
                    <th className="px-3 py-2 text-left">Услуга</th>
                    <th className="px-3 py-2 text-left">1-й follow-up</th>
                    <th className="px-3 py-2 text-left">2-й follow-up</th>
                    <th className="px-3 py-2 text-left">Комментарий</th>
                    <th className="px-3 py-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry) => (
                    <tr key={entry.id} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">{entry.entryDate ? new Date(entry.entryDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}</td>
                      <td className="px-3 py-2 font-medium">{entry.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{entry.phone || "—"}</td>
                      <td className="px-3 py-2">
                        {entry.propertyType ? (
                          <Badge variant="outline" className="text-xs font-normal">{entry.propertyType}</Badge>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {entry.service ? (
                          <Badge variant="outline" className="text-xs font-normal">{serviceLabel[entry.service] ?? entry.service}</Badge>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[140px] truncate">{entry.firstFollowUp || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[140px] truncate">{entry.secondFollowUp || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-[160px] truncate">{entry.comments || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEntryEdit(entry)}>✏️</Button>
                          <Button variant="ghost" size="sm" onClick={() => changeRecord.mutate({ type: "entry", id: entry.id, archived: !leadsArchived })}>
                            {leadsArchived ? "↩" : "📦"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirm({ type: "entry", id: entry.id, name: entry.name })}>🗑️</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CRM leads (pipeline-style) */}
          {leadsTab === "add" && (
            leads.isPending ? <p role="status">Загрузка…</p> :
            leads.isError ? <p role="alert">Ошибка. <Button variant="outline" onClick={() => void reload()}>Повторить</Button></p> :
            !visibleLeads.length ? <EmptyState title="Нет лидов" description="Добавьте лид в CRM воронку." /> :
            <div className="space-y-2">
              {visibleLeads.map((lead) => (
                <Card key={lead.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{lead.name || lead.phone || "Unnamed lead"}</p>
                    <p className="text-xs text-muted-foreground">{directionLabel[lead.direction] ?? lead.direction} · {lead.stage} · {lead.source} · {lead.phone || "—"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => leadEdit(lead)}>Изменить</Button>
                    <Button variant="outline" size="sm" onClick={() => changeRecord.mutate({ type: "leads", id: lead.id, archived: !archived })}>
                      {archived ? "Восстановить" : "Архивировать"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setConfirm({ type: "leads", id: lead.id, name: lead.name ?? "этот лид" })}>
                      Удалить
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === "analytics" && (
        <div className="space-y-5">
          {/* Meta Ads analytics */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Сводка по рекламным кампаниям</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">Показы</span>
                </div>
                <p className="text-2xl font-semibold">{analyticsData.impressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">CPM: {money(analyticsData.cpm)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-xs">Клики</span>
                </div>
                <p className="text-2xl font-semibold">{analyticsData.clicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">CTR: {pct(analyticsData.ctr)} · CPC: {money(analyticsData.cpc)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Конверсии</span>
                </div>
                <p className="text-2xl font-semibold">{analyticsData.conversions}</p>
                <p className="text-xs text-muted-foreground mt-1">CR: {pct(analyticsData.conversionRate)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart2 className="h-4 w-4" />
                  <span className="text-xs">Расходы</span>
                </div>
                <p className="text-2xl font-semibold">{money(analyticsData.spend)}</p>
                <p className="text-xs text-muted-foreground mt-1">по всем кампаниям</p>
              </Card>
            </div>
          </div>

          {/* Direction breakdown */}
          {s?.byDirection && Object.keys(s.byDirection).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">По направлениям</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(s.byDirection).map(([dir, data]) => (
                  <Card key={dir} className="p-4">
                    <p className="font-medium text-sm">{directionLabel[dir] ?? dir}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Лиды</span><span className="font-medium text-foreground">{data.leads}</span></div>
                      <div className="flex justify-between"><span>Квалифицированы</span><span className="font-medium text-foreground">{data.qualified}</span></div>
                      <div className="flex justify-between"><span>Подписано</span><span className="font-medium text-foreground">{data.signed}</span></div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: data.leads ? `${Math.min(100, (data.signed / data.leads) * 100)}%` : "0%" }} />
                      </div>
                      <p className="text-center">{data.leads ? `${((data.signed / data.leads) * 100).toFixed(1)}%` : "—"} конверсия</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Platform breakdown from campaigns */}
          {(campaigns.data?.data ?? []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">По платформам</h3>
              <div className="space-y-2">
                {Object.entries(
                  (campaigns.data?.data ?? []).reduce<Record<string, { spend: number; count: number }>>((acc, c) => {
                    const p = c.platform;
                    if (!acc[p]) acc[p] = { spend: 0, count: 0 };
                    acc[p].spend += Number(c.spendAmount ?? c.spendUsd ?? 0);
                    acc[p].count++;
                    return acc;
                  }, {})
                ).map(([plat, d]) => (
                  <div key={plat} className="flex items-center gap-3">
                    <span className="w-28 text-sm">{platformLabel[plat] ?? plat}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (d.spend / (analyticsData.spend || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-32 text-right">{money(d.spend)} · {d.count} кампании</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}

      {/* ── Campaign form dialog ── */}
      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingCampaign ? "Редактировать" : "Новая"} кампания</DialogTitle>
            <DialogDescription>Параметры рекламной кампании, бюджет и таргетинг в базе данных Paterhaus.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCampaignForm} className="space-y-5 pt-2">
            {/* 1. Основное */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">1. Основная информация</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Название кампании *</label>
                  <Input required placeholder="Например: Dubai Marina — Snagging Aug 2026" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Платформа</label>
                  <select className={selectCls} value={campaignForm.platform} onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}>
                    {platforms.map((v) => <option key={v} value={v}>{platformLabel[v] ?? v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Направление</label>
                  <select className={selectCls} value={campaignForm.direction} onChange={(e) => setCampaignForm({ ...campaignForm, direction: e.target.value })}>
                    {directions.map((v) => <option key={v} value={v}>{directionLabel[v] ?? v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Статус кампании</label>
                  <select className={selectCls} value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })}>
                    {statuses.map((v) => <option key={v} value={v}>{statusLabel[v] ?? v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta / Facebook Campaign ID</label>
                  <Input placeholder="Например: 12020491823901" value={campaignForm.externalCampaignId} onChange={(e) => setCampaignForm({ ...campaignForm, externalCampaignId: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 2. Цели и бюджет */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">2. Цели и бюджет</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Цель кампании (Objective)</label>
                  <select className={selectCls} value={campaignForm.objective} onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })}>
                    {objectives.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Стратегия ставки</label>
                  <select className={selectCls} value={campaignForm.bidStrategy} onChange={(e) => setCampaignForm({ ...campaignForm, bidStrategy: e.target.value })}>
                    {bidStrategies.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Фактические расходы *</label>
                  <div className="flex gap-2">
                    <Input type="number" min="0" step="0.01" required placeholder="0" value={campaignForm.spendAmount} onChange={(e) => setCampaignForm({ ...campaignForm, spendAmount: e.target.value })} />
                    <Input className="w-24 font-semibold text-center" maxLength={3} value={campaignForm.currency} onChange={(e) => setCampaignForm({ ...campaignForm, currency: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Дневной бюджет</label>
                  <Input type="number" min="0" step="0.01" placeholder="0" value={campaignForm.dailyBudget} onChange={(e) => setCampaignForm({ ...campaignForm, dailyBudget: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 3. Метрики результативности */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">3. Метрики результативности</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Показы</label>
                  <Input type="number" min="0" placeholder="0" value={campaignForm.impressions} onChange={(e) => setCampaignForm({ ...campaignForm, impressions: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Клики</label>
                  <Input type="number" min="0" placeholder="0" value={campaignForm.clicks} onChange={(e) => setCampaignForm({ ...campaignForm, clicks: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Охват (Reach)</label>
                  <Input type="number" min="0" placeholder="0" value={campaignForm.reach} onChange={(e) => setCampaignForm({ ...campaignForm, reach: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Конверсии</label>
                  <Input type="number" min="0" placeholder="0" value={campaignForm.conversions} onChange={(e) => setCampaignForm({ ...campaignForm, conversions: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 4. Креатив и аудитория */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">4. Таргетинг и креативы</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">URL креатива / ссылки</label>
                  <Input type="url" placeholder="https://..." value={campaignForm.adCreativeUrl} onChange={(e) => setCampaignForm({ ...campaignForm, adCreativeUrl: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Настройки аудитории (JSON или описание)</label>
                  <Textarea rows={2} placeholder='{"locations":["Dubai"],"age_min":25,"age_max":55,"interests":["Real Estate"]}' value={campaignForm.targetAudienceJson} onChange={(e) => setCampaignForm({ ...campaignForm, targetAudienceJson: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Заметки и комментарии</label>
                  <Input placeholder="Дополнительные комментарии к кампании…" value={campaignForm.notes} onChange={(e) => setCampaignForm({ ...campaignForm, notes: e.target.value })} />
                </div>
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCampaignOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={saveCampaign.isPending}>
                {saveCampaign.isPending ? "Сохранение…" : "Сохранить кампанию"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Lead form (CRM) dialog ── */}
      <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingLead ? "Редактировать" : "Новый"} лид (CRM)</DialogTitle></DialogHeader>
          <form onSubmit={saveLeadForm} className="space-y-3">
            <Input required placeholder="Имя клиента" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
            <Input placeholder="Телефон" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
            <Input type="email" placeholder="Email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} />
            <select className={selectCls} value={leadForm.direction} onChange={(e) => setLeadForm({ ...leadForm, direction: e.target.value })}>
              {directions.map((v) => <option key={v} value={v}>{directionLabel[v] ?? v}</option>)}
            </select>
            <select className={selectCls} value={leadForm.stage} onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}>
              {stages.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className={selectCls} value={leadForm.campaignId} onChange={(e) => setLeadForm({ ...leadForm, campaignId: e.target.value })}>
              <option value="">Без кампании</option>
              {(campaigns.data?.data ?? []).filter((c) => !c.archivedAt).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input placeholder="Заметка" value={leadForm.note} onChange={(e) => setLeadForm({ ...leadForm, note: e.target.value })} />
            <DialogFooter>
              <Button type="submit" disabled={saveLead.isPending}>Сохранить лид</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Lead Entry (Excel table) dialog ── */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Редактировать" : "Добавить"} запись лида</DialogTitle>
            <DialogDescription>Данные о клиенте и статусе работы с ним.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEntryForm} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Дата *</label>
                <Input type="date" required value={entryForm.entryDate} onChange={(e) => setEntryForm({ ...entryForm, entryDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Имя *</label>
                <Input required placeholder="Имя клиента" value={entryForm.name} onChange={(e) => setEntryForm({ ...entryForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Телефон</label>
                <Input placeholder="+971…" value={entryForm.phone} onChange={(e) => setEntryForm({ ...entryForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <Input type="email" placeholder="email@…" value={entryForm.email} onChange={(e) => setEntryForm({ ...entryForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Тип объекта</label>
                <select className={selectCls} value={entryForm.propertyType} onChange={(e) => setEntryForm({ ...entryForm, propertyType: e.target.value })}>
                  {propertyTypes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Услуга</label>
                <select className={selectCls} value={entryForm.service} onChange={(e) => setEntryForm({ ...entryForm, service: e.target.value })}>
                  {serviceOptions.map((v) => <option key={v} value={v}>{serviceLabel[v] ?? v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">1-й follow-up</label>
                <Input placeholder="offer sent, no reply…" value={entryForm.firstFollowUp} onChange={(e) => setEntryForm({ ...entryForm, firstFollowUp: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">2-й follow-up</label>
                <Input placeholder="no reply, negotiations…" value={entryForm.secondFollowUp} onChange={(e) => setEntryForm({ ...entryForm, secondFollowUp: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Кампания</label>
              <select className={selectCls} value={entryForm.campaignId} onChange={(e) => setEntryForm({ ...entryForm, campaignId: e.target.value })}>
                <option value="">Без кампании</option>
                {(campaigns.data?.data ?? []).filter((c) => !c.archivedAt).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Комментарий</label>
              <Textarea rows={2} placeholder="Дополнительные заметки…" value={entryForm.comments} onChange={(e) => setEntryForm({ ...entryForm, comments: e.target.value })} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEntryOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={saveEntry.isPending}>Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete ── */}
      <Dialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить {confirm?.name}?</DialogTitle>
            <DialogDescription>Связанные записи нельзя удалить — архивируйте их чтобы сохранить историю.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Отмена</Button>
            <Button variant="destructive" disabled={changeRecord.isPending}
              onClick={() => confirm && changeRecord.mutate({ ...confirm, deleteRecord: true })}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
