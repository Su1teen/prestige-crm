export type DemoFileType = "document" | "image" | "other";

export type FileEntityType = "lead" | "owner" | "guest" | "property" | "vendor" | "task" | "general";

export type FileCategory =
  | "identity"
  | "property_document"
  | "contract"
  | "financial"
  | "guest_document"
  | "maintenance"
  | "communication"
  | "photo"
  | "other";

export type FileSource = "whatsapp" | "email" | "meta_form" | "manual_upload" | "guest_portal" | "vendor";

export type FileReviewStatus = "reviewed" | "needs_review" | "missing_context";

export type DemoFile = {
  id: string;
  name: string;
  type: DemoFileType;
  category: FileCategory;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  source: FileSource;
  entityType: FileEntityType;
  leadId?: string;
  ownerId?: string;
  guestId?: string;
  propertyId?: string;
  vendorId?: string;
  taskId?: string;
  description?: string;
  aiSummary?: string;
  isImportant?: boolean;
  reviewStatus: FileReviewStatus;
};

export type MissingDocument = {
  id: string;
  entityLabel: string;
  documentLabel: string;
  entityType: FileEntityType;
};

export const fileCategoryLabels: Record<FileCategory, string> = {
  identity: "Identity",
  property_document: "Property document",
  contract: "Contract",
  financial: "Financial",
  guest_document: "Guest document",
  maintenance: "Maintenance",
  communication: "Communication",
  photo: "Photo",
  other: "Other",
};

export const fileSourceLabels: Record<FileSource, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  meta_form: "Meta form",
  manual_upload: "Manual upload",
  guest_portal: "Guest portal",
  vendor: "Vendor",
};

export const fileEntityLabels: Record<FileEntityType, string> = {
  lead: "Lead",
  owner: "Owner",
  guest: "Guest",
  property: "Property",
  vendor: "Vendor",
  task: "Task",
  general: "General",
};

