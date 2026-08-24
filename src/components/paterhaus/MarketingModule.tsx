import { useMemo, useState } from "react";
import { Facebook, Instagram, Megaphone, Plus } from "lucide-react";
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
import { usePaterhausWorkspace, type NewMarketingLeadInput } from "@/contexts/PaterhausWorkspaceContext";
import { AVERAGE_MANAGEMENT_FEE_USD, formatUSD } from "@/data/paterhaus";
import type { Campaign, CampaignPlatform, MarketingLead } from "@/data/paterhaus/marketing";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

type PlatformFilter = "All" | CampaignPlatform;

const propertyTypeOptions = ["apartment", "villa", "townhouse", "other"] as const;

const statusLabels: Record<MarketingLead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal sent",
  won: "Won",
  lost: "Lost",
};

const sourceLabels: Record<MarketingLead["source"], string> = {
  meta_lead_ads: "Meta Lead Ads",
  instagram_dm: "Instagram DM",
  website: "Website",
  referral: "Referral",
  manual: "Manual",
};

const PlatformBadge = ({ platform }: { platform: CampaignPlatform }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
    {platform === "facebook" ? (
      <Facebook className="h-4 w-4 text-sky-400" />
    ) : (
      <Instagram className="h-4 w-4 text-pink-400" />
    )}
    <span className="capitalize">{platform}</span>
  </span>
);

interface SimulateLeadForm {
  campaignId: string;
  name: string;
  phone: string;
  email: string;
  propertyArea: string;
  propertyType: (typeof propertyTypeOptions)[number];
  bedrooms: string;
  comment: string;
}

const emptyLeadForm = (campaignId: string): SimulateLeadForm => ({
  campaignId,
  name: "",
  phone: "+971 ",
  email: "",
  propertyArea: "Dubai Marina",
  propertyType: "apartment",
  bedrooms: "2",
  comment: "",
});

