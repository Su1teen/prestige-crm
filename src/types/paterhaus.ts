export type PropertyType = "Apartment" | "Villa" | "Townhouse" | "Penthouse" | "Studio";
export type OpportunityStage =
  | "New Lead"
  | "Qualified"
  | "Valuation / Revenue Proposal"
  | "Property Visit Scheduled"
  | "Agreement Sent"
  | "Agreement Signed"
  | "Onboarding"
  | "Staging & Setup"
  | "Listing Readiness"
  | "Live & Managed"
  | "Lost / Not Proceeding";
export type PropertyStatus =
  "Ready" | "Occupied" | "Turnover in progress" | "Maintenance required" | "Compliance risk" | "Off market";
export type ListingStatus = "Live" | "Draft" | "Paused" | "Not listed";
export type ReadinessStatus = "Ready" | "Staging in progress" | "Not ready" | "Blocked";
export type OccupancyState = "Occupied" | "Available" | "Arriving today" | "Departing today" | "Blocked";
export type ComplianceStatus = "Complete" | "Due soon" | "Missing documents" | "Expired";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus =
  | "Unassigned"
  | "Scheduled"
  | "In progress"
  | "Waiting on vendor"
  | "Waiting on owner approval"
  | "Completed"
  | "Blocked";
export type TaskCategory =
  | "Check-in preparation"
  | "Check-out inspection"
  | "Housekeeping"
  | "Laundry"
  | "Staging"
  | "Snagging"
  | "Maintenance"
  | "Guest request"
  | "Owner request"
  | "Compliance"
  | "Listing optimisation"
  | "Finance approval";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type SnagStatus = "Open" | "Assigned" | "In progress" | "Resolved" | "Accepted";
export type MaintenanceStatus = "Open" | "Awaiting approval" | "Scheduled" | "In progress" | "Completed";
export type ConversationContactType = "Owner" | "Guest" | "Vendor" | "Internal";
export type ConversationChannel = "WhatsApp" | "Email" | "Phone note" | "Internal note";
export type ConversationStatus = "Open" | "Waiting for reply" | "Waiting for internal action" | "Resolved";
export type MessageAuthor = "contact" | "ai" | "team" | "internal";
export type StatementStatus = "Draft" | "Awaiting approval" | "Approved" | "Scheduled" | "Paid" | "Exception";
export type RenewalState = "Complete" | "Due soon" | "In progress" | "Expired";
export type NotificationPriority = "Info" | "Attention" | "Critical";

export interface Property {
  id: string;
  name: string;
  unitIdentifier: string;
  community: string;
  area: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  ownerId: string;
  manager: string;
  managementStatus: "Managed" | "Onboarding" | "Paused";
  status: PropertyStatus;
  listingStatus: ListingStatus;
  readiness: ReadinessStatus;
  dtcmStatus: ComplianceStatus;
  dtcmExpiry: string;
  occupancy: OccupancyState;
  occupancyRate: number;
  healthScore: number;
  monthlyRevenue: number;
  revenueTarget: number;
  openIssueCount: number;
  nextCheckIn: string | null;
  nextCheckOut: string | null;
  lastOperationalActivity: string;
  description: string;
  imageTone: string;
  tags: string[];
}

export interface Owner {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  portfolioValue: number;
  propertyIds: string[];
  relationshipStatus: "Active" | "Onboarding" | "At risk";
  lastCommunication: string;
}

export interface OwnerOpportunity {
  id: string;
  ownerId: string;
  ownerName: string;
  prospectProperty: string;
  area: string;
  type: PropertyType;
  estimatedMonthlyRevenue: number;
  estimatedAnnualRevenue: number;
  potentialManagementFee: number;
  stage: OpportunityStage;
  nextAction: string;
  assignedTo: string;
  leadSource: string;
  lastCommunication: string;
  priority: Priority;
  notes: string;
  phone?: string;
  email?: string;
  campaignId?: string;
  bedrooms?: number;
  expectedRevenueMin?: number;
  expectedRevenueMax?: number;
  proposalStatus?: "Not started" | "Draft" | "Sent" | "Accepted" | "Declined";
  documents?: string[];
  taskIds?: string[];
  conversationIds?: string[];
  followUpAt?: string;
  activity?: string[];
  onboardingChecklist?: string[];
  lostReason?: string;
}

export interface Guest {
  id: string;
  name: string;
  nationality: string;
  email: string;
  phone: string;
  verificationStatus: "Verified" | "Pending" | "Flagged";
  preferredChannel: ConversationChannel;
  riskFlag: RiskLevel | null;
}

