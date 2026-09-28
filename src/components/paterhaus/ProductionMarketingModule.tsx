import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { campaignsApi, leadsApi, paterhausRequest, type ProductionCampaign, type ProductionLead } from "@/lib/paterhausApi";
import { EmptyState, SectionHeader } from "./shared";

type Tab = "campaigns" | "leads";
const directions = ["PROPERTY_MANAGEMENT", "SNAGGING", "STAGING"];
const platforms = ["FACEBOOK", "INSTAGRAM", "GOOGLE", "WHATSAPP", "REFERRAL", "OTHER"];
const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
type CampaignForm = { name: string; platform: string; direction: string; status: string; spendAmount: string; currency: string; notes: string };
type LeadForm = { name: string; phone: string; email: string; direction: string; stage: string; source: string; campaignId: string; note: string };
const newCampaign = (): CampaignForm => ({ name: "", platform: "INSTAGRAM", direction: "SNAGGING", status: "DRAFT", spendAmount: "", currency: "AED", notes: "" });
const newLead = (): LeadForm => ({ name: "", phone: "", email: "", direction: "SNAGGING", stage: "new", source: "MANUAL", campaignId: "", note: "" });
const amountLabel = (amount: string | number | null, currency: string) => amount == null ? "—" : `${currency} ${Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
interface MarketingSummary {
  spend: Record<string, string>; leads: number; qualified: number; proposals: number; signed: number;
  cpl: Record<string, string> | null; costPerSigned: Record<string, string> | null;
  leadToQualified: number | null; byDirection: Record<string, { leads: number; qualified: number; signed: number }>;
}

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
  const [confirm, setConfirm] = useState<{ type: Tab; id: string; name: string } | null>(null);
  const campaigns = useQuery({ queryKey: ["paterhaus", "campaigns"], queryFn: () => campaignsApi.list() });
  const leads = useQuery({ queryKey: ["paterhaus", "marketing-leads", archived], queryFn: () => leadsApi.list(1, archived) });
  const summary = useQuery({ queryKey: ["paterhaus", "marketing-overview"], queryFn: () => paterhausRequest<MarketingSummary>("/api/paterhaus/marketing/overview") });
  const reload = () => client.invalidateQueries({ queryKey: ["paterhaus"] });
  const saveCampaign = useMutation({ mutationFn: (input: CampaignForm) => {
    const body = { ...input, spendAmount: Number(input.spendAmount), notes: input.notes || null };
    return editingCampaign ? campaignsApi.update(editingCampaign.id, body) : campaignsApi.create(body);
  }, onSuccess: async () => { await reload(); setCampaignOpen(false); } });
  const saveLead = useMutation({ mutationFn: (input: LeadForm) => {
    const body = { ...input, name: input.name.trim(), phone: input.phone || undefined, email: input.email || undefined,
      campaignId: input.campaignId || null, note: input.note || null };
    if (!editingLead) return leadsApi.create({ ...body, campaignId: input.campaignId || undefined });
    return leadsApi.update(editingLead.id, body);
  }, onSuccess: async () => { await reload(); setLeadOpen(false); } });
  const changeRecord = useMutation({ mutationFn: async (input: { type: Tab; id: string; archived?: boolean; deleteRecord?: boolean }) => {
    if (input.type === "campaigns") return input.deleteRecord ? campaignsApi.delete(input.id) : campaignsApi.archive(input.id, Boolean(input.archived));
    return input.deleteRecord ? leadsApi.delete(input.id) : leadsApi.archive(input.id, Boolean(input.archived));
  }, onSuccess: async () => { await reload(); setConfirm(null); }, onError: (cause) => setError(cause.message) });
  const visibleCampaigns = useMemo(() => (campaigns.data?.data ?? []).filter((campaign) => Boolean(campaign.archivedAt) === archived && campaign.name.toLowerCase().includes(search.toLowerCase())), [campaigns.data, archived, search]);
  const visibleLeads = useMemo(() => (leads.data?.data ?? []).filter((lead) => (lead.name ?? "").toLowerCase().includes(search.toLowerCase())), [leads.data, search]);
  const campaignEdit = (campaign?: ProductionCampaign) => {
    setEditingCampaign(campaign ?? null);
    setCampaignForm(campaign ? { name: campaign.name, platform: campaign.platform, direction: campaign.direction,
      status: campaign.status, spendAmount: String(campaign.spendAmount ?? campaign.spendUsd),
      currency: campaign.currency ?? "USD", notes: campaign.notes ?? "" } : newCampaign());
    setError(null); setCampaignOpen(true);
  };
  const leadEdit = (lead?: ProductionLead) => {
    setEditingLead(lead ?? null);
    setLeadForm(lead ? { name: lead.name ?? "", phone: lead.phone ?? "", email: lead.email ?? "",
      direction: lead.direction, stage: lead.stage, source: lead.source,
      campaignId: lead.campaignId ?? "", note: lead.note ?? "" } : newLead());
    setError(null); setLeadOpen(true);
  };
  const saveCampaignForm = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!campaignForm.spendAmount.trim() || !Number.isFinite(Number(campaignForm.spendAmount)) || Number(campaignForm.spendAmount) < 0) {
      setError("Enter a valid spend amount. Do not estimate unknown costs."); return;
    }
    saveCampaign.mutate(campaignForm, { onError: (cause) => setError(cause.message) });
  };
  const saveLeadForm = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    saveLead.mutate(leadForm, { onError: (cause) => setError(cause.message) });
  };
  const waiting = tab === "campaigns" ? campaigns.isPending : leads.isPending;
  const failed = tab === "campaigns" ? campaigns.isError : leads.isError;
  return <div className="space-y-5" data-testid="production-marketing">
    <SectionHeader eyebrow="Shared production data" title="Marketing" description="Campaigns and leads are saved in the Paterhaus database for Admin and Marketing."
      action={<Button onClick={() => tab === "campaigns" ? campaignEdit() : leadEdit()}>Add {tab === "campaigns" ? "campaign" : "lead"}</Button>} />
    {summary.isError && <p role="alert">Marketing metrics could not be loaded. <Button variant="outline" onClick={() => void summary.refetch()}>Retry</Button></p>}
    {summary.data && <div className="grid gap-3 md:grid-cols-4">
      {[["Leads", String(summary.data.leads)], ["Qualified", String(summary.data.qualified)], ["Proposals", String(summary.data.proposals)], ["Signed", String(summary.data.signed)]].map(([label, value]) =>
        <Card key={label} className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></Card>)}
      <Card className="p-4 md:col-span-2"><p className="text-xs text-muted-foreground">Marketing spend</p>
        <p className="text-lg font-semibold">{Object.entries(summary.data.spend).map(([currency, amount]) => amountLabel(amount, currency)).join(" · ") || "—"}</p></Card>
      <Card className="p-4"><p className="text-xs text-muted-foreground">CPL</p><p>{summary.data.cpl ? Object.entries(summary.data.cpl).map(([currency, amount]) => amountLabel(amount, currency)).join(" · ") : "—"}</p></Card>
      <Card className="p-4"><p className="text-xs text-muted-foreground">Lead → qualified</p><p>{summary.data.leadToQualified == null ? "—" : `${(summary.data.leadToQualified * 100).toFixed(1)}%`}</p></Card>
    </div>}
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={tab === "campaigns" ? "default" : "outline"} onClick={() => setTab("campaigns")}>Campaigns</Button>
      <Button variant={tab === "leads" ? "default" : "outline"} onClick={() => setTab("leads")}>Leads</Button>
      <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} />Archived</label>
      <Input className="w-48" aria-label="Search marketing" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    {waiting ? <p role="status">Loading…</p> : failed ? <p role="alert">Could not load records. <Button variant="outline" onClick={() => void reload()}>Retry</Button></p> : tab === "campaigns" ?
      visibleCampaigns.length ? <div className="space-y-2">{visibleCampaigns.map((campaign) => <Card key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{campaign.name}</p><p className="text-xs text-muted-foreground">{campaign.platform} · {campaign.direction} · {campaign.status} · {amountLabel(campaign.spendAmount ?? campaign.spendUsd, campaign.currency ?? "USD")}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => campaignEdit(campaign)}>Edit</Button>
          <Button variant="outline" onClick={() => changeRecord.mutate({ type: "campaigns", id: campaign.id, archived: !archived })}>{archived ? "Restore" : "Archive"}</Button>
          <Button variant="destructive" onClick={() => setConfirm({ type: "campaigns", id: campaign.id, name: campaign.name })}>Delete</Button></div>
      </Card>)}</div> : <EmptyState title="No campaigns" description="Add a campaign to start recording real spend." /> :
      visibleLeads.length ? <div className="space-y-2">{visibleLeads.map((lead) => <Card key={lead.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{lead.name || lead.phone || "Unnamed lead"}</p><p className="text-xs text-muted-foreground">{lead.direction} · {lead.stage} · {lead.source} · {lead.phone || "—"}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => leadEdit(lead)}>Edit</Button>
          <Button variant="outline" onClick={() => changeRecord.mutate({ type: "leads", id: lead.id, archived: !archived })}>{archived ? "Restore" : "Archive"}</Button>
          <Button variant="destructive" onClick={() => setConfirm({ type: "leads", id: lead.id, name: lead.name ?? "this lead" })}>Delete</Button></div>
      </Card>)}</div> : <EmptyState title="No leads" description="Add a lead to start the shared CRM lifecycle." />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}><DialogContent><DialogHeader><DialogTitle>{editingCampaign ? "Edit" : "New"} campaign</DialogTitle></DialogHeader>
      <form onSubmit={saveCampaignForm} className="space-y-3">
        <Input aria-label="Campaign name" required placeholder="Campaign name" value={campaignForm.name} onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })} />
        <select aria-label="Campaign platform" className="w-full border p-2" value={campaignForm.platform} onChange={(event) => setCampaignForm({ ...campaignForm, platform: event.target.value })}>{platforms.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Campaign direction" className="w-full border p-2" value={campaignForm.direction} onChange={(event) => setCampaignForm({ ...campaignForm, direction: event.target.value })}>{directions.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Campaign status" className="w-full border p-2" value={campaignForm.status} onChange={(event) => setCampaignForm({ ...campaignForm, status: event.target.value })}>{["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"].map((value) => <option key={value}>{value}</option>)}</select>
        <div className="flex gap-2"><Input aria-label="Campaign spend" type="number" min="0" step="0.01" required placeholder="Spend" value={campaignForm.spendAmount} onChange={(event) => setCampaignForm({ ...campaignForm, spendAmount: event.target.value })} />
          <Input aria-label="Campaign currency" className="w-20" maxLength={3} value={campaignForm.currency} onChange={(event) => setCampaignForm({ ...campaignForm, currency: event.target.value.toUpperCase() })} /></div>
        <Input aria-label="Campaign notes" placeholder="Notes" value={campaignForm.notes} onChange={(event) => setCampaignForm({ ...campaignForm, notes: event.target.value })} />
        <DialogFooter><Button type="submit" disabled={saveCampaign.isPending}>Save campaign</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={leadOpen} onOpenChange={setLeadOpen}><DialogContent><DialogHeader><DialogTitle>{editingLead ? "Edit" : "New"} lead</DialogTitle></DialogHeader>
      <form onSubmit={saveLeadForm} className="space-y-3">
        <Input aria-label="Lead name" required placeholder="Client name" value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} />
        <Input aria-label="Lead phone" placeholder="Phone" value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} />
        <Input aria-label="Lead email" type="email" placeholder="Email" value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} />
        <select aria-label="Lead direction" className="w-full border p-2" value={leadForm.direction} onChange={(event) => setLeadForm({ ...leadForm, direction: event.target.value })}>{directions.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Lead stage" className="w-full border p-2" value={leadForm.stage} onChange={(event) => setLeadForm({ ...leadForm, stage: event.target.value })}>{stages.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Lead campaign" className="w-full border p-2" value={leadForm.campaignId} onChange={(event) => setLeadForm({ ...leadForm, campaignId: event.target.value })}><option value="">No campaign</option>{(campaigns.data?.data ?? []).filter((item) => !item.archivedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <Input aria-label="Lead note" placeholder="Note" value={leadForm.note} onChange={(event) => setLeadForm({ ...leadForm, note: event.target.value })} />
        <DialogFooter><Button type="submit" disabled={saveLead.isPending}>Save lead</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open) setConfirm(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {confirm?.name}?</DialogTitle>
      <DialogDescription>Linked records cannot be deleted. Archive instead to preserve business history.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
        <Button variant="destructive" disabled={changeRecord.isPending} onClick={() => confirm && changeRecord.mutate({ ...confirm, deleteRecord: true })}>Delete</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
};
