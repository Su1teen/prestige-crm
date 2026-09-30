import { useQuery } from "@tanstack/react-query";
import { BarChart2, TrendingUp, AlertCircle, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyticsApi } from "@/lib/paterhausApi";
import { SectionHeader } from "./shared";

const money = (values: Record<string, string>) =>
  Object.entries(values).map(([currency, amount]) =>
    `${currency} ${Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 0 })}`).join(" · ") || "—";

const safeNum = (v: unknown): number => typeof v === "number" ? v : 0;

/** Mini progress bar */
const MiniBar = ({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) => (
  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
    <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: max > 0 ? `${Math.min(100, (value / max) * 100)}%` : "0%" }} />
  </div>
);

/** KPI card with icon and optional color */
const KpiTile = ({ label, value, sub, icon: Icon, color = "text-primary" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <span className={`rounded-lg bg-muted p-1.5 ${color}`}><Icon className="h-4 w-4" /></span>
    </div>
    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </Card>
);

/** Stage funnel bar — shows pipeline as a horizontal funnel */
const FunnelBar = ({ label, count, max, color }: { label: string; count: number; max: number; color: string }) => (
  <div className="flex items-center gap-3">
    <span className="w-28 text-xs text-muted-foreground truncate">{label}</span>
    <div className="flex-1 h-5 rounded bg-muted relative overflow-hidden">
      <div className={`h-full rounded transition-all ${color}`} style={{ width: max > 0 ? `${Math.min(100, (count / max) * 100)}%` : "0%" }} />
      <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-foreground/80">{count}</span>
    </div>
  </div>
);

export const ProductionOverview = () => {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["paterhaus", "business-overview"],
    queryFn: analyticsApi.overview,
  });

  if (isPending) return <p role="status" className="text-muted-foreground">Загрузка обзора…</p>;
  if (isError || !data) return (
    <p role="alert">Не удалось загрузить данные. <Button onClick={() => void refetch()}>Повторить</Button></p>
  );

  const { sales, operations, finance, marketing } = data;
  const pipelineTotal = safeNum(sales.activeOpportunities) + safeNum(sales.overdueFollowUps);
  const funnelMax = safeNum(sales.newLeads) || 1;

  return (
    <div className="space-y-7" data-testid="production-overview">
      <SectionHeader
        eyebrow="Актуальные данные · Дубай"
        title="Портфолио Paterhaus"
        description="Property Management, Snagging, Staging — всё из реальных записей."
      />

      {/* ── SALES & PIPELINE ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Продажи и воронка
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Новые лиды (месяц)" value={sales.newLeads} icon={TrendingUp} color="text-blue-500" />
          <KpiTile label="Квалифицировано" value={sales.qualifiedLeads} sub={`из ${sales.newLeads} лидов`} icon={CheckCircle2} color="text-emerald-500" />
          <KpiTile label="Активные возможности" value={sales.activeOpportunities} icon={BarChart2} color="text-primary" />
          <KpiTile label="Просроченные follow-up" value={sales.overdueFollowUps} icon={AlertCircle} color={sales.overdueFollowUps > 0 ? "text-red-500" : "text-muted-foreground"} />
        </div>

        {/* Pipeline funnel */}
        <Card className="mt-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Воронка продаж</p>
          <div className="space-y-2">
            <FunnelBar label="Новые лиды" count={safeNum(sales.newLeads)} max={funnelMax} color="bg-blue-400/80" />
            <FunnelBar label="Квалифицированы" count={safeNum(sales.qualifiedLeads)} max={funnelMax} color="bg-indigo-400/80" />
            <FunnelBar label="Активные" count={safeNum(sales.activeOpportunities)} max={funnelMax} color="bg-violet-400/80" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Объём воронки: <span className="font-medium text-foreground">{money(sales.pipelineValue)}</span>
          </p>
        </Card>
      </section>

      {/* ── OPERATIONS ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" /> Операции
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Активных проектов" value={operations.activeProjects} icon={BarChart2} color="text-primary" />
          <KpiTile label="Завершено (месяц)" value={operations.completedThisMonth} icon={CheckCircle2} color="text-emerald-500" />
          <KpiTile label="Ожидают оплаты" value={operations.awaitingPayment} icon={DollarSign} color={operations.awaitingPayment > 0 ? "text-amber-500" : "text-muted-foreground"} />
          <KpiTile label="Просроченные" value={operations.overdue} icon={AlertCircle} color={operations.overdue > 0 ? "text-red-500" : "text-muted-foreground"} />
        </div>

        {/* Projects by service — horizontal bars */}
        {Object.keys(operations.projectsByService).length > 0 && (
          <Card className="mt-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Проекты по направлениям</p>
            <div className="space-y-2">
              {Object.entries(operations.projectsByService).map(([service, count]) => {
                const max = Math.max(...Object.values(operations.projectsByService)) || 1;
                const colorMap: Record<string, string> = {
                  SNAGGING: "bg-blue-400/80", STAGING: "bg-violet-400/80", PROPERTY_MANAGEMENT: "bg-emerald-400/80",
                };
                return (
                  <FunnelBar
                    key={service}
                    label={service === "SNAGGING" ? "Snagging" : service === "STAGING" ? "Staging" : "Property Mgmt"}
                    count={count as number}
                    max={max}
                    color={colorMap[service] ?? "bg-primary/60"}
                  />
                );
              })}
            </div>
          </Card>
        )}
      </section>

      {/* ── FINANCE ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" /> Финансы
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Выручка (месяц)</p>
            <p className="mt-2 text-xl font-bold">{money(finance.revenueCollected)}</p>
            <MiniBar
              value={Object.values(finance.revenueCollected).reduce((s, v) => s + Number(v), 0)}
              max={Object.values(finance.contractedValue).reduce((s, v) => s + Number(v), 0) || 1}
              color="bg-emerald-400"
            />
            <p className="mt-1 text-xs text-muted-foreground">план: {money(finance.contractedValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Дебиторка</p>
            <p className="mt-2 text-xl font-bold">{money(finance.outstanding)}</p>
            <p className="mt-1 text-xs text-muted-foreground">к получению</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Авансы получены</p>
            <p className="mt-2 text-xl font-bold">{money(finance.depositsReceived)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-muted-foreground">По договорам (месяц)</p>
            <p className="mt-2 text-xl font-bold">{money(finance.contractedValue)}</p>
          </Card>
        </div>
      </section>

      {/* ── MARKETING ── */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BarChart2 className="h-3.5 w-3.5" /> Маркетинг
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Расходы" value={money(marketing.spend)} icon={DollarSign} color="text-muted-foreground" />
          <KpiTile label="Лидов" value={marketing.leads} sub={`квалиф.: ${marketing.qualified}`} icon={TrendingUp} color="text-blue-500" />
          <KpiTile label="Подписано" value={marketing.signed} icon={CheckCircle2} color="text-emerald-500" />
          <KpiTile label="CPL" value={marketing.cpl ? money(marketing.cpl) : "—"} icon={BarChart2} color="text-primary" />
        </div>

        {/* Conversion mini-funnel */}
        {marketing.leads > 0 && (
          <Card className="mt-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Маркетинговая воронка</p>
            <div className="space-y-2">
              <FunnelBar label="Лиды" count={marketing.leads} max={marketing.leads} color="bg-blue-400/80" />
              <FunnelBar label="Квалифицированы" count={marketing.qualified} max={marketing.leads} color="bg-indigo-400/80" />
              <FunnelBar label="Подписано" count={marketing.signed} max={marketing.leads} color="bg-emerald-400/80" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Конверсия лид→подписание: <span className="font-medium text-foreground">
                {marketing.leads > 0 ? `${((marketing.signed / marketing.leads) * 100).toFixed(1)}%` : "—"}
              </span>
            </p>
          </Card>
        )}
      </section>
    </div>
  );
};