export interface Stay {
  id: string;
  reservationId: string;
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  source: "Airbnb" | "Booking.com" | "Expedia" | "Direct";
  bookingValue: number;
  lifecycle:
    "Inquiry" | "Confirmed" | "Pre-arrival" | "Checked in" | "In stay" | "Check-out due" | "Checked out" | "Incident";
  checkInStatus: "Ready" | "Pending" | "Complete";
  checkOutStatus: "Not due" | "Due today" | "Complete";
  idVerificationStatus: "Verified" | "Pending";
  paymentStatus: "Paid" | "Deposit pending" | "Partial";
  arrivalInstructionsStatus: "Sent" | "Pending";
  houseRulesAcknowledged: boolean;
  incidentCount: number;
  checkInAt?: string;
  checkOutAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  author: MessageAuthor;
  authorName: string;
  text: string;
  timestamp: string;
  internal: boolean;
  attachment?: {
    name: string;
    size: string;
    kind: "image" | "document" | "pdf";
  };
}

export interface Conversation {
  id: string;
  contactType: ConversationContactType;
  contactName: string;
  channel: ConversationChannel;
  propertyId: string | null;
  stayId: string | null;
  subject: string;
  status: ConversationStatus;
  priority: Priority;
  unread: boolean;
  assignedTo: string;
  lastMessageAt: string;
  slaMinutes: number;
  intent: string;
  summary: string;
  messageIds: string[];
}

export interface Task {
  id: string;
  propertyId: string;
  category: TaskCategory;
  title: string;
  description: string;
  priority: Priority;
  dueAt: string;
  assignee: string | null;
  vendorId: string | null;
  status: TaskStatus;
  costEstimate: number | null;
  stayId: string | null;
  ownerId: string | null;
  snagId: string | null;
  complianceItemId: string | null;
  createdAt: string;
  completionProof: string | null;
  activityLog?: string[];
}

export interface Snag {
  id: string;
  propertyId: string;
  area: string;
  description: string;
  severity: RiskLevel;
  assignedVendorId: string | null;
  costEstimate: number;
  status: SnagStatus;
  deadline: string;
  photoCount: number;
  resolutionEvidence: string | null;
  createdAt: string;
}

export interface MaintenanceIssue {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  asset: string;
  vendorId: string | null;
  cost: number;
  severity: RiskLevel;
  slaHours: number;
  status: MaintenanceStatus;
  ownerApprovalRequired: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  category:
    | "Housekeeping vendor"
    | "Maintenance vendor"
    | "Laundry vendor"
    | "Staging / photography partner"
    | "Concierge partner";
  services: string[];
  coverageAreas: string[];
  contactPerson: string;
  phone: string;
  averageResponseHours: number;
  activeTaskCount: number;
  completionRate: number;
  slaRisk: RiskLevel;
  costRange: string;
  qualityScore: number;
}

export interface OwnerStatement {
  id: string;
  ownerId: string;
  propertyId: string;
  period: string;
  grossRevenue: number;
  channelFees: number;
  cleaningLaundry: number;
  maintenance: number;
  managementFee: number;
  netPayout: number;
  status: StatementStatus;
  payoutDate: string;
  deliveryStatus: "Pending" | "Sent" | "Viewed";
}

export interface ComplianceItem {
  id: string;
  propertyId: string;
  type: "DTCM licence" | "Owner documents" | "Insurance" | "Safety inspection" | "Guest verification";
  title: string;
  expiryDate: string;
  status: ComplianceStatus;
  assignedTo: string;
  documentName: string | null;
  risk: RiskLevel;
  dueAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  priority: NotificationPriority;
  createdAt: string;
  read: boolean;
  propertyId: string | null;
  taskId: string | null;
  conversationId: string | null;
  actionLabel: string;
}

export interface ActivityEvent {
  id: string;
  propertyId: string | null;
  actor: string;
  text: string;
  timestamp: string;
  type: "Property" | "Stay" | "Task" | "Finance" | "Communication" | "Compliance";
}

export interface PaterhausSettings {
  workspaceName: string;
  expenseApprovalThreshold: number;
  complianceReminderWindows: string;
  ownerReportDelivery: "Monthly" | "Quarterly";
  notifyReadinessRisk: boolean;
  notifyOwnerMessages: boolean;
  notifyTurnoverDelays: boolean;
  notifyGuestIncidents: boolean;
  notifyOwnerApprovals: boolean;
  notifyComplianceExpiries: boolean;
  notifyVendorSlas: boolean;
  notifyStatementApprovals: boolean;
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  communicationTemplates: string[];
}
