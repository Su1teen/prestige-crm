import type { Direction } from "@/components/paterhaus/p0Shared";

export type CampaignPlatform = "facebook" | "instagram";

export type Campaign = {
  id: string;
  name: string;
  platform: CampaignPlatform;
  spendUsd: number;
  leads: number;
  qualified: number;
  won: number;
  period: string;
  /** P0.2: which business direction this campaign feeds. */
  direction: Direction;
};

export type MarketingLeadSource = "meta_lead_ads" | "instagram_dm" | "website" | "referral" | "manual";

export type MarketingLeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "won" | "lost";

export type MarketingLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: MarketingLeadSource;
  campaignId?: string;
  status: MarketingLeadStatus;
  assignedTo?: string;
  propertyArea?: string;
  propertyType?: "apartment" | "villa" | "townhouse" | "other";
  bedrooms?: number;
  createdAt: string;
};

export type LeadMessage = {
  id: string;
  opportunityId: string;
  direction: "inbound" | "outbound";
  channel: "whatsapp";
  text: string;
  timestamp: string;
};

/** Average annual management fee used for demo pipeline-value estimates. */
export const AVERAGE_MANAGEMENT_FEE_USD = 4800;

export const demoCampaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "Dubai Marina Owner Leads — Aug 2026",
    platform: "instagram",
    spendUsd: 2100,
    leads: 62,
    qualified: 19,
    won: 3,
    period: "Aug 2026",
    direction: "property_management",
  },
  {
    id: "camp-002",
    name: "Palm Jumeirah Portfolio — Aug 2026",
    platform: "facebook",
    spendUsd: 1450,
    leads: 23,
    qualified: 11,
    won: 2,
    period: "Aug 2026",
    direction: "property_management",
  },
  {
    id: "camp-003",
    name: "JBR High-Net-Worth Owners — Jul 2026",
    platform: "instagram",
    spendUsd: 3200,
    leads: 47,
    qualified: 21,
    won: 4,
    period: "Jul 2026",
    direction: "property_management",
  },
  {
    id: "camp-004",
    name: "Downtown & Business Bay Landlords — Aug 2026",
    platform: "facebook",
    spendUsd: 980,
    leads: 18,
    qualified: 6,
    won: 1,
    period: "Aug 2026",
    direction: "property_management",
  },
  {
    id: "camp-005",
    name: "Snagging Season — Handover Inspections — Aug 2026",
    platform: "facebook",
    spendUsd: 720,
    leads: 34,
    qualified: 18,
    won: 12,
    period: "Aug 2026",
    direction: "snagging",
  },
  {
    id: "camp-006",
    name: "Staging & Listing Makeover — Aug 2026",
    platform: "instagram",
    spendUsd: 800,
    leads: 21,
    qualified: 14,
    won: 9,
    period: "Aug 2026",
    direction: "staging",
  },
];

