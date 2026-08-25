import type {
  Booking,
  LeadFileAttachment,
  LeadTask,
  LostReason,
  MarketingAttribution,
  OwnerOpportunity,
  TimelineEvent,
} from "@/types/paterhaus";
import { PATERHAUS_TODAY } from "./selectors";
import { CURRENT_PATERHAUS_USER, RUSLAN_TSZI, SULTAN_SOVETOV } from "./team";

/* ------------------------------------------------------------------ */
/* P1.3 — Lost reasons                                                 */
/* ------------------------------------------------------------------ */

export const LOST_REASONS: { value: LostReason; labelKey: string; label: string }[] = [
  { value: "not_owner", labelKey: "lost.not_owner", label: "Not property owner" },
  { value: "outside_target_area", labelKey: "lost.outside_target_area", label: "Property outside target area" },
  { value: "long_term_tenant", labelKey: "lost.long_term_tenant", label: "Long-term tenant / unavailable" },
  { value: "income_mismatch", labelKey: "lost.income_mismatch", label: "Expected income mismatch" },
  { value: "fee_objection", labelKey: "lost.fee_objection", label: "Fee objection" },
  { value: "no_response", labelKey: "lost.no_response", label: "No response" },
  { value: "competitor", labelKey: "lost.competitor", label: "Competitor selected" },
  { value: "not_ready", labelKey: "lost.not_ready", label: "Not ready yet" },
  { value: "duplicate", labelKey: "lost.duplicate", label: "Duplicate" },
];

export const lostReasonLabel = (code?: LostReason): string | undefined => {
  if (!code) return undefined;
  return LOST_REASONS.find((item) => item.value === code)?.label;
};

/* ------------------------------------------------------------------ */
/* P1.1 — Demo data builders for timeline, tasks, files, attribution   */
/* ------------------------------------------------------------------ */

let timelineSeq = 0;
const tlId = () => `tl-${++timelineSeq}`;

const buildTimeline = (events: Omit<TimelineEvent, "id">[]): TimelineEvent[] =>
  events.map((event) => ({ ...event, id: tlId() }));

let leadTaskSeq = 0;
const ltId = () => `lt-${++leadTaskSeq}`;

const buildLeadTasks = (tasks: Omit<LeadTask, "id">[]): LeadTask[] =>
  tasks.map((task) => ({ ...task, id: ltId() }));

let leadFileSeq = 0;
const lfId = () => `lf-${++leadFileSeq}`;

const buildLeadFiles = (files: Omit<LeadFileAttachment, "id">[]): LeadFileAttachment[] =>
  files.map((file) => ({ ...file, id: lfId() }));

/* ------------------------------------------------------------------ */
/* P1.1 — Enrich existing opportunities with P1 demo data             */
/* ------------------------------------------------------------------ */

const attributionFor = (
  source: string,
  platform: MarketingAttribution["platform"],
  campaignName: string,
  campaignId: string,
  adName: string,
  firstTouchAt: string,
): MarketingAttribution => ({
  originalSource: source,
  platform,
  campaignId,
  campaignName,
  adSetId: `${campaignId}-adset-01`,
  adSetName: `${campaignName} — Lookalike 1%`,
  adId: `${campaignId}-ad-01`,
  adName,
  leadFormId: `${campaignId}-form-01`,
  leadFormName: `${campaignName} — Lead Form`,
  utmSource: platform === "facebook" ? "facebook" : platform === "instagram" ? "instagram" : source.toLowerCase(),
  utmMedium: "paid_social",
  utmCampaign: campaignId,
  utmContent: adName,
  firstTouchAt,
  capturedAt: firstTouchAt,
});

/**
 * Returns a deep-enriched copy of the opportunities with P1 fields
 * (timeline, leadTasks, leadFiles, marketingAttribution, createdAt, tags).
 * Pure function — does not mutate the input.
 */
