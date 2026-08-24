export type DemoFileType = "document" | "image" | "other";

export type DemoFile = {
  id: string;
  name: string;
  type: DemoFileType;
  sizeKb: number;
  uploadedAt: string;
  leadId?: string;
  propertyId?: string;
  description?: string;
};

export const demoFiles: DemoFile[] = [
  {
    id: "file-001",
    name: "Passport_Mariam_AlNoor.pdf",
    type: "document",
    sizeKb: 1240,
    uploadedAt: "2025-08-18",
    leadId: "opp-01",
    description: "Owner passport copy for KYC verification.",
  },
  {
    id: "file-002",
    name: "Title_Deed_Marina_Pearl_804.pdf",
    type: "document",
    sizeKb: 3480,
    uploadedAt: "2025-08-16",
    leadId: "opp-06",
    propertyId: "prop-marina-vista-2204",
    description: "Title deed for Marina Pearl 804 onboarding.",
  },
  {
    id: "file-003",
    name: "WhatsApp_chat_Daniel_Foster.png",
    type: "image",
    sizeKb: 410,
    uploadedAt: "2025-08-19",
    leadId: "opp-02",
    description: "Screenshot of the initial WhatsApp enquiry.",
  },
  {
    id: "file-004",
    name: "Management_Agreement_Draft_Cedar_Villa.pdf",
    type: "document",
    sizeKb: 890,
    uploadedAt: "2025-08-18",
    leadId: "opp-03",
    description: "Draft management agreement shared with the owner.",
  },
  {
    id: "file-005",
    name: "Property_Photos_JBR_Horizon_1903.jpg",
    type: "image",
    sizeKb: 2150,
    uploadedAt: "2025-08-17",
    leadId: "opp-04",
    description: "Owner-supplied photos ahead of the property visit.",
  },
  {
    id: "file-006",
    name: "Signed_Agreement_Creekside_Family_Home.pdf",
    type: "document",
    sizeKb: 1620,
    uploadedAt: "2025-08-20",
    leadId: "opp-09",
    description: "Signed management agreement received on 20 Aug.",
  },
  {
    id: "file-007",
    name: "DTCM_Licence_Opera_View_507.pdf",
    type: "document",
    sizeKb: 760,
    uploadedAt: "2025-08-12",
    propertyId: "prop-opera-downtown",
    description: "Current DTCM holiday home licence.",
  },
  {
    id: "file-008",
    name: "Inventory_Report_Palm_Vista_1804.pdf",
    type: "document",
    sizeKb: 2890,
    uploadedAt: "2025-08-14",
    propertyId: "prop-palm-crescent",
    description: "Furnishing inventory and condition survey.",
  },
];