export const demoMarketingLeads: MarketingLead[] = [
  {
    id: "mlead-001",
    name: "Ahmed Khalid",
    phone: "+971 50 234 8812",
    email: "ahmed.khalid@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-001",
    status: "qualified",
    assignedTo: "Ruslan Tszi",
    propertyArea: "Dubai Marina",
    propertyType: "apartment",
    bedrooms: 2,
    createdAt: "2026-08-04",
  },
  {
    id: "mlead-002",
    name: "Fatima Al Mansouri",
    phone: "+971 55 611 2094",
    email: "fatima.mansouri@outlook.com",
    source: "meta_lead_ads",
    campaignId: "camp-001",
    status: "contacted",
    assignedTo: "Sultan Sovetov",
    propertyArea: "Dubai Marina",
    propertyType: "apartment",
    bedrooms: 1,
    createdAt: "2026-08-06",
  },
  {
    id: "mlead-003",
    name: "John Reynolds",
    phone: "+971 52 447 9038",
    email: "j.reynolds@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-002",
    status: "won",
    assignedTo: "Ruslan Tszi",
    propertyArea: "Palm Jumeirah",
    propertyType: "villa",
    bedrooms: 4,
    createdAt: "2026-08-02",
  },
  {
    id: "mlead-004",
    name: "Mohammed Bin Rashid",
    phone: "+971 50 882 4471",
    email: "m.binrashid@hotmail.com",
    source: "instagram_dm",
    campaignId: "camp-001",
    status: "new",
    propertyArea: "Dubai Marina",
    propertyType: "apartment",
    bedrooms: 3,
    createdAt: "2026-08-18",
  },
  {
    id: "mlead-005",
    name: "Elena Petrova",
    phone: "+971 56 903 7715",
    email: "elena.petrova@yandex.com",
    source: "meta_lead_ads",
    campaignId: "camp-003",
    status: "proposal_sent",
    assignedTo: "Sultan Sovetov",
    propertyArea: "JBR",
    propertyType: "apartment",
    bedrooms: 2,
    createdAt: "2026-07-21",
  },
  {
    id: "mlead-006",
    name: "Sarah Whitfield",
    phone: "+971 54 128 6650",
    email: "sarah.whitfield@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-003",
    status: "won",
    assignedTo: "Ruslan Tszi",
    propertyArea: "JBR",
    propertyType: "apartment",
    bedrooms: 3,
    createdAt: "2026-07-14",
  },
  {
    id: "mlead-007",
    name: "Omar Haddad",
    phone: "+971 50 356 2287",
    email: "omar.haddad@gmail.com",
    source: "website",
    status: "qualified",
    assignedTo: "Sultan Sovetov",
    propertyArea: "Business Bay",
    propertyType: "apartment",
    bedrooms: 1,
    createdAt: "2026-08-11",
  },
  {
    id: "mlead-008",
    name: "Priya Sharma",
    phone: "+971 55 740 1198",
    email: "priya.sharma@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-004",
    status: "contacted",
    assignedTo: "Ruslan Tszi",
    propertyArea: "Downtown",
    propertyType: "apartment",
    bedrooms: 2,
    createdAt: "2026-08-09",
  },
  {
    id: "mlead-009",
    name: "David Chen",
    phone: "+971 52 619 3342",
    email: "david.chen@icloud.com",
    source: "referral",
    status: "won",
    assignedTo: "Ruslan Tszi",
    propertyArea: "Palm Jumeirah",
    propertyType: "townhouse",
    bedrooms: 3,
    createdAt: "2026-07-28",
  },
  {
    id: "mlead-010",
    name: "Layla Ibrahim",
    phone: "+971 56 284 7709",
    email: "layla.ibrahim@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-002",
    status: "qualified",
    assignedTo: "Sultan Sovetov",
    propertyArea: "Palm Jumeirah",
    propertyType: "villa",
    bedrooms: 5,
    createdAt: "2026-08-13",
  },
  {
    id: "mlead-011",
    name: "Tom Becker",
    phone: "+971 54 992 5510",
    email: "tom.becker@gmx.de",
    source: "instagram_dm",
    campaignId: "camp-003",
    status: "lost",
    propertyArea: "JBR",
    propertyType: "apartment",
    bedrooms: 1,
    createdAt: "2026-07-19",
  },
  {
    id: "mlead-012",
    name: "Aisha Al Zaabi",
    phone: "+971 50 471 8823",
    email: "aisha.alzaabi@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-004",
    status: "new",
    propertyArea: "Business Bay",
    propertyType: "apartment",
    bedrooms: 2,
    createdAt: "2026-08-19",
  },
  {
    id: "mlead-013",
    name: "Nikolai Volkov",
    phone: "+971 55 337 6604",
    email: "n.volkov@gmail.com",
    source: "manual",
    status: "contacted",
    assignedTo: "Sultan Sovetov",
    propertyArea: "Dubai Marina",
    propertyType: "apartment",
    bedrooms: 3,
    createdAt: "2026-08-15",
  },
  {
    id: "mlead-014",
    name: "Grace Osei",
    phone: "+971 52 806 4419",
    email: "grace.osei@gmail.com",
    source: "meta_lead_ads",
    campaignId: "camp-001",
    status: "proposal_sent",
    assignedTo: "Ruslan Tszi",
    propertyArea: "Dubai Marina",
    propertyType: "apartment",
    bedrooms: 2,
    createdAt: "2026-08-08",
  },
];

