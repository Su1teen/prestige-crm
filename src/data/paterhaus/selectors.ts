import type { ComplianceItem, OwnerStatement, Property, PropertyStatus, Stay, Task } from "@/types/paterhaus";
import { paterhausComplianceItems } from "./compliance";
import { paterhausOwnerStatements } from "./finance";
import { paterhausProperties } from "./properties";
import { paterhausStays } from "./stays";
import { paterhausTasks } from "./tasks";

/** Fixed demo date: all Paterhaus records are intentionally anchored to 20 August 2025. */
export const PATERHAUS_TODAY = "2025-08-20";

export const formatAED = (value: number): string =>
  `AED ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(Math.round(value))}`;

export const getActiveProperties = (properties: Property[]): Property[] =>
  properties.filter((property) => property.managementStatus === "Managed");

export const getOccupiedTonight = (properties: Property[], stays: Stay[]): number =>
  properties.filter((property) =>
    stays.some(
      (stay) => stay.propertyId === property.id && stay.checkIn <= PATERHAUS_TODAY && stay.checkOut > PATERHAUS_TODAY,
    ),
  ).length;

export const getCheckInsToday = (stays: Stay[]): Stay[] => stays.filter((stay) => stay.checkIn === PATERHAUS_TODAY);
export const getCheckOutsToday = (stays: Stay[]): Stay[] => stays.filter((stay) => stay.checkOut === PATERHAUS_TODAY);

export const getOpenTasks = (tasks: Task[]): Task[] => tasks.filter((task) => task.status !== "Completed");

export const getCriticalCompliance = (items: ComplianceItem[]): ComplianceItem[] =>
  items.filter((item) => item.status !== "Complete" && item.risk === "High");

export const getHealthBreakdown = (properties: Property[]) =>
  properties.reduce<Record<PropertyStatus, number>>(
    (accumulator, property) => {
      accumulator[property.status] = (accumulator[property.status] ?? 0) + 1;
      return accumulator;
    },
    {
      Ready: 0,
      Occupied: 0,
      "Turnover in progress": 0,
      "Maintenance required": 0,
      "Compliance risk": 0,
      "Off market": 0,
    },
  );

export interface RevenueSeriesPoint {
  period: string;
  revenue: number;
  target: number;
  occupancy: number;
}

export const getRevenueSeries = (properties: Property[]): RevenueSeriesPoint[] => {
  const revenue = properties.reduce((sum, property) => sum + property.monthlyRevenue, 0);
  const target = properties.reduce((sum, property) => sum + property.revenueTarget, 0);
  const occupancy =
    properties.length === 0
      ? 0
      : Math.round(properties.reduce((sum, property) => sum + property.occupancyRate, 0) / properties.length);
  const multipliers = [
    { period: "Week 1", revenue: 0.87, target: 0.86, occupancy: -6 },
    { period: "Week 2", revenue: 0.93, target: 0.91, occupancy: -3 },
    { period: "Week 3", revenue: 0.98, target: 0.96, occupancy: 1 },
    { period: "Week 4", revenue: 1.01, target: 1, occupancy: 0 },
    { period: "Current", revenue: 1, target: 1, occupancy: 0 },
  ];

  return multipliers.map((point) => ({
    period: point.period,
    revenue: Math.round(revenue * point.revenue),
    target: Math.round(target * point.target),
    occupancy: Math.max(0, Math.min(100, occupancy + point.occupancy)),
  }));
};

export const getRevenueDelta = (series: RevenueSeriesPoint[]): number => {
  if (series.length < 2) return 0;
  const previous = series[series.length - 2].revenue;
  const current = series[series.length - 1].revenue;
  return previous === 0 ? 0 : ((current - previous) / previous) * 100;
};

export interface DashboardTimelineEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: string;
  propertyId: string | null;
}

