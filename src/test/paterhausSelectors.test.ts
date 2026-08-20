import { describe, expect, it } from "vitest";
import {
  getDashboardMetrics,
  getPortfolioFinancialSummary,
  paterhausComplianceItems,
  paterhausOwnerStatements,
  paterhausProperties,
  paterhausStays,
  paterhausTasks,
  reconcileStatement,
} from "@/data/paterhaus";

describe("Paterhaus financial selectors", () => {
  it("reconciles every owner statement", () => {
    paterhausOwnerStatements.forEach((statement) => {
      expect(reconcileStatement(statement)).toBe(statement.netPayout);
    });
  });

  it("rolls property statement lines into the portfolio total", () => {
    const summary = getPortfolioFinancialSummary(paterhausOwnerStatements);
    expect(summary.netPayout).toBe(paterhausOwnerStatements.reduce((sum, statement) => sum + statement.netPayout, 0));
    expect(summary.grossRevenue).toBe(
      paterhausOwnerStatements.reduce((sum, statement) => sum + statement.grossRevenue, 0),
    );
    expect(summary.netPayout).toBe(
      summary.grossRevenue -
        summary.channelFees -
        summary.cleaningLaundry -
        summary.maintenance -
        summary.managementFee,
    );
  });
});

describe("Paterhaus dashboard selectors", () => {
  it("derives KPI values from the relational workspace data", () => {
    const metrics = getDashboardMetrics(
      paterhausProperties,
      paterhausStays,
      paterhausTasks,
      paterhausComplianceItems,
      paterhausOwnerStatements,
    );
    expect(metrics.activeProperties).toBe(
      paterhausProperties.filter((property) => property.managementStatus === "Managed").length,
    );
    expect(metrics.netOwnerPayoutsDue).toBe(
      paterhausOwnerStatements
        .filter((statement) => statement.status !== "Paid")
        .reduce((sum, statement) => sum + statement.netPayout, 0),
    );
    expect(metrics.openOperationalIssues).toBe(
      paterhausProperties
        .filter((property) => property.managementStatus === "Managed")
        .reduce((sum, property) => sum + property.openIssueCount, 0),
    );
  });
});