export type MarketingPeriod = "this_month" | "last_month" | "last_90";

export const marketingPeriodLabels: Record<MarketingPeriod, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_90: "Last 90 days",
};

export const campaignMatchesPeriod = (campaign: Campaign, period: MarketingPeriod): boolean => {
  if (period === "last_90") return true;
  if (period === "this_month") return campaign.period === "Aug 2026";
  return campaign.period === "Jul 2026";
};

export type FunnelStage = { label: string; value: number };

export const marketingFunnels: Record<MarketingPeriod, FunnelStage[]> = {
  this_month: [
    { label: "Ad impressions", value: 18600 },
    { label: "Landing / form visits", value: 740 },
    { label: "Leads", value: 85 },
    { label: "Contacted", value: 61 },
    { label: "Qualified", value: 27 },
    { label: "Proposal sent", value: 10 },
    { label: "Won owners", value: 4 },
  ],
  last_month: [
    { label: "Ad impressions", value: 9800 },
    { label: "Landing / form visits", value: 400 },
    { label: "Leads", value: 47 },
    { label: "Contacted", value: 33 },
    { label: "Qualified", value: 14 },
    { label: "Proposal sent", value: 6 },
    { label: "Won owners", value: 2 },
  ],
  last_90: [
    { label: "Ad impressions", value: 28400 },
    { label: "Landing / form visits", value: 1140 },
    { label: "Leads", value: 132 },
    { label: "Contacted", value: 94 },
    { label: "Qualified", value: 41 },
    { label: "Proposal sent", value: 16 },
    { label: "Won owners", value: 6 },
  ],
};

export type AreaQualityRow = { area: string; leads: number; qualified: number; won: number };

export const leadQualityByArea: AreaQualityRow[] = [
  { area: "Dubai Marina", leads: 42, qualified: 14, won: 2 },
  { area: "Palm Jumeirah", leads: 28, qualified: 12, won: 3 },
  { area: "Downtown Dubai", leads: 19, qualified: 7, won: 1 },
  { area: "Other areas", leads: 43, qualified: 8, won: 0 },
];

export type FollowUpPerformance = {
  newLeadsAwaitingResponse: number;
  contactedWithin15MinPct: number;
  averageFirstResponseMinutes: number;
  followUpsOverdue: number;
  topResponder: string;
};

export const followUpPerformance: FollowUpPerformance = {
  newLeadsAwaitingResponse: 3,
  contactedWithin15MinPct: 83,
  averageFirstResponseMinutes: 11,
  followUpsOverdue: 4,
  topResponder: "Ruslan Tszi",
};

export type LeadScoreLevel = "high" | "medium" | "low";

export type LeadScore = { level: LeadScoreLevel; reason: string };

const highIntentAreas = ["Dubai Marina", "Palm Jumeirah", "JBR"];

export const scoreMarketingLead = (lead: MarketingLead): LeadScore => {
  const areaLabel = lead.propertyArea ?? "an unspecified area";
  const unitLabel = `${lead.bedrooms ? `${lead.bedrooms}BR ` : ""}${lead.propertyType ?? "property"}`;
  if (
    lead.propertyArea &&
    highIntentAreas.includes(lead.propertyArea) &&
    lead.bedrooms !== undefined &&
    lead.bedrooms >= 2
  ) {
    return {
      level: "high",
      reason: `Owner of a ${unitLabel} in ${areaLabel}, submitted contact details and requested a revenue estimate.`,
    };
  }
  if (lead.propertyArea && lead.propertyType) {
    return {
      level: "medium",
      reason: `Provided property details for a ${unitLabel} in ${areaLabel}; engagement so far is limited to the initial enquiry.`,
    };
  }
  return {
    level: "low",
    reason: "Enquiry is missing property details; qualify the area and unit type on the first call.",
  };
};