export const enrichOpportunitiesWithP1 = (base: OwnerOpportunity[]): OwnerOpportunity[] =>
  base.map((opportunity) => {
    const created = opportunity.lastCommunication
      ? `${opportunity.lastCommunication}T10:00:00`
      : `${PATERHAUS_TODAY}T10:00:00`;

    // Build a realistic timeline per opportunity
    const timeline = buildTimeline([
      {
        type: "form_submitted",
        timestamp: created,
        details: `Meta Lead Form submitted by ${opportunity.ownerName}`,
        userName: opportunity.ownerName,
      },
      {
        type: "lead_created",
        timestamp: created,
        details: "Lead created in CRM",
        userName: "System",
      },
      {
        type: "assigned",
        timestamp: created,
        details: `Assigned to ${opportunity.assignedTo}`,
        userName: CURRENT_PATERHAUS_USER.name,
      },
      ...(opportunity.firstResponseAt
        ? [
            {
              type: "whatsapp_message" as const,
              timestamp: opportunity.firstResponseAt,
              details: `First response sent via WhatsApp (${opportunity.firstResponseMinutes ?? 0} min)`,
              userName: opportunity.assignedTo,
            },
          ]
        : []),
      {
        type: "stage_changed",
        timestamp: `${opportunity.lastCommunication}T11:15:00`,
        details: `Stage changed: New Lead → ${opportunity.stage}`,
        userName: opportunity.assignedTo,
      },
      {
        type: "task_created",
        timestamp: `${opportunity.lastCommunication}T11:17:00`,
        details: `Task created: ${opportunity.nextAction}`,
        userName: opportunity.assignedTo,
      },
      ...(opportunity.lostReason
        ? [
            {
              type: "lost" as const,
              timestamp: `${opportunity.lastCommunication}T17:00:00`,
              details: `Lead closed: ${opportunity.lostReason}`,
              userName: opportunity.assignedTo,
            },
          ]
        : []),
    ]);

    // Build lead-scoped tasks
    const leadTasks = buildLeadTasks([
      {
        type: "call",
        title: "Qualify investment objectives",
        dueAt: `${opportunity.lastCommunication}T15:00:00`,
        status: "completed" as const,
        completedAt: `${opportunity.lastCommunication}T14:30:00`,
        assignee: opportunity.assignedTo,
      },
      {
        type: "whatsapp",
        title: `Send revenue proposal to ${opportunity.ownerName.split(" ")[0]}`,
        dueAt: `${opportunity.lastCommunication}T17:00:00`,
        status: opportunity.stage === "Lost / Not Proceeding" ? ("overdue" as const) : ("pending" as const),
        assignee: opportunity.assignedTo,
      },
      ...(opportunity.direction === "snagging" || opportunity.direction === "staging"
        ? [
            {
              type: "assessment" as const,
              title: "Schedule site visit",
              dueAt: `${PATERHAUS_TODAY}T11:00:00`,
              status: "pending" as const,
              assignee: opportunity.assignedTo,
            },
          ]
        : [
            {
              type: "assessment" as const,
              title: "Book property assessment",
              dueAt: `${PATERHAUS_TODAY}T11:00:00`,
              status: "pending" as const,
              assignee: opportunity.assignedTo,
            },
          ]),
      {
        type: "follow_up",
        title: `Follow up with ${opportunity.ownerName.split(" ")[0]}`,
        dueAt: `${PATERHAUS_TODAY}T16:00:00`,
        status: "pending" as const,
        assignee: opportunity.assignedTo,
      },
    ]);

    // Build lead files
    const leadFiles = buildLeadFiles([
      {
        name: `Owner_${opportunity.ownerName.split(" ")[0]}_ID.pdf`,
        type: "document",
        sizeKb: 412,
        uploadedAt: `${opportunity.lastCommunication}T11:20:00`,
        uploadedBy: opportunity.assignedTo,
      },
      {
        name: `Property_${opportunity.area.replace(/\s+/g, "_")}_photos.zip`,
        type: "image",
        sizeKb: 8420,
        uploadedAt: `${opportunity.lastCommunication}T13:45:00`,
        uploadedBy: opportunity.assignedTo,
      },
      ...(opportunity.direction === "snagging"
        ? [
            {
              name: "Snagging_checklist_draft.pdf",
              type: "document" as const,
              sizeKb: 180,
              uploadedAt: `${opportunity.lastCommunication}T14:00:00`,
              uploadedBy: opportunity.assignedTo,
            },
          ]
        : []),
      ...(opportunity.direction === "staging"
        ? [
            {
              name: "Staging_moodboard_v1.pdf",
              type: "image" as const,
              sizeKb: 2240,
              uploadedAt: `${opportunity.lastCommunication}T14:10:00`,
              uploadedBy: opportunity.assignedTo,
            },
          ]
        : []),
    ]);

    // Build marketing attribution
    const isMeta = opportunity.leadSource === "Meta Lead Ads" || opportunity.leadSource === "Instagram DM";
    const marketingAttribution: MarketingAttribution | undefined = isMeta
      ? attributionFor(
          opportunity.leadSource,
          opportunity.leadSource === "Instagram DM" ? "instagram" : "facebook",
          opportunity.campaignId === "camp-005"
            ? "Snagging Season — Handover Inspections"
            : opportunity.campaignId === "camp-006"
              ? "Staging & Listing Makeover"
              : "Dubai Marina Owner Leads",
          opportunity.campaignId ?? "camp-001",
          `${opportunity.area} — Lead Ad`,
          created,
        )
      : opportunity.leadSource === "WhatsApp"
        ? attributionFor("WhatsApp", "whatsapp", "WhatsApp Inbound", "wa-organic", `${opportunity.area} — WhatsApp`, created)
        : opportunity.leadSource === "Website"
          ? attributionFor("Website", "website", "Organic Website", "web-organic", `${opportunity.area} — Website form`, created)
          : undefined;

    // Tags for segmentation
    const tags: string[] = [];
    if (opportunity.priority === "High" || opportunity.priority === "Urgent") tags.push("high-priority");
    if (opportunity.direction === "snagging") tags.push("snagging");
    if (opportunity.direction === "staging") tags.push("staging");
    if (opportunity.leadSource === "Meta Lead Ads") tags.push("meta-lead");
    if (opportunity.leadSource === "Referral") tags.push("referral");
    if (opportunity.stage === "Lost / Not Proceeding") tags.push("lost");

    return {
      ...opportunity,
      createdAt: created,
      timeline,
      leadTasks,
      leadFiles,
      marketingAttribution,
      tags,
      // Map existing free-text lostReason to a structured code where possible
      lostReasonCode:
        opportunity.stage === "Lost / Not Proceeding"
          ? opportunity.lostReason?.toLowerCase().includes("fee")
            ? "fee_objection"
            : opportunity.lostReason?.toLowerCase().includes("long-term") || opportunity.lostReason?.toLowerCase().includes("leasing")
              ? "long_term_tenant"
              : "not_ready"
          : undefined,
      lostAt: opportunity.stage === "Lost / Not Proceeding" ? `${opportunity.lastCommunication}T17:00:00` : undefined,
    };
  });