export const getDashboardTimeline = (
  stays: Stay[],
  tasks: Task[],
  compliance: ComplianceItem[],
): DashboardTimelineEvent[] => {
  const stayEvents = stays.flatMap((stay) => {
    const events: DashboardTimelineEvent[] = [];
    if (stay.checkOut === PATERHAUS_TODAY && stay.checkOutAt) {
      events.push({
        id: `${stay.id}-checkout`,
        time: stay.checkOutAt.slice(11, 16),
        title: `Check-out · ${stay.reservationId}`,
        detail: "Turnover workflow begins after departure",
        tone: "Attention",
        propertyId: stay.propertyId,
      });
    }
    if (stay.checkIn === PATERHAUS_TODAY && stay.checkInAt) {
      events.push({
        id: `${stay.id}-checkin`,
        time: stay.checkInAt.slice(11, 16),
        title: `Check-in · ${stay.reservationId}`,
        detail: "Arrival readiness tracked",
        tone: stay.checkInStatus === "Ready" ? "Scheduled" : "Attention",
        propertyId: stay.propertyId,
      });
    }
    return events;
  });
  const taskEvents = tasks
    .filter((task) => task.dueAt.startsWith(PATERHAUS_TODAY) && task.status !== "Completed")
    .map((task) => ({
      id: task.id,
      time: task.dueAt.slice(11, 16),
      title: task.title,
      detail: `${task.category} · ${task.status}`,
      tone: task.priority === "Urgent" ? "Urgent" : task.status,
      propertyId: task.propertyId,
    }));
  const complianceEvents = compliance
    .filter((item) => item.dueAt?.startsWith(PATERHAUS_TODAY))
    .map((item) => ({
      id: item.id,
      time: item.dueAt?.slice(11, 16) ?? "09:00",
      title: item.title,
      detail: `${item.type} · ${item.status}`,
      tone: "Due soon",
      propertyId: item.propertyId,
    }));
  return [...stayEvents, ...taskEvents, ...complianceEvents].sort((a, b) => a.time.localeCompare(b.time));
};

export const getDashboardMetrics = (
  properties: Property[],
  stays: Stay[],
  tasks: Task[],
  compliance: ComplianceItem[],
  statements: OwnerStatement[] = paterhausOwnerStatements,
) => {
  const active = getActiveProperties(properties);
  const revenue = active.reduce((sum, property) => sum + property.monthlyRevenue, 0);
  const target = active.reduce((sum, property) => sum + property.revenueTarget, 0);
  const occupancyRate =
    active.length === 0
      ? 0
      : Math.round(active.reduce((sum, property) => sum + property.occupancyRate, 0) / active.length);

  return {
    activeProperties: active.length,
    occupiedTonight: getOccupiedTonight(active, stays),
    checkInsToday: getCheckInsToday(stays).length,
    checkOutsToday: getCheckOutsToday(stays).length,
    occupancyRate,
    monthToDateRevenue: revenue,
    revenueTarget: target,
    openOperationalIssues: active.reduce((sum, property) => sum + property.openIssueCount, 0),
    criticalComplianceItems: getCriticalCompliance(compliance).length,
    notListingReady: properties.filter((property) => property.readiness !== "Ready").length,
    netOwnerPayoutsDue: statements
      .filter((statement) => statement.status !== "Paid")
      .reduce((sum, statement) => sum + statement.netPayout, 0),
    overdueTasks: getOpenTasks(tasks).filter((task) => task.dueAt.slice(0, 10) < PATERHAUS_TODAY).length,
  };
};

export const getPropertyById = (properties: Property[], id: string): Property | undefined =>
  properties.find((property) => property.id === id);

export const reconcileStatement = (statement: OwnerStatement): number =>
  statement.grossRevenue -
  statement.channelFees -
  statement.cleaningLaundry -
  statement.maintenance -
  statement.managementFee;

export interface PortfolioFinancialSummary {
  grossRevenue: number;
  channelFees: number;
  cleaningLaundry: number;
  maintenance: number;
  managementFee: number;
  netPayout: number;
}

export const getPortfolioFinancialSummary = (statements: OwnerStatement[]): PortfolioFinancialSummary =>
  statements.reduce(
    (summary, statement) => ({
      grossRevenue: summary.grossRevenue + statement.grossRevenue,
      channelFees: summary.channelFees + statement.channelFees,
      cleaningLaundry: summary.cleaningLaundry + statement.cleaningLaundry,
      maintenance: summary.maintenance + statement.maintenance,
      managementFee: summary.managementFee + statement.managementFee,
      netPayout: summary.netPayout + statement.netPayout,
    }),
    {
      grossRevenue: 0,
      channelFees: 0,
      cleaningLaundry: 0,
      maintenance: 0,
      managementFee: 0,
      netPayout: 0,
    },
  );
