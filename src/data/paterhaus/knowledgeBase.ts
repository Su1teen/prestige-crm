export type KnowledgeCategory = "general" | "sop" | "property_owner" | "guest_stay" | "vendors_compliance";

export type KnowledgeItemType =
  | "policy"
  | "sop"
  | "guide"
  | "property_profile"
  | "owner_preference"
  | "vendor_profile"
  | "template";

export type KnowledgeItem = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  type: KnowledgeItemType;
  summary: string;
  lastUpdated: string;
  updatedBy: string;
  tags: string[];
  linkedPropertyId?: string;
  linkedOwnerId?: string;
  linkedVendorId?: string;
  status: "active" | "needs_review";
};

export const knowledgeCategoryLabels: Record<KnowledgeCategory, string> = {
  general: "General",
  sop: "SOPs & Operations",
  property_owner: "Properties & Owners",
  guest_stay: "Guests & Stays",
  vendors_compliance: "Vendors & Compliance",
};

export const knowledgeCategoryDescriptions: Record<KnowledgeCategory, string> = {
  general: "Paterhaus service standards, tone of voice and company-wide rules.",
  sop: "Checklists, incident handling, turnovers, maintenance and inspections.",
  property_owner: "Property-specific details, owner preferences, contracts and onboarding.",
  guest_stay: "Guest communication, check-in/out, house rules and issue resolution.",
  vendors_compliance: "Approved vendors, permits, compliance, invoices and escalation rules.",
};

export const knowledgeTypeLabels: Record<KnowledgeItemType, string> = {
  policy: "Policy",
  sop: "SOP",
  guide: "Guide",
  property_profile: "Property profile",
  owner_preference: "Owner preference",
  vendor_profile: "Vendor profile",
  template: "Template",
};

export const knowledgeUsedFor = [
  "guest communication",
  "task creation",
  "maintenance escalation",
  "owner update drafting",
];