export type AutomationPreview = { id: string; trigger: string; steps: string[] };

export const automationPreviews: AutomationPreview[] = [
  {
    id: "auto-01",
    trigger: "New Meta lead",
    steps: ["Assign to Owner Acquisition", "Create follow-up in 15 min", "Notify assigned manager"],
  },
  {
    id: "auto-02",
    trigger: "No reply after 24 hours",
    steps: ["Create follow-up task", "Add \u201cNeeds attention\u201d tag"],
  },
  {
    id: "auto-03",
    trigger: "Lead marked as Qualified",
    steps: ["Create property assessment task", "Notify Sales Manager"],
  },
  {
    id: "auto-04",
    trigger: "Agreement signed",
    steps: ["Create property onboarding checklist", "Move lead to Owner"],
  },
];

export type AudienceSegment = {
  id: string;
  label: string;
  matches: (lead: MarketingLead) => boolean;
};

export const audienceSegments: AudienceSegment[] = [
  {
    id: "seg-high-intent",
    label: "High-Intent Owners",
    matches: (lead) => scoreMarketingLead(lead).level === "high",
  },
  {
    id: "seg-marina",
    label: "Dubai Marina Owners",
    matches: (lead) => lead.propertyArea === "Dubai Marina",
  },
  {
    id: "seg-palm",
    label: "Palm Jumeirah Owners",
    matches: (lead) => lead.propertyArea === "Palm Jumeirah",
  },
  {
    id: "seg-uncontacted",
    label: "Uncontacted Leads",
    matches: (lead) => lead.status === "new",
  },
  {
    id: "seg-proposal",
    label: "Proposal Sent",
    matches: (lead) => lead.status === "proposal_sent",
  },
  {
    id: "seg-referrals",
    label: "Past Owners / Referrals",
    matches: (lead) => lead.source === "referral",
  },
];

export const demoLeadMessages: LeadMessage[] = [
  {
    id: "lmsg-001",
    opportunityId: "opp-01",
    direction: "inbound",
    channel: "whatsapp",
    text: "Hi, I saw your ad about property management for Palm Jumeirah. My apartment is fully furnished — what fee do you charge?",
    timestamp: "2025-08-18T10:12:00",
  },
  {
    id: "lmsg-002",
    opportunityId: "opp-01",
    direction: "outbound",
    channel: "whatsapp",
    text: "Hello Mariam! Thanks for reaching out. For full-service management we charge 15% of rental revenue. Could we schedule a quick call to discuss your unit?",
    timestamp: "2025-08-18T10:26:00",
  },
  {
    id: "lmsg-003",
    opportunityId: "opp-01",
    direction: "inbound",
    channel: "whatsapp",
    text: "Sounds reasonable. I'm available tomorrow after 3 PM.",
    timestamp: "2025-08-18T11:02:00",
  },
  {
    id: "lmsg-004",
    opportunityId: "opp-02",
    direction: "inbound",
    channel: "whatsapp",
    text: "Hi, comparing a few operators for my Business Bay unit. Can you share your average occupancy rates?",
    timestamp: "2025-08-19T09:40:00",
  },
  {
    id: "lmsg-005",
    opportunityId: "opp-02",
    direction: "outbound",
    channel: "whatsapp",
    text: "Hi Daniel, our Business Bay portfolio runs at 86% average occupancy. I'll send our revenue proposal today with a like-for-like comparison.",
    timestamp: "2025-08-19T09:55:00",
  },
  {
    id: "lmsg-006",
    opportunityId: "opp-03",
    direction: "outbound",
    channel: "whatsapp",
    text: "Hi Laila, the final revenue range for Cedar Villa is ready. Sharing the proposal document here shortly.",
    timestamp: "2025-08-18T16:20:00",
  },
];

