import { useMemo, useState } from "react";
import { Download, Facebook, Filter, Instagram, Megaphone, Plus, TrendingDown, Workflow, Users } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace, type NewMarketingLeadInput } from "@/contexts/PaterhausWorkspaceContext";
import { AVERAGE_MANAGEMENT_FEE_USD, formatUSD, LOST_REASONS } from "@/data/paterhaus";
import {
  audienceSegments,
  automationPreviews,
  campaignMatchesPeriod,
  conversionFunnels,
  directionMetrics,
  followUpPerformance,
  leadQualityByArea,
  marketingFunnels,
  marketingPeriodLabels,
  presetSegments,
  scoreMarketingLead,
  segmentMatchesLead,
  type Campaign,
  type CampaignPlatform,
  type ConversionFunnel,
  type Direction as MarketingDirection,
  type MarketingLead,
  type MarketingPeriod,
  type SavedSegment,
} from "@/data/paterhaus/marketing";
import {
  DIRECTIONS,
  directionDefaultLabel,
  directionLabelKey,
  exportToCsv,
  formatDays,
  type Direction,
} from "./p0Shared";
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

const scoreLabels: Record<ReturnType<typeof scoreMarketingLead>["level"], string> = {
  high: "High intent",
  medium: "Medium intent",
  low: "Low intent",
};

const scoreClasses: Record<ReturnType<typeof scoreMarketingLead>["level"], string> = {
  high: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-border bg-secondary/50 text-muted-foreground",
};

const funnelStageTone = (conversion: number): string => {
  if (conversion >= 80) return "bg-emerald-500/70";
  if (conversion >= 50) return "bg-sky-500/70";
  if (conversion >= 25) return "bg-amber-500/70";
  return "bg-red-500/60";
};