export const demoKnowledgeItems: KnowledgeItem[] = [
  {
    id: "kb-001",
    title: "Paterhaus Guest Communication Standards",
    category: "general",
    type: "policy",
    summary:
      "Defines the calm, specific and commitment-based tone used in all guest and owner messages. Every reply must contain a concrete next step, deadline or fact.",
    lastUpdated: "2025-08-10",
    updatedBy: "Ruslan Tszi",
    tags: ["tone of voice", "communication"],
    status: "active",
  },
  {
    id: "kb-002",
    title: "Owner Reporting Principles",
    category: "general",
    type: "policy",
    summary:
      "Monthly owner reports must explain occupancy variance, list operational actions taken and avoid revenue projections that have not been validated.",
    lastUpdated: "2025-08-08",
    updatedBy: "Ruslan Tszi",
    tags: ["owner reporting", "finance"],
    status: "active",
  },
  {
    id: "kb-003",
    title: "Escalation Matrix for Urgent Issues",
    category: "general",
    type: "guide",
    summary:
      "Maps issue severity to response owner and response window: guest safety issues escalate immediately to the Operations Director; comfort issues follow the 30-minute update rule.",
    lastUpdated: "2025-08-15",
    updatedBy: "Sultan Sovetov",
    tags: ["escalation", "priorities"],
    status: "active",
  },
  {
    id: "kb-004",
    title: "Check-in Readiness Checklist",
    category: "sop",
    type: "sop",
    summary:
      "Pre-arrival checklist covering cleaning sign-off, AC test, Wi-Fi check, amenity restock and access verification, completed at least 3 hours before check-in.",
    lastUpdated: "2025-08-12",
    updatedBy: "Sultan Sovetov",
    tags: ["check-in", "turnover"],
    status: "active",
  },
  {
    id: "kb-005",
    title: "AC Failure Response Procedure",
    category: "sop",
    type: "sop",
    summary:
      "Steps for cooling failures during a stay: acknowledge within 15 minutes, dispatch the approved AC vendor, offer a portable unit if repair exceeds 4 hours, update the guest every 30 minutes.",
    lastUpdated: "2025-08-18",
    updatedBy: "Sultan Sovetov",
    tags: ["maintenance", "guest issue", "AC"],
    status: "active",
  },
  {
    id: "kb-006",
    title: "Water Leak Incident SOP",
    category: "sop",
    type: "sop",
    summary:
      "Immediate isolation steps, emergency vendor dispatch rules and the documentation photos required before and after any water damage repair.",
    lastUpdated: "2025-07-30",
    updatedBy: "Sultan Sovetov",
    tags: ["maintenance", "emergency"],
    status: "active",
  },
  {
    id: "kb-007",
    title: "Property Inspection Checklist",
    category: "sop",
    type: "sop",
    summary:
      "Quarterly inspection covering appliances, safety equipment, furnishing condition and snag capture with photo evidence for the owner report.",
    lastUpdated: "2025-08-02",
    updatedBy: "Ruslan Tszi",
    tags: ["inspection", "snagging"],
    status: "active",
  },
  {
    id: "kb-008",
    title: "Guest Complaint Handling SOP",
    category: "sop",
    type: "sop",
    summary:
      "Non-defensive acknowledgement, one owner per complaint, resolution confirmation with the guest, and a follow-up message after closure.",
    lastUpdated: "2025-08-16",
    updatedBy: "Sultan Sovetov",
    tags: ["guest issue", "service recovery"],
    status: "active",
  },
  {
    id: "kb-009",
    title: "Marina Vista 2204 — Property Profile",
    category: "property_owner",
    type: "property_profile",
    summary:
      "2BR Marina apartment: chiller managed by building, balcony door requires gentle handling after the August adjustment, parking bay P2-118.",
    lastUpdated: "2025-08-18",
    updatedBy: "Sultan Sovetov",
    tags: ["property profile", "access"],
    linkedPropertyId: "prop-marina-vista-2204",
    status: "active",
  },
  {
    id: "kb-010",
    title: "Khalid Al Farsi — Owner Preferences",
    category: "property_owner",
    type: "owner_preference",
    summary:
      "Prefers email for approvals, requires a written quote for any expense above $1,000 and expects a same-day update once work is scheduled.",
    lastUpdated: "2025-08-19",
    updatedBy: "Ruslan Tszi",
    tags: ["owner preference", "approvals"],
    linkedOwnerId: "owner-khalid",
    status: "active",
  },
  {
    id: "kb-011",
    title: "Palm Crescent Villa — Access and Maintenance Notes",
    category: "property_owner",
    type: "property_profile",
    summary:
      "Gate code rotates monthly, pool service every Tuesday, AC units serviced by Vertex under an annual contract; garden irrigation controller is in the garage.",
    lastUpdated: "2025-08-14",
    updatedBy: "Sultan Sovetov",
    tags: ["access", "maintenance"],
    linkedPropertyId: "prop-palm-crescent",
    status: "active",
  },
  {
    id: "kb-012",
    title: "Nadia Al Mansouri — Owner Preferences",
    category: "property_owner",
    type: "owner_preference",
    summary:
      "Wants occupancy variance explained with comparable listings data and expects listing changes to be proposed before implementation.",
    lastUpdated: "2025-08-20",
    updatedBy: "Ruslan Tszi",
    tags: ["owner preference", "reporting"],
    linkedOwnerId: "owner-nadia",
    status: "needs_review",
  },
  {
    id: "kb-013",
    title: "Guest Check-in Message Template",
    category: "guest_stay",
    type: "template",
    summary:
      "Standard arrival message with access instructions, Wi-Fi details, house rules link and the support contact, sent 24 hours before check-in.",
    lastUpdated: "2025-08-06",
    updatedBy: "Sultan Sovetov",
    tags: ["template", "check-in"],
    status: "active",
  },
  {
    id: "kb-014",
    title: "Late Check-out Request Playbook",
    category: "guest_stay",
    type: "guide",
    summary:
      "Approve up to 2 hours free when no same-day arrival exists; otherwise offer paid late check-out or luggage storage. Confirm only after the calendar check.",
    lastUpdated: "2025-08-11",
    updatedBy: "Sultan Sovetov",
    tags: ["check-out", "guest request"],
    status: "active",
  },
  {
    id: "kb-015",
    title: "Noise Complaint Response Guide",
    category: "guest_stay",
    type: "guide",
    summary:
      "First contact within 15 minutes, building security involvement rules, and the written warning template required before any escalation.",
    lastUpdated: "2025-07-25",
    updatedBy: "Ruslan Tszi",
    tags: ["guest issue", "escalation"],
    status: "needs_review",
  },
  {
    id: "kb-016",
    title: "Approved AC Vendors and Response SLA",
    category: "vendors_compliance",
    type: "vendor_profile",
    summary:
      "Vertex Technical Services is the primary AC vendor with a 4-hour response SLA; quotes above $1,000 require owner approval before scheduling.",
    lastUpdated: "2025-08-17",
    updatedBy: "Sultan Sovetov",
    tags: ["vendor", "SLA", "AC"],
    linkedVendorId: "vendor-vertex",
    status: "active",
  },
  {
    id: "kb-017",
    title: "Emergency Maintenance Approval Rules",
    category: "vendors_compliance",
    type: "policy",
    summary:
      "Emergency work protecting guest safety or preventing property damage may start before owner approval up to $500; everything else requires a written quote first.",
    lastUpdated: "2025-08-09",
    updatedBy: "Ruslan Tszi",
    tags: ["approvals", "emergency", "maintenance"],
    status: "active",
  },
  {
    id: "kb-018",
    title: "Dubai Short-Term Rental Document Checklist",
    category: "vendors_compliance",
    type: "guide",
    summary:
      "Required documents per property: DTCM holiday-home permit, title deed, owner ID, and the annual renewal timeline with 30-day reminder windows.",
    lastUpdated: "2025-08-13",
    updatedBy: "Compliance desk",
    tags: ["compliance", "DTCM", "permits"],
    status: "active",
  },
];