/* ------------------------------------------------------------------ */
/* P0.1 — Conversion Funnel                                            */
/* ------------------------------------------------------------------ */

export type FunnelStageRow = {
  id: string;
  /** i18n key — falls back to the literal label if no translation exists. */
  labelKey: string;
  /** Fallback label used when no i18n key resolves. */
  label: string;
  order: number;
  count: number;
  /** Conversion from the previous stage, in percent. First stage = 100. */
  conversionFromPrevious: number;
  /** Average days to reach this stage from lead creation. */
  timeToStage: number;
};

export type ConversionFunnel = {
  direction: Direction;
  stages: FunnelStageRow[];
  /** (Agreement Signed / Total Leads) × 100, rounded. */
  overallConversion: number;
  /** Average days from lead creation to signed agreement. */
  averageTimeToSigned: number;
};

const propertyManagementFunnel: ConversionFunnel = {
  direction: "property_management",
  overallConversion: 15,
  averageTimeToSigned: 18,
  stages: [
    { id: "pm-1", labelKey: "funnel.pm.submitted", label: "Meta Lead Form Submitted", order: 1, count: 100, conversionFromPrevious: 100, timeToStage: 0 },
    { id: "pm-2", labelKey: "funnel.pm.first_response", label: "First Response Sent", order: 2, count: 85, conversionFromPrevious: 85, timeToStage: 0.2 },
    { id: "pm-3", labelKey: "funnel.pm.qualified", label: "Qualified Owner", order: 3, count: 45, conversionFromPrevious: 53, timeToStage: 2 },
    { id: "pm-4", labelKey: "funnel.pm.assessment", label: "Property Assessment Booked", order: 4, count: 30, conversionFromPrevious: 67, timeToStage: 5 },
    { id: "pm-5", labelKey: "funnel.pm.estimate", label: "Revenue Estimate Sent", order: 5, count: 25, conversionFromPrevious: 83, timeToStage: 7 },
    { id: "pm-6", labelKey: "funnel.pm.proposal", label: "Proposal Sent", order: 6, count: 20, conversionFromPrevious: 80, timeToStage: 10 },
    { id: "pm-7", labelKey: "funnel.pm.signed", label: "Agreement Signed", order: 7, count: 15, conversionFromPrevious: 75, timeToStage: 18 },
  ],
};

const snaggingFunnel: ConversionFunnel = {
  direction: "snagging",
  overallConversion: 35,
  averageTimeToSigned: 6,
  stages: [
    { id: "sn-1", labelKey: "funnel.sn.inquiry", label: "Inquiry Received", order: 1, count: 100, conversionFromPrevious: 100, timeToStage: 0 },
    { id: "sn-2", labelKey: "funnel.sn.details", label: "Details Confirmed", order: 2, count: 78, conversionFromPrevious: 78, timeToStage: 0.3 },
    { id: "sn-3", labelKey: "funnel.sn.quote", label: "Quote Sent", order: 3, count: 60, conversionFromPrevious: 77, timeToStage: 1 },
    { id: "sn-4", labelKey: "funnel.sn.approved", label: "Quote Approved", order: 4, count: 48, conversionFromPrevious: 80, timeToStage: 2 },
    { id: "sn-5", labelKey: "funnel.sn.scheduled", label: "Inspection Scheduled", order: 5, count: 42, conversionFromPrevious: 88, timeToStage: 3 },
    { id: "sn-6", labelKey: "funnel.sn.completed", label: "Inspection Completed", order: 6, count: 38, conversionFromPrevious: 90, timeToStage: 5 },
    { id: "sn-7", labelKey: "funnel.sn.paid", label: "Invoice Paid", order: 7, count: 35, conversionFromPrevious: 92, timeToStage: 6 },
  ],
};

