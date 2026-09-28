import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyticsApi } from "@/lib/paterhausApi";
import { SectionHeader } from "./shared";

const money = (values: Record<string, string>) => Object.entries(values).map(([currency, amount]) =>
  `${currency} ${Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`).join(" · ") || "—";
const Metric = ({ label, value }: { label: string; value: string | number }) => <Card className="border-border/80 bg-card/70 p-4">
  <p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p>
</Card>;
export const ProductionOverview = () => {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["paterhaus", "business-overview"], queryFn: analyticsApi.overview });
  return <div className="space-y-6" data-testid="production-overview">
    <SectionHeader eyebrow="Live business data · Asia/Dubai" title="Paterhaus Business Overview" description="Property Management, Snagging and Staging. All figures are derived from saved records." />
    {isPending ? <p role="status">Loading business overview…</p> : isError || !data ? <p role="alert">Could not load the overview. <Button onClick={() => void refetch()}>Retry</Button></p> : <>
      <section><h3 className="mb-3 font-semibold">Sales</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="New leads this month" value={data.sales.newLeads} /><Metric label="Qualified leads" value={data.sales.qualifiedLeads} />
        <Metric label="Active opportunities" value={data.sales.activeOpportunities} /><Metric label="Overdue follow-ups" value={data.sales.overdueFollowUps} />
        <Metric label="Pipeline value" value={money(data.sales.pipelineValue)} /></div></section>
      <section><h3 className="mb-3 font-semibold">Operations</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Active projects" value={data.operations.activeProjects} /><Metric label="Completed this month" value={data.operations.completedThisMonth} />
        <Metric label="Awaiting payment" value={data.operations.awaitingPayment} /><Metric label="Awaiting contractor" value={data.operations.awaitingContractor} />
        <Metric label="Overdue projects" value={data.operations.overdue} /></div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">{Object.entries(data.operations.projectsByService).map(([service, count]) =>
          <span className="rounded-lg border px-3 py-2" key={service}>{service}: {count}</span>)}</div></section>
      <section><h3 className="mb-3 font-semibold">Finance</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Revenue collected this month" value={money(data.finance.revenueCollected)} /><Metric label="Contracted this month" value={money(data.finance.contractedValue)} />
        <Metric label="Outstanding receivables" value={money(data.finance.outstanding)} /><Metric label="Deposits received" value={money(data.finance.depositsReceived)} /></div></section>
      <section><h3 className="mb-3 font-semibold">Marketing</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Spend" value={money(data.marketing.spend)} /><Metric label="Leads" value={data.marketing.leads} /><Metric label="Qualified" value={data.marketing.qualified} />
        <Metric label="Signed" value={data.marketing.signed} /><Metric label="CPL" value={data.marketing.cpl ? money(data.marketing.cpl) : "—"} /></div></section>
      <section><h3 className="mb-3 font-semibold">Property Management · stays</h3><div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Active stays" value={data.stays.active} /><Metric label="Upcoming check-ins" value={data.stays.upcomingCheckIns} /></div></section>
    </>}
  </div>;
};
