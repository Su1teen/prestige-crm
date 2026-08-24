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