const stagingFunnel: ConversionFunnel = {
  direction: "staging",
  overallConversion: 43,
  averageTimeToSigned: 8,
  stages: [
    { id: "st-1", labelKey: "funnel.st.inquiry", label: "Inquiry Received", order: 1, count: 100, conversionFromPrevious: 100, timeToStage: 0 },
    { id: "st-2", labelKey: "funnel.st.visit", label: "Site Visit Scheduled", order: 2, count: 72, conversionFromPrevious: 72, timeToStage: 1 },
    { id: "st-3", labelKey: "funnel.st.proposal", label: "Proposal Sent", order: 3, count: 58, conversionFromPrevious: 81, timeToStage: 3 },
    { id: "st-4", labelKey: "funnel.st.approved", label: "Proposal Approved", order: 4, count: 52, conversionFromPrevious: 90, timeToStage: 4 },
    { id: "st-5", labelKey: "funnel.st.scheduled", label: "Staging Scheduled", order: 5, count: 48, conversionFromPrevious: 92, timeToStage: 5 },
    { id: "st-6", labelKey: "funnel.st.completed", label: "Staging Completed", order: 6, count: 45, conversionFromPrevious: 94, timeToStage: 7 },
    { id: "st-7", labelKey: "funnel.st.paid", label: "Invoice Paid", order: 7, count: 43, conversionFromPrevious: 96, timeToStage: 8 },
  ],
};

export const conversionFunnels: Record<Direction, ConversionFunnel> = {
  property_management: propertyManagementFunnel,
  snagging: snaggingFunnel,
  staging: stagingFunnel,
};

/* ------------------------------------------------------------------ */
/* P0.2 — Direction metrics                                            */
/* ------------------------------------------------------------------ */

export type DirectionMetrics = {
  direction: Direction;
  spend: number;
  leads: number;
  qualified: number;
  signed: number;
  costPerSigned: number;
};

export const directionMetrics: DirectionMetrics[] = [
  { direction: "property_management", spend: 3550, leads: 85, qualified: 30, signed: 5, costPerSigned: 710 },
  { direction: "snagging", spend: 1200, leads: 34, qualified: 18, signed: 12, costPerSigned: 100 },
  { direction: "staging", spend: 800, leads: 21, qualified: 14, signed: 9, costPerSigned: 89 },
];

/* ------------------------------------------------------------------ */
/* P0.6 — Saved segments                                               */
/* ------------------------------------------------------------------ */

export type SegmentFilters = {
  source?: MarketingLead["source"][];
  campaign?: string[];
  status?: MarketingLead["status"][];
  direction?: Direction[];
  manager?: string[];
  area?: string[];
  highIntentOnly?: boolean;
  uncontactedOnly?: boolean;
};

export type SavedSegment = {
  id: string;
  name: string;
  /** i18n key for the display name. */
  nameKey?: string;
  filters: SegmentFilters;
  type: "lead" | "owner" | "campaign";
};

export const presetSegments: SavedSegment[] = [
  { id: "high_intent", name: "High-intent owners", nameKey: "segment.high_intent", filters: { highIntentOnly: true }, type: "lead" },
  { id: "no_response", name: "New Meta leads — no response", nameKey: "segment.no_response", filters: { uncontactedOnly: true, source: ["meta_lead_ads"] }, type: "lead" },
  { id: "marina", name: "Dubai Marina owners", nameKey: "segment.marina", filters: { area: ["Dubai Marina"] }, type: "lead" },
  { id: "palm", name: "Palm Jumeirah owners", nameKey: "segment.palm", filters: { area: ["Palm Jumeirah"] }, type: "lead" },
  { id: "assessment", name: "Assessment booked", nameKey: "segment.assessment", filters: { status: ["qualified"] }, type: "owner" },
  { id: "proposal", name: "Proposal sent", nameKey: "segment.proposal", filters: { status: ["proposal_sent"] }, type: "lead" },
  { id: "lost_fee", name: "Lost: fee objection", nameKey: "segment.lost_fee", filters: { status: ["lost"] }, type: "lead" },
  { id: "referral", name: "Past owners / referral potential", nameKey: "segment.referral", filters: { source: ["referral"] }, type: "lead" },
];