/* ------------------------------------------------------------------ */
/* P1.2 — Demo bookings                                               */
/* ------------------------------------------------------------------ */

export const demoBookings: Booking[] = [
  {
    id: "book-001",
    leadId: "opp-03",
    leadName: "Laila Haddad",
    type: "property_assessment",
    proposedSlots: [
      `${PATERHAUS_TODAY}T10:00:00`,
      `${PATERHAUS_TODAY}T14:00:00`,
      "2025-08-21T11:00:00",
    ],
    selectedSlot: "2025-08-21T11:00:00",
    status: "confirmed",
    createdAt: `${PATERHAUS_TODAY}T09:00:00`,
    confirmedAt: `${PATERHAUS_TODAY}T09:30:00`,
    area: "Dubai Hills Estate",
    notes: "Cedar Villa — bring revenue comparison pack",
  },
  {
    id: "book-002",
    leadId: "opp-04",
    leadName: "Victor Chen",
    type: "property_assessment",
    proposedSlots: [
      "2025-08-22T10:00:00",
      "2025-08-22T15:00:00",
    ],
    selectedSlot: "2025-08-22T15:00:00",
    status: "confirmed",
    createdAt: `${PATERHAUS_TODAY}T08:30:00`,
    confirmedAt: `${PATERHAUS_TODAY}T10:00:00`,
    area: "JBR",
    notes: "JBR Horizon 1903 — furnishing audit",
  },
  {
    id: "book-003",
    leadId: "opp-02",
    leadName: "Daniel Foster",
    type: "call",
    proposedSlots: [
      `${PATERHAUS_TODAY}T16:00:00`,
      "2025-08-21T09:00:00",
    ],
    selectedSlot: "2025-08-21T09:00:00",
    status: "confirmed",
    createdAt: `${PATERHAUS_TODAY}T07:00:00`,
    confirmedAt: `${PATERHAUS_TODAY}T08:00:00`,
    area: "Business Bay",
    notes: "Revenue proposal walk-through call",
  },
  {
    id: "book-004",
    leadId: "opp-13",
    leadName: "Hassan Al Marri",
    type: "property_assessment",
    proposedSlots: [
      "2025-08-23T10:00:00",
      "2025-08-23T13:00:00",
    ],
    status: "pending",
    createdAt: `${PATERHAUS_TODAY}T11:00:00`,
    area: "Business Bay",
    notes: "Business Bay Tower 2101 — snagging inspection quote",
  },
  {
    id: "book-005",
    leadId: "opp-17",
    leadName: "Lina Park",
    type: "property_assessment",
    proposedSlots: [
      "2025-08-24T11:00:00",
      "2025-08-24T16:00:00",
    ],
    selectedSlot: "2025-08-24T11:00:00",
    status: "confirmed",
    createdAt: `${PATERHAUS_TODAY}T12:00:00`,
    confirmedAt: `${PATERHAUS_TODAY}T13:00:00`,
    area: "Palm Jumeirah",
    notes: "Palm Crescent Villa 12 — staging site visit",
  },
  {
    id: "book-006",
    leadId: "opp-01",
    leadName: "Mariam Al Noor",
    type: "follow_up",
    proposedSlots: [
      "2025-08-21T15:00:00",
    ],
    selectedSlot: "2025-08-21T15:00:00",
    status: "confirmed",
    createdAt: `${PATERHAUS_TODAY}T10:00:00`,
    confirmedAt: `${PATERHAUS_TODAY}T10:30:00`,
    area: "Palm Jumeirah",
    notes: "Follow-up call after first response",
  },
];

/* ------------------------------------------------------------------ */
/* P1.4 — Tag presets for bulk actions                                */
/* ------------------------------------------------------------------ */

export const TAG_PRESETS: string[] = [
  "high-priority",
  "vip",
  "meta-lead",
  "referral",
  "snagging",
  "staging",
  "dubai-marina",
  "palm-jumeirah",
  "downtown",
  "needs-follow-up",
];

/* Re-export team for convenience in modules that already import from here. */
export { RUSLAN_TSZI, SULTAN_SOVETOV };
