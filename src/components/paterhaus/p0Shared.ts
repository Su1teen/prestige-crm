/**
 * Shared helpers for Paterhaus P0 modules: CSV export, SLA timing, direction metadata.
 * Frontend-only, no backend dependencies.
 */

export type Direction = "property_management" | "snagging" | "staging";

export const DIRECTIONS: Direction[] = ["property_management", "snagging", "staging"];

export const directionLabelKey: Record<Direction, string> = {
  property_management: "direction.property_management",
  snagging: "direction.snagging",
  staging: "direction.staging",
};

export const directionDefaultLabel: Record<Direction, string> = {
  property_management: "Property Management",
  snagging: "Snagging",
  staging: "Staging",
};

/** Pipeline stage ids per direction (machine values, stable across i18n). */
export const PIPELINE_STAGES: Record<Direction, string[]> = {
  property_management: [
    "new",
    "first_response",
    "qualified",
    "assessment",
    "proposal",
    "agreement",
    "onboarding",
  ],
  snagging: [
    "inquiry",
    "details_confirmed",
    "quote_sent",
    "approved",
    "scheduled",
    "completed",
    "paid",
  ],
  staging: [
    "inquiry",
    "visit_scheduled",
    "proposal_sent",
    "approved",
    "scheduled",
    "completed",
    "paid",
  ],
};

export const stageLabelKey: Record<Direction, Record<string, string>> = {
  property_management: {
    new: "pipeline.new",
    first_response: "pipeline.first_response",
    qualified: "pipeline.qualified",
    assessment: "pipeline.assessment",
    proposal: "pipeline.proposal",
    agreement: "pipeline.agreement",
    onboarding: "pipeline.onboarding",
  },
  snagging: {
    inquiry: "pipeline.inquiry",
    details_confirmed: "pipeline.details_confirmed",
    quote_sent: "pipeline.quote_sent",
    approved: "pipeline.approved",
    scheduled: "pipeline.scheduled",
    completed: "pipeline.completed",
    paid: "pipeline.paid",
  },
  staging: {
    inquiry: "pipeline.inquiry",
    visit_scheduled: "pipeline.visit_scheduled",
    proposal_sent: "pipeline.proposal_sent",
    approved: "pipeline.approved",
    scheduled: "pipeline.scheduled",
    completed: "pipeline.completed",
    paid: "pipeline.paid",
  },
};

export const isDirection = (value: string): value is Direction =>
  value === "property_management" || value === "snagging" || value === "staging";

export type SLAStatus = "on_track" | "warning" | "overdue";

export const FIRST_RESPONSE_SLA_MINUTES = 15;

/**
 * Compute SLA status from minutes elapsed since the lead was created and the
 * optional first-response timestamp. Demo data is anchored to a fixed date so
 * we accept explicit elapsed minutes instead of reading the clock.
 */
export const computeSlaStatus = (
  firstResponseAt: string | null | undefined,
  elapsedMinutes: number,
  slaMinutes = FIRST_RESPONSE_SLA_MINUTES,
): SLAStatus => {
  if (firstResponseAt) return "on_track";
  if (elapsedMinutes >= slaMinutes) return "overdue";
  if (elapsedMinutes >= slaMinutes - 5) return "warning";
  return "on_track";
};

export const slaStatusKey: Record<SLAStatus, string> = {
  on_track: "sla.on_track",
  warning: "sla.warning",
  overdue: "sla.overdue",
};

export const slaStatusTone: Record<SLAStatus, string> = {
  on_track: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  overdue: "border-red-500/30 bg-red-500/10 text-red-300",
};

export const slaStatusGlyph: Record<SLAStatus, string> = {
  on_track: "✓",
  warning: "⚠",
  overdue: "✗",
};

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const stringified = String(value);
  if (/[",\n\r]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`;
  }
  return stringified;
};

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

/**
 * Build a CSV string from rows using either an explicit column list or the
 * union of object keys. Triggers a browser download via a Blob URL.
 */
export const exportToCsv = <T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: CsvColumn<T>[],
): void => {
  if (rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, filename);
    return;
  }

  let header: string[];
  let body: string;

  if (columns && columns.length > 0) {
    header = columns.map((column) => column.header);
    body = rows
      .map((row) => columns.map((column) => escapeCsvCell(column.accessor(row))).join(","))
      .join("\n");
  } else {
    header = Object.keys(rows[0]);
    body = rows
      .map((row) => header.map((key) => escapeCsvCell(row[key])).join(","))
      .join("\n");
  }

  const csv = [header.join(","), body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/** Format minutes as a compact human string (e.g. "12 min", "1.5 h"). */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = hours / 24;
  return `${days.toFixed(1)} d`;
};

/** Format days with one decimal, used by funnel time-to-stage. */
export const formatDays = (days: number): string => `${days.toFixed(1)} d`;