const ConversionFunnelCard = ({ funnel }: { funnel: ConversionFunnel }) => {
  const { t } = useLanguage();
  const maxCount = funnel.stages[0]?.count ?? 1;
  return (
    <Card className="border-border/80 bg-card/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">{t("funnel.title")}</h3>
          <span className="text-xs text-muted-foreground">
            {t(directionLabelKey[funnel.direction])}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {t("funnel.overall")}:{" "}
            <span className="font-semibold text-foreground">{funnel.overallConversion}%</span>
          </span>
          <span>
            {t("funnel.avgTimeToSigned")}:{" "}
            <span className="font-semibold text-foreground">{formatDays(funnel.averageTimeToSigned)}</span>
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {funnel.stages.map((stage, index) => {
          const dropOff = index === 0 ? 0 : 100 - stage.conversionFromPrevious;
          return (
            <div key={stage.id}>
              <div className="flex items-center justify-between text-xs">
                <span className="min-w-0 truncate text-muted-foreground">
                  {stage.order}. {t(stage.labelKey) || stage.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{stage.count}</span>
                  {index > 0 && (
                    <span className="text-muted-foreground">
                      {stage.conversionFromPrevious}% · {t("funnel.dropOff")} {dropOff}%
                    </span>
                  )}
                  <span className="text-muted-foreground">{formatDays(stage.timeToStage)}</span>
                </span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-secondary/60">
                <div
                  className={`h-2.5 rounded-full ${funnelStageTone(stage.conversionFromPrevious)}`}
                  style={{ width: `${Math.max(2, (stage.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const DirectionMetricsTable = () => {
  const { t } = useLanguage();
  return (
    <Card className="border-border/80 bg-card/70 p-4">
      <h3 className="font-medium text-foreground">{t("direction.metrics.title")}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-2 py-2 font-medium">{t("nav.operations")}</th>
              <th className="px-2 py-2 font-medium">{t("direction.metrics.spend")}</th>
              <th className="px-2 py-2 font-medium">{t("direction.metrics.leads")}</th>
              <th className="px-2 py-2 font-medium">{t("direction.metrics.qualified")}</th>
              <th className="px-2 py-2 font-medium">{t("direction.metrics.signed")}</th>
              <th className="px-2 py-2 font-medium">{t("direction.metrics.costPerSigned")}</th>
            </tr>
          </thead>
          <tbody>
            {directionMetrics.map((row) => (
              <tr key={row.direction} className="border-b border-border/60">
                <td className="px-2 py-2 font-medium text-foreground">
                  {t(directionLabelKey[row.direction]) || directionDefaultLabel[row.direction]}
                </td>
                <td className="px-2 py-2 text-foreground">{formatUSD(row.spend)}</td>
                <td className="px-2 py-2 text-foreground">{row.leads}</td>
                <td className="px-2 py-2 text-foreground">{row.qualified}</td>
                <td className="px-2 py-2 text-foreground">{row.signed}</td>
                <td className="px-2 py-2 text-foreground">{formatUSD(row.costPerSigned)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const SegmentsList = ({
  selectedSegment,
  onSelect,
  onClear,
}: {
  selectedSegment: SavedSegment | null;
  onSelect: (segment: SavedSegment) => void;
  onClear: () => void;
}) => {
  const { t } = useLanguage();
  const workspace = usePaterhausWorkspace();
  return (
    <Card className="border-border/80 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">{t("segment.title")}</h3>
        </div>
        {selectedSegment && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {t("segment.clear")}
          </Button>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {presetSegments.map((segment) => {
          const count = workspace.marketingLeads.filter((lead) => segmentMatchesLead(segment, lead)).length;
          const active = selectedSegment?.id === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => onSelect(segment)}
              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/70 text-foreground hover:bg-secondary/40"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{segment.nameKey ? t(segment.nameKey) : segment.name}</span>
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  active ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {count} {t("segment.leads")}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
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

/* P1.3 — Lost reasons analytics */
const LostReasonsAnalytics = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const lostLeads = workspace.opportunities.filter(
    (opportunity) => opportunity.stage === "Lost / Not Proceeding" && opportunity.lostReasonCode,
  );
  const reasonCounts = LOST_REASONS.map((reason) => ({
    ...reason,
    count: lostLeads.filter((lead) => lead.lostReasonCode === reason.value).length,
  })).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(1, ...reasonCounts.map((item) => item.count));
  const totalLost = lostLeads.length;

  if (totalLost === 0) {
    return (
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">{t("lost.analytics.title")}</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t("lost.analytics.empty")}</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/70 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">{t("lost.analytics.title")}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{totalLost} {t("bulk.selected")}</span>
      </div>
      <div className="mt-4 space-y-2">
        {reasonCounts.map((item) => {
          const widthPct = (item.count / maxCount) * 100;
          return (
            <div key={item.value} className="flex items-center gap-3">
              <span className="w-48 flex-shrink-0 text-xs text-muted-foreground">
                {t(item.labelKey) || item.label}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md border border-border/60 bg-background/40">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-md bg-gradient-to-r from-red-500/40 to-red-500/20"
                  style={{ width: `${Math.max(widthPct, item.count > 0 ? 8 : 0)}%` }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-foreground">
                  {item.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const MarketingModule = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const { campaigns, marketingLeads } = workspace;
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("All");
  const [period, setPeriod] = useState<MarketingPeriod>("this_month");
  const [funnelDirection, setFunnelDirection] = useState<Direction>("property_management");
  const [selectedSegment, setSelectedSegment] = useState<SavedSegment | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);
  const [form, setForm] = useState<SimulateLeadForm>(() => emptyLeadForm(campaigns[0]?.id ?? ""));

  const filteredCampaigns = useMemo(
    () =>
      campaigns
        .filter((campaign) => platformFilter === "All" || campaign.platform === platformFilter)
        .filter((campaign) => campaignMatchesPeriod(campaign, period)),
    [campaigns, platformFilter, period],
  );

  const segmentLeads = useMemo(
    () =>
      selectedSegment
        ? marketingLeads.filter((lead) => segmentMatchesLead(selectedSegment, lead))
        : marketingLeads,
    [marketingLeads, selectedSegment],
  );

  const funnel = marketingFunnels[period];
  const funnelMax = funnel[0]?.value ?? 1;
  const conversionFunnel = conversionFunnels[funnelDirection];

  const metrics = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spendUsd, 0);
    const totalLeads = filteredCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
    const qualified = filteredCampaigns.reduce((sum, campaign) => sum + campaign.qualified, 0);
    const won = filteredCampaigns.reduce((sum, campaign) => sum + campaign.won, 0);
    const activeLeads = segmentLeads.filter((lead) => lead.status !== "won" && lead.status !== "lost").length;
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
  }, [filteredCampaigns, segmentLeads]);

  const kpis = [
    { label: t("marketing.spend"), value: formatUSD(metrics.totalSpend) },
    { label: t("marketing.leads"), value: `${metrics.totalLeads}` },
    { label: t("marketing.cpl"), value: formatUSD(metrics.cpl) },
    { label: t("marketing.qualified"), value: `${metrics.qualified}` },
    { label: t("marketing.conversion"), value: `${metrics.qualifiedRate.toFixed(0)}%` },
    { label: t("marketing.won"), value: `${metrics.won}` },
    { label: t("marketing.cost_per_won"), value: formatUSD(metrics.costPerWon) },
    { label: t("marketing.pipeline_value"), value: formatUSD(metrics.pipelineValue) },
  ];

  const campaignLeads = selectedCampaign
    ? marketingLeads.filter((lead) => lead.campaignId === selectedCampaign.id)
    : [];

  const exportCampaignsCsv = () => {
    exportToCsv(
      filteredCampaigns,
      `paterhaus-campaigns-${period}.csv`,
      [
        { header: "id", accessor: (row) => row.id },
        { header: "name", accessor: (row) => row.name },
        { header: "platform", accessor: (row) => row.platform },
        { header: "direction", accessor: (row) => row.direction },
        { header: "spend_usd", accessor: (row) => row.spendUsd },
        { header: "leads", accessor: (row) => row.leads },
        { header: "qualified", accessor: (row) => row.qualified },
        { header: "won", accessor: (row) => row.won },
        { header: "cpl", accessor: (row) => (row.leads === 0 ? 0 : (row.spendUsd / row.leads).toFixed(2)) },
        { header: "cost_per_won", accessor: (row) => (row.won === 0 ? 0 : (row.spendUsd / row.won).toFixed(2)) },
      ],
    );
    toast.success(t("export.campaigns"));
  };

  const exportLeadsCsv = () => {
    exportToCsv(
      segmentLeads,
      `paterhaus-leads${selectedSegment ? `-${selectedSegment.id}` : ""}.csv`,
      [
        { header: "id", accessor: (row) => row.id },
        { header: "name", accessor: (row) => row.name },
        { header: "phone", accessor: (row) => row.phone },
        { header: "email", accessor: (row) => row.email },
        { header: "source", accessor: (row) => row.source },
        { header: "campaign_id", accessor: (row) => row.campaignId ?? "" },
        { header: "status", accessor: (row) => row.status },
        { header: "assigned_to", accessor: (row) => row.assignedTo ?? "" },
        { header: "area", accessor: (row) => row.propertyArea ?? "" },
        { header: "property_type", accessor: (row) => row.propertyType ?? "" },
        { header: "bedrooms", accessor: (row) => row.bedrooms ?? "" },
        { header: "created_at", accessor: (row) => row.createdAt },
      ],
    );
    toast.success(t("export.leads"));
  };

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
        eyebrow={t("marketing.eyebrow")}
        title={t("marketing.title")}
        description={t("marketing.description")}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCampaignsCsv}>
              <Download className="h-4 w-4" />
              {t("export.campaigns")}
            </Button>
            <Button variant="outline" onClick={exportLeadsCsv}>
              <Download className="h-4 w-4" />
              {t("export.leads")}
            </Button>
            <Button onClick={() => setShowSimulate(true)}>
              <Plus className="h-4 w-4" />
              {t("marketing.simulate")}
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-card/50 p-1" role="group" aria-label="Reporting period">
        {(Object.keys(marketingPeriodLabels) as MarketingPeriod[]).map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={period === option ? "secondary" : "ghost"}
            onClick={() => setPeriod(option)}
          >
            {marketingPeriodLabels[option]}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/80 bg-card/70 p-4">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* P0.1 — Conversion Funnel + P0.2 — Direction metrics */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-card/50 p-1" role="group" aria-label="Funnel direction">
            {DIRECTIONS.map((direction) => (
              <Button
                key={direction}
                type="button"
                size="sm"
                variant={funnelDirection === direction ? "secondary" : "ghost"}
                onClick={() => setFunnelDirection(direction)}
              >
                {t(directionLabelKey[direction]) || directionDefaultLabel[direction]}
              </Button>
            ))}
          </div>
        </div>
        <ConversionFunnelCard funnel={conversionFunnel} />
        <DirectionMetricsTable />
      </div>

      {/* P0.6 — Segments */}
      <SegmentsList
        selectedSegment={selectedSegment}
        onSelect={(segment) => {
          setSelectedSegment(segment);
          toast.success(`${t("segment.applied")}: ${segment.nameKey ? t(segment.nameKey) : segment.name}`);
        }}
        onClear={() => setSelectedSegment(null)}
      />

      {/* P1.3 — Lost reasons analytics */}
      <LostReasonsAnalytics />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-foreground">Campaigns</h3>
            <span className="text-xs text-muted-foreground">{marketingPeriodLabels[period]}</span>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/70 p-4">
          <h3 className="font-medium text-foreground">Acquisition funnel</h3>
          <p className="mt-1 text-xs text-muted-foreground">{marketingPeriodLabels[period]}</p>
          <div className="mt-3 space-y-2">
            {funnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <span className="font-medium text-foreground">{stage.value.toLocaleString("en-US")}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary/60">
                  <div
                    className="h-2 rounded-full bg-primary/70"
                    style={{ width: `${Math.max(2, (stage.value / funnelMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="border-border/80 bg-card/70 p-4">
            <h3 className="font-medium text-foreground">Lead quality by area</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Area</th>
                    <th className="px-2 py-2 font-medium">Leads</th>
                    <th className="px-2 py-2 font-medium">Qualified</th>
                    <th className="px-2 py-2 font-medium">Qual. rate</th>
                    <th className="px-2 py-2 font-medium">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {leadQualityByArea.map((row) => (
                    <tr key={row.area} className="border-b border-border/60">
                      <td className="px-2 py-2 font-medium text-foreground">{row.area}</td>
                      <td className="px-2 py-2 text-foreground">{row.leads}</td>
                      <td className="px-2 py-2 text-foreground">{row.qualified}</td>
                      <td className="px-2 py-2 text-foreground">{((row.qualified / row.leads) * 100).toFixed(0)}%</td>
                      <td className="px-2 py-2 text-foreground">{row.won}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card className="border-border/80 bg-card/70 p-4">
            <h3 className="font-medium text-foreground">Lead Response Performance</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                { label: "New leads awaiting response", value: `${followUpPerformance.newLeadsAwaitingResponse}` },
                { label: "Contacted within 15 min", value: `${followUpPerformance.contactedWithin15MinPct}%` },
                { label: "Avg first response", value: `${followUpPerformance.averageFirstResponseMinutes} min` },
                { label: "Follow-ups overdue", value: `${followUpPerformance.followUpsOverdue}` },
                { label: "Best performer", value: followUpPerformance.topResponder },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card className="border-border/80 bg-card/70 p-4">
        <h3 className="font-medium text-foreground">Recent marketing leads</h3>
        <p className="mt-1 text-xs text-muted-foreground">Scored transparently by area, unit details and engagement.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {marketingLeads.slice(0, 9).map((lead) => {
            const score = scoreMarketingLead(lead);
            return (
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
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${scoreClasses[score.level]}`}>
                  {scoreLabels[score.level]}
                </span>
                <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground/90">{score.reason}</p>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-foreground">Automations</h3>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">Preview</span>
          </div>
          <div className="mt-3 space-y-2">
            {automationPreviews.map((automation) => (
              <div key={automation.id} className="rounded-xl border border-border/70 p-3">
                <p className="text-sm font-medium text-foreground">When: {automation.trigger}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {automation.steps.map((step, index) => (
                    <span key={step} className="inline-flex items-center gap-1.5">
                      {index > 0 && <span aria-hidden className="text-muted-foreground/60">→</span>}
                      <span className="rounded-md border border-border/70 bg-secondary/40 px-2 py-0.5">{step}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-foreground">Audience segments</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Saved views over the current lead list.</p>
          <div className="mt-3 space-y-2">
            {audienceSegments.map((segment) => (
              <div key={segment.id} className="flex items-center justify-between rounded-xl border border-border/70 p-3">
                <p className="text-sm font-medium text-foreground">{segment.label}</p>
                <span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {marketingLeads.filter(segment.matches).length} leads
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