export const segmentMatchesLead = (segment: SavedSegment, lead: MarketingLead): boolean => {
  const { filters } = segment;
  if (filters.source?.length && !filters.source.includes(lead.source)) return false;
  if (filters.campaign?.length && (!lead.campaignId || !filters.campaign.includes(lead.campaignId))) return false;
  if (filters.status?.length && !filters.status.includes(lead.status)) return false;
  if (filters.manager?.length && (!lead.assignedTo || !filters.manager.includes(lead.assignedTo))) return false;
  if (filters.area?.length && (!lead.propertyArea || !filters.area.includes(lead.propertyArea))) return false;
  if (filters.highIntentOnly && scoreMarketingLead(lead).level !== "high") return false;
  if (filters.uncontactedOnly && lead.status !== "new") return false;
  return true;
};

/* ------------------------------------------------------------------ */
/* P0.4 — AI WhatsApp Bot lead intake                                  */
/* ------------------------------------------------------------------ */

export type WhatsAppIntent = "owner_lead" | "owner_issue" | "guest_issue" | "vendor";

export type WhatsAppLeadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  text: string;
  timestamp: string;
  /** AI vs human vs contact author. */
  author: "contact" | "ai" | "team";
};

export type WhatsAppLead = {
  id: string;
  phoneNumber: string;
  contactName: string;
  intent: WhatsAppIntent;
  direction: Direction;
  conversationId?: string;
  opportunityId?: string;
  assignedTo?: string;
  createdAt: string;
  firstResponseAt?: string;
  firstResponseMinutes?: number;
  qualified: boolean;
  escalated: boolean;
  messages: WhatsAppLeadMessage[];
};