export const MarketingModule = () => {
  const workspace = usePaterhausWorkspace();
  const { campaigns, marketingLeads } = workspace;
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);
  const [form, setForm] = useState<SimulateLeadForm>(() => emptyLeadForm(campaigns[0]?.id ?? ""));

  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => platformFilter === "All" || campaign.platform === platformFilter),
    [campaigns, platformFilter],
  );

  const metrics = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spendUsd, 0);
    const totalLeads = filteredCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
    const qualified = filteredCampaigns.reduce((sum, campaign) => sum + campaign.qualified, 0);
    const won = filteredCampaigns.reduce((sum, campaign) => sum + campaign.won, 0);
    const activeLeads = marketingLeads.filter((lead) => lead.status !== "won" && lead.status !== "lost").length;
    return {
      totalSpend,
      totalLeads,
      cpl: totalLeads === 0 ? 0 : totalSpend / totalLeads,
      qualified,
      qualifiedRate: totalLeads === 0 ? 0 : (qualified / totalLeads) * 100,
      won,
      costPerWon: won === 0 ? 0 : totalSpend / won,
      pipelineValue: activeLeads * AVERAGE_MANAGEMENT_FEE_USD,
    };
  }, [filteredCampaigns, marketingLeads]);

  const kpis = [
    { label: "Total Spend", value: formatUSD(metrics.totalSpend) },
    { label: "Total Leads", value: `${metrics.totalLeads}` },
    { label: "CPL", value: formatUSD(metrics.cpl) },
    { label: "Qualified Leads", value: `${metrics.qualified}` },
    { label: "Qualified Rate", value: `${metrics.qualifiedRate.toFixed(0)}%` },
    { label: "Won Owners", value: `${metrics.won}` },
    { label: "Cost per Won", value: formatUSD(metrics.costPerWon) },
    { label: "Pipeline Value", value: formatUSD(metrics.pipelineValue) },
  ];

  const campaignLeads = selectedCampaign
    ? marketingLeads.filter((lead) => lead.campaignId === selectedCampaign.id)
    : [];

  const submitLead = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.campaignId) return;
    const input: NewMarketingLeadInput = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      campaignId: form.campaignId,
      propertyArea: form.propertyArea.trim() || undefined,
      propertyType: form.propertyType,
      bedrooms: Number(form.bedrooms) || undefined,
      comment: form.comment.trim() || undefined,
    };
    workspace.addMarketingLead(input);
    setShowSimulate(false);
    setForm(emptyLeadForm(campaigns[0]?.id ?? ""));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Meta campaigns and owner acquisition"
        title="Marketing"
        description="Campaign spend, lead flow and acquisition performance in USD."
        action={
          <Button onClick={() => setShowSimulate(true)}>
            <Plus className="h-4 w-4" />
            Simulate Meta Lead
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/80 bg-card/70 p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{kpi.value}</p>
          </Card>
        ))}
      </div>
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-foreground">Campaigns</h3>
            <span className="text-xs text-muted-foreground">Aug 2026</span>
          </div>
          <div className="flex gap-1">
            {(["All", "facebook", "instagram"] as const).map((platform) => (
              <Button
                key={platform}
                type="button"
                size="sm"
                variant={platformFilter === platform ? "secondary" : "ghost"}
                onClick={() => setPlatformFilter(platform)}
                className="capitalize"
              >
                {platform}
              </Button>
            ))}
          </div>
        </div>
        {filteredCampaigns.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No campaigns" description="Adjust the platform filter to see campaigns." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Campaign</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Platform</th>
                  <th className="px-3 py-2 font-medium">Spend</th>
                  <th className="px-3 py-2 font-medium">Leads</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">CPL</th>
                  <th className="px-3 py-2 font-medium">Qualified</th>
                  <th className="px-3 py-2 font-medium">Won</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Pipeline value</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-3 py-3 font-medium text-foreground">{campaign.name}</td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <PlatformBadge platform={campaign.platform} />
                    </td>
                    <td className="px-3 py-3 text-foreground">{formatUSD(campaign.spendUsd)}</td>
                    <td className="px-3 py-3 text-foreground">{campaign.leads}</td>
                    <td className="hidden px-3 py-3 text-foreground md:table-cell">
                      {formatUSD(campaign.leads === 0 ? 0 : campaign.spendUsd / campaign.leads)}
                    </td>
                    <td className="px-3 py-3 text-foreground">{campaign.qualified}</td>
                    <td className="px-3 py-3 text-foreground">{campaign.won}</td>
                    <td className="hidden px-3 py-3 text-foreground lg:table-cell">
                      {formatUSD(campaign.won * AVERAGE_MANAGEMENT_FEE_USD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="border-border/80 bg-card/70 p-4">
        <h3 className="font-medium text-foreground">Recent marketing leads</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {marketingLeads.slice(0, 9).map((lead) => (
            <div key={lead.id} className="rounded-xl border border-border/70 bg-background/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                <StatusPill status={statusLabels[lead.status]} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{lead.phone}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {sourceLabels[lead.source]}
                {lead.propertyArea ? ` · ${lead.propertyArea}` : ""}
                {lead.bedrooms !== undefined ? ` · ${lead.bedrooms} BR` : ""}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Dialog open={selectedCampaign !== null} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="dark max-h-[85vh] overflow-y-auto border-border bg-background">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCampaign.name}</DialogTitle>
                <DialogDescription>
                  <PlatformBadge platform={selectedCampaign.platform} /> · {selectedCampaign.period}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "Spend", value: formatUSD(selectedCampaign.spendUsd) },
                  { label: "Leads", value: `${selectedCampaign.leads}` },
                  {
                    label: "CPL",
                    value: formatUSD(
                      selectedCampaign.leads === 0 ? 0 : selectedCampaign.spendUsd / selectedCampaign.leads,
                    ),
                  },
                  { label: "Qualified", value: `${selectedCampaign.qualified}` },
                  { label: "Won", value: `${selectedCampaign.won}` },
                  {
                    label: "Pipeline value",
                    value: formatUSD(selectedCampaign.won * AVERAGE_MANAGEMENT_FEE_USD),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/70 p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground">Campaign leads</h4>
                <div className="mt-2 space-y-2">
                  {campaignLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No individual lead records for this campaign yet.</p>
                  ) : (
                    campaignLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 p-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{lead.name}</span>
                          <span className="block text-xs text-muted-foreground">{lead.phone}</span>
                        </span>
                        <StatusPill status={statusLabels[lead.status]} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showSimulate} onOpenChange={setShowSimulate}>
        <DialogContent className="dark max-h-[85vh] overflow-y-auto border-border bg-background">
          <DialogHeader>
            <DialogTitle>Simulate Meta Lead</DialogTitle>
            <DialogDescription>
              Creates a demo lead from Meta Lead Ads and adds it to the Owner Pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              aria-label="Campaign"
              value={form.campaignId}
              onChange={(event) => setForm((current) => ({ ...current, campaignId: event.target.value }))}
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm sm:col-span-2"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Phone (+971 XX XXX XXXX)"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              placeholder="Property area"
              value={form.propertyArea}
              onChange={(event) => setForm((current) => ({ ...current, propertyArea: event.target.value }))}
            />
            <select
              aria-label="Property type"
              value={form.propertyType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  propertyType: event.target.value as SimulateLeadForm["propertyType"],
                }))
              }
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
            >
              {propertyTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              placeholder="Bedrooms"
              value={form.bedrooms}
              onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))}
            />
            <Input
              placeholder="Comment (optional)"
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              className="sm:col-span-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimulate(false)}>
              Cancel
            </Button>
            <Button onClick={submitLead} disabled={!form.name.trim() || !form.phone.trim() || !form.campaignId}>
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
