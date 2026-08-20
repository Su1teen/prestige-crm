import { useMemo, useState } from "react";
import { FileText, Filter, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import {
  formatAED,
  getPortfolioFinancialSummary,
  getRevenueDelta,
  getRevenueSeries,
  reconcileStatement,
} from "@/data/paterhaus";
import { EmptyState, SectionHeader, StatusPill } from "./shared";
import type { OwnerStatement } from "@/types/paterhaus";

export const FinanceModule = () => {
  const workspace = usePaterhausWorkspace();
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [selected, setSelected] = useState<OwnerStatement | null>(null);
  const statements = workspace.statements.filter(
    (statement) =>
      (ownerFilter === "All" || statement.ownerId === ownerFilter) &&
      (propertyFilter === "All" || statement.propertyId === propertyFilter),
  );
  const summary = useMemo(() => getPortfolioFinancialSummary(statements), [statements]);
  const comparisonSeries = getRevenueSeries(workspace.properties);
  const currentComparison = comparisonSeries[comparisonSeries.length - 1];
  const priorComparison = comparisonSeries[comparisonSeries.length - 2];
  const revenueDelta = getRevenueDelta(comparisonSeries);
  const occupancyDelta =
    currentComparison && priorComparison ? currentComparison.occupancy - priorComparison.occupancy : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Finance control"
        title="Finance & Owner Reports"
        description="Reconciled AED statements, property P&L and owner-facing reporting status."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          aria-label="Filter statements by owner"
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="All">All owners</option>
          {workspace.owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter statements by property"
          value={propertyFilter}
          onChange={(event) => setPropertyFilter(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="All">All properties</option>
          {workspace.properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Gross revenue", summary.grossRevenue],
          ["Channel fees", summary.channelFees],
          ["Cleaning & laundry", summary.cleaningLaundry],
          ["Maintenance", summary.maintenance],
          ["Management fee", summary.managementFee],
          ["Net owner payout", summary.netPayout],
        ].map(([label, value]) => (
          <Card key={label} className="border-border/80 bg-card/80 p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{formatAED(Number(value))}</p>
          </Card>
        ))}
      </div>
      <Card className="border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <WalletCards className="mt-0.5 h-5 w-5 text-primary" />
          <p>
            Reconciliation identity: gross revenue − channel fees − cleaning/laundry − maintenance − management fee =
            net owner payout.
          </p>
        </div>
      </Card>
      <Card className="overflow-hidden border-border/80 bg-card/80">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Monthly owner statements</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {statements.length} statement lines · property-level P&L rolls into this filtered total.
          </p>
        </div>
        {statements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Statement</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Net payout</th>
                  <th className="px-4 py-3">Payout date</th>
                  <th className="px-4 py-3">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((statement) => {
                  const owner = workspace.owners.find((item) => item.id === statement.ownerId);
                  const property = workspace.properties.find((item) => item.id === statement.propertyId);
                  return (
                    <tr key={statement.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left hover:text-primary"
                          onClick={() => setSelected(statement)}
                        >
                          <span className="block font-medium text-foreground">
                            {owner?.name} · {statement.period}
                          </span>
                          <span className="text-xs text-muted-foreground">{statement.id}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{property?.name}</td>
                      <td className="px-4 py-3 text-foreground">{formatAED(statement.grossRevenue)}</td>
                      <td className="px-4 py-3 font-medium text-primary">{formatAED(statement.netPayout)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{statement.payoutDate}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={statement.status} />
                        <span className="mt-1 block text-xs text-muted-foreground">{statement.deliveryStatus}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No statements match these filters" description="Choose a different owner or property." />
        )}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-card/80 p-4">
          <h3 className="font-semibold text-foreground">Property P&L breakdown</h3>
          <div className="mt-3 space-y-2">
            {statements.map((statement) => {
              const property = workspace.properties.find((item) => item.id === statement.propertyId);
              return (
                <div
                  key={statement.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 p-3"
                >
                  <span className="text-sm text-foreground">
                    {property?.name}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Occupancy {property?.occupancyRate}% · prior period comparison available in report
                    </span>
                  </span>
                  <span className="font-medium text-primary">{formatAED(reconcileStatement(statement))}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="border-border/80 bg-card/80 p-4">
          <h3 className="font-semibold text-foreground">Prior-period comparison</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Current August statements are compared against the prior local reporting period using the shared portfolio
            revenue and occupancy selectors. No live payment or channel integration is claimed.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">Revenue vs prior period</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {revenueDelta >= 0 ? "+" : ""}
                {revenueDelta.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs text-muted-foreground">Occupancy vs prior period</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {occupancyDelta >= 0 ? "+" : ""}
                {occupancyDelta} pts
              </p>
            </div>
          </div>
        </Card>
      </div>
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-2xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Owner Report · {selected.period}</SheetTitle>
                <SheetDescription>Statement detail and operational reporting context.</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <Card className="border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary">Property performance</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {workspace.properties.find((item) => item.id === selected.propertyId)?.name}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="text-right text-foreground">
                      {workspace.properties.find((item) => item.id === selected.propertyId)?.occupancyRate}%
                    </span>
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="text-right text-foreground">{formatAED(selected.grossRevenue)}</span>
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="text-right text-foreground">
                      {formatAED(selected.channelFees + selected.cleaningLaundry + selected.maintenance)}
                    </span>
                    <span className="text-muted-foreground">Management fee</span>
                    <span className="text-right text-foreground">{formatAED(selected.managementFee)}</span>
                    <span className="font-medium text-foreground">Net payout</span>
                    <span className="text-right font-semibold text-primary">
                      {formatAED(reconcileStatement(selected))}
                    </span>
                  </div>
                </Card>
                <Card className="border-border bg-card p-4">
                  <p className="font-medium text-foreground">Operational highlights</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Readiness, turnover, maintenance and compliance context is linked to the selected property across
                    this workspace.
                  </p>
                  <p className="mt-3 font-medium text-foreground">Key issues & next-month outlook</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Review open tasks and owner approvals before the next reporting cycle. Activity history is available
                    in the property record.
                  </p>
                </Card>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-4 w-4" /> Delivery {selected.deliveryStatus} · payout {selected.payoutDate}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