export const demoWhatsAppLeads: WhatsAppLead[] = [
  {
    id: "wa-001",
    phoneNumber: "+971 50 234 8812",
    contactName: "Mariam Al Noor",
    intent: "owner_lead",
    direction: "property_management",
    opportunityId: "opp-01",
    assignedTo: "Sultan Sovetov",
    createdAt: "2025-08-18T10:12:00",
    firstResponseAt: "2025-08-18T10:26:00",
    firstResponseMinutes: 14,
    qualified: true,
    escalated: false,
    messages: [
      { id: "wa-001-m1", direction: "inbound", author: "contact", text: "Hi, I saw your ad about property management for Palm Jumeirah. My apartment is fully furnished — what fee do you charge?", timestamp: "2025-08-18T10:12:00" },
      { id: "wa-001-m2", direction: "outbound", author: "ai", text: "Hello Mariam! Thanks for reaching out. For full-service management we charge 15% of rental revenue. Could we schedule a quick call to discuss your unit?", timestamp: "2025-08-18T10:26:00" },
      { id: "wa-001-m3", direction: "inbound", author: "contact", text: "Sounds reasonable. I'm available tomorrow after 3 PM.", timestamp: "2025-08-18T11:02:00" },
    ],
  },
  {
    id: "wa-002",
    phoneNumber: "+971 55 611 2094",
    contactName: "Daniel Foster",
    intent: "owner_lead",
    direction: "property_management",
    opportunityId: "opp-02",
    assignedTo: "Ruslan Tszi",
    createdAt: "2025-08-19T09:40:00",
    firstResponseAt: "2025-08-19T09:55:00",
    firstResponseMinutes: 15,
    qualified: true,
    escalated: false,
    messages: [
      { id: "wa-002-m1", direction: "inbound", author: "contact", text: "Hi, comparing a few operators for my Business Bay unit. Can you share your average occupancy rates?", timestamp: "2025-08-19T09:40:00" },
      { id: "wa-002-m2", direction: "outbound", author: "ai", text: "Hi Daniel, our Business Bay portfolio runs at 86% average occupancy. I'll send our revenue proposal today with a like-for-like comparison.", timestamp: "2025-08-19T09:55:00" },
    ],
  },
  {
    id: "wa-003",
    phoneNumber: "+971 52 447 9038",
    contactName: "Laila Haddad",
    intent: "owner_lead",
    direction: "property_management",
    opportunityId: "opp-03",
    assignedTo: "Sultan Sovetov",
    createdAt: "2025-08-18T16:05:00",
    firstResponseAt: "2025-08-18T16:20:00",
    firstResponseMinutes: 15,
    qualified: true,
    escalated: false,
    messages: [
      { id: "wa-003-m1", direction: "inbound", author: "contact", text: "Hello, I'd like a revenue estimate for my villa in Dubai Hills.", timestamp: "2025-08-18T16:05:00" },
      { id: "wa-003-m2", direction: "outbound", author: "ai", text: "Hi Laila, the final revenue range for Cedar Villa is ready. Sharing the proposal document here shortly.", timestamp: "2025-08-18T16:20:00" },
    ],
  },
  {
    id: "wa-004",
    phoneNumber: "+971 50 998 1122",
    contactName: "Omar Saleh",
    intent: "owner_lead",
    direction: "snagging",
    assignedTo: "Ruslan Tszi",
    createdAt: "2025-08-19T14:02:00",
    qualified: false,
    escalated: true,
    messages: [
      { id: "wa-004-m1", direction: "inbound", author: "contact", text: "We're handing over a new building in JVC and need a snagging inspection next week.", timestamp: "2025-08-19T14:02:00" },
      { id: "wa-004-m2", direction: "outbound", author: "ai", text: "Hi Omar, I can book a certified snagging inspector for JVC. Could you share the unit number and preferred day? I'll escalate the quote to our specialist.", timestamp: "2025-08-19T14:18:00" },
    ],
  },
  {
    id: "wa-005",
    phoneNumber: "+971 54 220 7788",
    contactName: "Priya Sharma",
    intent: "owner_lead",
    direction: "staging",
    assignedTo: "Sultan Sovetov",
    createdAt: "2025-08-20T08:30:00",
    qualified: false,
    escalated: false,
    messages: [
      { id: "wa-005-m1", direction: "inbound", author: "contact", text: "I need staging for a 2BR in Downtown before the next booking season.", timestamp: "2025-08-20T08:30:00" },
      { id: "wa-005-m2", direction: "outbound", author: "ai", text: "Hi Priya, our staging studio can visit your Downtown unit this week. I'll send a proposal with moodboard options shortly.", timestamp: "2025-08-20T08:42:00" },
    ],
  },
];

export const whatsappIntentLabelKey: Record<WhatsAppIntent, string> = {
  owner_lead: "wa.intent.owner_lead",
  owner_issue: "wa.intent.owner_issue",
  guest_issue: "wa.intent.guest_issue",
  vendor: "wa.intent.vendor",
};

/** First-response templates the AI bot sends per intent (demo content). */
export const firstResponseTemplates: Record<WhatsAppIntent, string> = {
  owner_lead:
    "Hello! Thanks for reaching out to Paterhaus. I can prepare a revenue estimate and management proposal for your unit. Could you share the area, unit type and number of bedrooms?",
  owner_issue:
    "Hello! I've logged your request and routed it to the property manager. Could you share the unit and a short description of the issue?",
  guest_issue:
    "Hello! I've flagged this for the guest experience team. Could you share the reservation ID and a short description so we can act on it now?",
  vendor:
    "Hello! I can route this to our vendor coordination desk. Could you share the service category and the property address?",
};

/** Routing rules: which team member picks up which direction/intent. */
export const routeWhatsAppLead = (
  intent: WhatsAppIntent,
  direction: Direction,
): string => {
  if (intent === "guest_issue") return "Sultan Sovetov";
  if (intent === "vendor") return "Sultan Sovetov";
  if (direction === "snagging") return "Ruslan Tszi";
  if (direction === "staging") return "Sultan Sovetov";
  return "Ruslan Tszi";
};