export const demoFiles: DemoFile[] = [
  {
    id: "file-001",
    name: "Passport_Mariam_AlNoor.pdf",
    type: "document",
    category: "identity",
    sizeKb: 1240,
    uploadedAt: "2025-08-18",
    uploadedBy: "Ruslan Tszi",
    source: "whatsapp",
    entityType: "lead",
    leadId: "opp-01",
    description: "Owner passport copy for KYC verification.",
    aiSummary:
      "Owner identity document received via WhatsApp. Name matches the lead profile; document expiry should be verified before agreement execution.",
    isImportant: true,
    reviewStatus: "needs_review",
  },
  {
    id: "file-002",
    name: "Title_Deed_Marina_Pearl_804.pdf",
    type: "document",
    category: "property_document",
    sizeKb: 3480,
    uploadedAt: "2025-08-16",
    uploadedBy: "Sultan Sovetov",
    source: "email",
    entityType: "property",
    leadId: "opp-06",
    propertyId: "prop-marina-vista-2204",
    description: "Title deed for Marina Pearl 804 onboarding.",
    aiSummary:
      "Title deed for Marina Pearl, Unit 804. Ownership details should be matched against the management agreement before onboarding.",
    isImportant: true,
    reviewStatus: "reviewed",
  },
  {
    id: "file-003",
    name: "WhatsApp_chat_Daniel_Foster.png",
    type: "image",
    category: "communication",
    sizeKb: 410,
    uploadedAt: "2025-08-19",
    uploadedBy: "Ruslan Tszi",
    source: "whatsapp",
    entityType: "lead",
    leadId: "opp-02",
    description: "Screenshot of the initial WhatsApp enquiry.",
    aiSummary:
      "Screenshot of the first WhatsApp exchange. The lead asked about management fees and requested a revenue estimate for a JBR apartment.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-004",
    name: "Management_Agreement_Draft_Cedar_Villa.pdf",
    type: "document",
    category: "contract",
    sizeKb: 890,
    uploadedAt: "2025-08-18",
    uploadedBy: "Sultan Sovetov",
    source: "manual_upload",
    entityType: "lead",
    leadId: "opp-03",
    description: "Draft management agreement shared with the owner.",
    aiSummary:
      "Draft management agreement, version 2. Fee structure and notice period updated after the owner call; awaiting the owner's signature.",
    isImportant: true,
    reviewStatus: "needs_review",
  },
  {
    id: "file-005",
    name: "Property_Photos_JBR_Horizon_1903.jpg",
    type: "image",
    category: "photo",
    sizeKb: 2150,
    uploadedAt: "2025-08-17",
    uploadedBy: "Ruslan Tszi",
    source: "whatsapp",
    entityType: "lead",
    leadId: "opp-04",
    description: "Owner-supplied photos ahead of the property visit.",
    aiSummary:
      "Owner-supplied interior photos. Furnishing condition looks good; professional photography still required before listing.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-006",
    name: "Signed_Agreement_Creekside_Family_Home.pdf",
    type: "document",
    category: "contract",
    sizeKb: 1620,
    uploadedAt: "2025-08-20",
    uploadedBy: "Sultan Sovetov",
    source: "email",
    entityType: "lead",
    leadId: "opp-09",
    description: "Signed management agreement received on 20 Aug.",
    aiSummary:
      "Fully signed management agreement. Onboarding checklist can start; the inventory survey is the next required document.",
    isImportant: true,
    reviewStatus: "reviewed",
  },
  {
    id: "file-007",
    name: "DTCM_Licence_Opera_View_507.pdf",
    type: "document",
    category: "property_document",
    sizeKb: 760,
    uploadedAt: "2025-08-12",
    uploadedBy: "Compliance desk",
    source: "email",
    entityType: "property",
    propertyId: "prop-opera-downtown",
    description: "Current DTCM holiday home licence.",
    aiSummary:
      "Active DTCM holiday-home licence for Opera View 507. Renewal falls due in Q4; add a reminder 30 days before expiry.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-008",
    name: "Inventory_Report_Palm_Vista_1804.pdf",
    type: "document",
    category: "property_document",
    sizeKb: 2890,
    uploadedAt: "2025-08-14",
    uploadedBy: "Sultan Sovetov",
    source: "manual_upload",
    entityType: "property",
    propertyId: "prop-palm-crescent",
    description: "Furnishing inventory and condition survey.",
    aiSummary:
      "Full furnishing inventory with condition notes. Two flagged items: worn sofa cover and a scratched dining table.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-009",
    name: "Guest_Passport_Lucia_Moretti.pdf",
    type: "document",
    category: "guest_document",
    sizeKb: 980,
    uploadedAt: "2025-08-19",
    uploadedBy: "Guest support",
    source: "guest_portal",
    entityType: "guest",
    guestId: "guest-lucia",
    propertyId: "prop-marina-vista-2204",
    description: "Guest ID for the current Marina Vista stay.",
    aiSummary:
      "Guest passport submitted through the guest portal. Verification is pending; complete it before the security deposit release.",
    reviewStatus: "needs_review",
  },
  {
    id: "file-010",
    name: "AC_Repair_Quotation_Vertex.pdf",
    type: "document",
    category: "maintenance",
    sizeKb: 340,
    uploadedAt: "2025-08-20",
    uploadedBy: "Vertex Technical Services",
    source: "vendor",
    entityType: "task",
    taskId: "task-05",
    vendorId: "vendor-vertex",
    propertyId: "prop-palm-crescent",
    description: "Quotation for the villa cooling system repair.",
    aiSummary:
      "Vendor quotation for AC repair: estimated cost $2,800, expected completion within one working day. Owner approval is required before work begins.",
    isImportant: true,
    reviewStatus: "needs_review",
  },
  {
    id: "file-011",
    name: "Invoice_Vertex_Balcony_Door_August.pdf",
    type: "document",
    category: "financial",
    sizeKb: 210,
    uploadedAt: "2025-08-18",
    uploadedBy: "Vertex Technical Services",
    source: "email",
    entityType: "vendor",
    vendorId: "vendor-vertex",
    propertyId: "prop-marina-vista-2204",
    description: "Invoice for the completed balcony door adjustment.",
    aiSummary:
      "Vendor invoice of $180 for the balcony door snag. Work is confirmed complete with photo evidence; ready for payment approval.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-012",
    name: "Short_Term_Rental_Permit_Bay_Avenue.pdf",
    type: "document",
    category: "property_document",
    sizeKb: 640,
    uploadedAt: "2025-08-11",
    uploadedBy: "Compliance desk",
    source: "email",
    entityType: "property",
    propertyId: "prop-bay-avenue",
    description: "Short-term rental permit on file for Bay Avenue.",
    aiSummary:
      "Short-term rental permit expiring in 15 days. Renewal pack is blocked on the owner ID refresh; escalate if not received this week.",
    isImportant: true,
    reviewStatus: "needs_review",
  },
  {
    id: "file-013",
    name: "Owner_Revenue_Statement_July_Nadia.pdf",
    type: "document",
    category: "financial",
    sizeKb: 520,
    uploadedAt: "2025-08-05",
    uploadedBy: "Sultan Sovetov",
    source: "manual_upload",
    entityType: "owner",
    ownerId: "owner-nadia",
    propertyId: "prop-ardmore-downtown",
    description: "July owner statement for the Downtown apartment.",
    aiSummary:
      "July revenue statement: $9,850 gross, $7,320 net payout. Occupancy dipped 6 points versus June; recovery plan is referenced in the owner thread.",
    reviewStatus: "reviewed",
  },
  {
    id: "file-014",
    name: "Guest_Damage_Report_Marina_1804.jpg",
    type: "image",
    category: "photo",
    sizeKb: 1830,
    uploadedAt: "2025-08-19",
    uploadedBy: "Guest support",
    source: "guest_portal",
    entityType: "guest",
    guestId: "guest-jonas",
    propertyId: "prop-jbr-sands",
    description: "Photo evidence submitted after the guest reported a mark on the wall.",
    aiSummary:
      "Guest-submitted photo of a scuffed hallway wall. Damage appears cosmetic; add to the next housekeeping touch-up list rather than billing the guest.",
    reviewStatus: "missing_context",
  },
];

export const missingDocuments: MissingDocument[] = [
  {
    id: "missing-01",
    entityLabel: "Mariam Al Noor",
    documentLabel: "Signed management agreement",
    entityType: "lead",
  },
  {
    id: "missing-02",
    entityLabel: "Marina Vista 2204",
    documentLabel: "Latest DEWA bill",
    entityType: "property",
  },
  {
    id: "missing-03",
    entityLabel: "Lucia Moretti stay",
    documentLabel: "Passport verification pending",
    entityType: "guest",
  },
  {
    id: "missing-04",
    entityLabel: "Bay Avenue 1102",
    documentLabel: "Owner ID refresh for permit renewal",
    entityType: "property",
  },
];
