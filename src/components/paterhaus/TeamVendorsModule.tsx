import { useMemo, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  Phone,
  Star,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { formatPaterhausDate, PATERHAUS_TEAM } from "@/data/paterhaus";
import { summarizeVendorJobs, vendorRoi } from "@/data/paterhaus/vendors";
import { exportToCsv, formatMinutes } from "./p0Shared";
import { SectionHeader, StatusPill } from "./shared";

type Tab = "vendors" | "performance";

const onTimeTone = (rate: number): string => {
  if (rate >= 90) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (rate >= 75) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
};

const satisfactionTone = (score: number): string => {
  if (score >= 4.5) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (score >= 4) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
};

export const TeamVendorsModule = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("vendors");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const sortedVendors = useMemo(
    () =>
      [...workspace.vendors].sort((a, b) => {
        const aJobs = a.jobs ?? [];
        const bJobs = b.jobs ?? [];
        const aOnTime = aJobs.length ? aJobs.filter((j) => j.onTime).length / aJobs.length : a.onTimeRate ?? 0;
        const bOnTime = bJobs.length ? bJobs.filter((j) => j.onTime).length / bJobs.length : b.onTimeRate ?? 0;
        return bOnTime - aOnTime;
      }),
    [workspace.vendors],
  );

  const exportVendorsCsv = () => {
    exportToCsv(
      workspace.vendors,
      "paterhaus-vendors.csv",
      [
        { header: "id", accessor: (row) => row.id },
        { header: "name", accessor: (row) => row.name },
        { header: "category", accessor: (row) => row.category },
        { header: "services", accessor: (row) => row.services.join("; ") },
        { header: "coverage_areas", accessor: (row) => row.coverageAreas.join("; ") },
        { header: "contact_person", accessor: (row) => row.contactPerson },
        { header: "phone", accessor: (row) => row.phone },
        { header: "avg_response_hours", accessor: (row) => row.averageResponseHours },
        { header: "active_task_count", accessor: (row) => row.activeTaskCount },
        { header: "completion_rate", accessor: (row) => row.completionRate },
        { header: "sla_risk", accessor: (row) => row.slaRisk },
        { header: "cost_range", accessor: (row) => row.costRange },
        { header: "quality_score", accessor: (row) => row.qualityScore },
        { header: "total_jobs", accessor: (row) => row.totalJobs ?? 0 },
        { header: "on_time_rate", accessor: (row) => row.onTimeRate ?? 0 },
        { header: "avg_cost_usd", accessor: (row) => row.avgCostUsd ?? 0 },
        { header: "repeat_issues", accessor: (row) => row.repeatIssues ?? 0 },
        { header: "customer_satisfaction", accessor: (row) => row.customerSatisfaction ?? 0 },
        { header: "status", accessor: (row) => row.status ?? "active" },
        { header: "preferred_vendor", accessor: (row) => (row.preferredVendor ? "yes" : "no") },
      ],
    );
    toast.success(t("export.vendors"));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("team.eyebrow")}
        title={t("team.title")}
        description={t("team.description")}
        action={
          <Button variant="outline" onClick={exportVendorsCsv}>
            <Download className="h-4 w-4" />
            {t("export.vendors")}
          </Button>
        }
      />
      {/* P0.3 — Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-card/50 p-1" role="group" aria-label="Vendor view tabs">
        <Button type="button" size="sm" variant={tab === "vendors" ? "secondary" : "ghost"} onClick={() => setTab("vendors")}>
          <UsersRound className="h-4 w-4" />
          {t("vendor.vendors")}
        </Button>
        <Button type="button" size="sm" variant={tab === "performance" ? "secondary" : "ghost"} onClick={() => setTab("performance")}>
          <TrendingUp className="h-4 w-4" />
          {t("vendor.performance")}
        </Button>
      </div>

      {tab === "vendors" && (
        <>
          <Card className="border-border/80 bg-card/80 p-4">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t("team.internal")}</h3>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {PATERHAUS_TEAM.map((member) => (
                <div key={member.name} className="rounded-xl border border-border/70 p-4">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="mt-1 text-xs text-primary">{member.role}</p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{member.focus}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300">
                    <Mail className="h-3 w-3" /> {t("team.shared_inbox")}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {workspace.vendors.map((vendor) => {
              const activeTasks = workspace.tasks.filter(
                (task) => task.vendorId === vendor.id && task.status !== "Completed",
              );
              const recentWork = workspace.tasks
                .filter((task) => task.vendorId === vendor.id && task.status === "Completed")
                .sort((first, second) => second.dueAt.localeCompare(first.dueAt))
                .slice(0, 3);

              return (
                <Card key={vendor.id} className="border-border/80 bg-card/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-primary">{vendor.category}</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{vendor.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {vendor.preferredVendor && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Award className="h-3 w-3" /> {t("vendor.preferred")}
                        </span>
                      )}
                      <StatusPill status={vendor.slaRisk} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.services")}</p>
                      <p className="mt-1 text-sm text-foreground">{vendor.services.join(" · ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.coverage")}</p>
                      <p className="mt-1 text-sm text-foreground">{vendor.coverageAreas.join(" · ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.contact")}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-foreground">
                        <Phone className="h-3 w-3 text-primary" />
                        {vendor.contactPerson} · {vendor.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.performance")}</p>
                      <p className="mt-1 text-sm text-foreground">
                        {vendor.averageResponseHours}h response · {vendor.completionRate}% completion
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.cost_range")}</p>
                      <p className="mt-1 text-sm text-foreground">{vendor.costRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("team.quality_score")}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-foreground">
                        <Star className="h-3 w-3 text-amber-300" />
                        {vendor.qualityScore}/5
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border/70 p-3">
                    <p className="text-xs font-medium text-foreground">{t("team.active_tasks")} · {activeTasks.length}</p>
                    {activeTasks.length ? (
                      activeTasks.map((task) => (
                        <p key={task.id} className="mt-2 text-xs text-muted-foreground">
                          {task.title} · {task.status} · {formatPaterhausDate(task.dueAt)}
                        </p>
                      ))
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">{t("team.no_active_tasks")}</p>
                    )}
                  </div>
                  <div className="mt-4 rounded-lg border border-border/70 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <BriefcaseBusiness className="h-3 w-3 text-primary" /> {t("team.recent_work")}
                    </p>
                    {recentWork.length ? (
                      recentWork.map((task) => (
                        <p key={task.id} className="mt-2 text-xs text-muted-foreground">
                          {formatPaterhausDate(task.dueAt)} · {task.title} · {task.description}
                        </p>
                      ))
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">{t("team.no_completed_work")}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {tab === "performance" && (
        <div className="space-y-4">
          {/* P0.3 — Vendor ROI summary */}
          <Card className="border-border/80 bg-card/80 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-foreground">{t("vendor.roi.title")}</h3>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.marketingSpend")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">${vendorRoi.totalMarketingSpend.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.vendorCosts")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">${vendorRoi.totalVendorCosts.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.operatingCost")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">${vendorRoi.totalOperatingCost.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.revenue")}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">${vendorRoi.revenueFromSignedAgreements.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.netProfit")}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">${vendorRoi.netProfit.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">{t("vendor.roi.roi")}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{vendorRoi.roi}%</p>
              </div>
            </div>
          </Card>

          {/* P0.3 — Vendor performance table */}
          <Card className="border-border/80 bg-card/80 p-4">
            <h3 className="font-medium text-foreground">{t("vendor.performance")}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">{t("vendor.vendors")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.totalJobs")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.onTimeRate")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.avgResponseTime")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.avgCost")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.repeatIssues")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.customerSatisfaction")}</th>
                    <th className="px-3 py-2 font-medium">{t("vendor.qualityScore")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVendors.map((vendor) => {
                    const summary = summarizeVendorJobs(vendor.jobs ?? []);
                    const onTime = vendor.onTimeRate ?? summary.onTimeRate;
                    const satisfaction = vendor.customerSatisfaction ?? vendor.qualityScore;
                    return (
                      <tr
                        key={vendor.id}
                        className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40"
                        onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{vendor.name}</span>
                            {vendor.preferredVendor && <Award className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{vendor.category}</p>
                        </td>
                        <td className="px-3 py-3 text-foreground">{vendor.totalJobs ?? summary.totalJobs}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${onTimeTone(onTime)}`}>
                            {onTime}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-foreground">{formatMinutes((vendor.averageResponseHours ?? summary.avgResponseHours) * 60)}</td>
                        <td className="px-3 py-3 text-foreground">${(vendor.avgCostUsd ?? summary.avgCostUsd).toLocaleString("en-US")}</td>
                        <td className="px-3 py-3 text-foreground">{vendor.repeatIssues ?? 0}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${satisfactionTone(satisfaction)}`}>
                            <Star className="h-3 w-3" /> {satisfaction.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-foreground">{vendor.qualityScore}/5</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* P0.3 — Expanded vendor job history */}
          {expandedVendor && (() => {
            const vendor = workspace.vendors.find((v) => v.id === expandedVendor);
            if (!vendor) return null;
            const jobs = vendor.jobs ?? [];
            return (
              <Card className="border-border/80 bg-card/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-foreground">{vendor.name} · {t("vendor.jobs.history")}</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExpandedVendor(null)}>
                    {t("common.close")}
                  </Button>
                </div>
                {jobs.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t("team.no_completed_work")}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 p-3 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{formatPaterhausDate(job.date)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("vendor.avgResponseTime")}: {formatMinutes(job.responseTime * 60)} · {t("vendor.avgCost")}: ${job.cost.toLocaleString("en-US")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.onTime ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> {t("vendor.onTimeRate")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                              <Clock3 className="h-3 w-3" /> Late
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                            <Star className="h-3 w-3" /> {job.qualityScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
};
