import { createContext, type ReactNode, useContext, useState } from "react";
import {
  demoCampaigns,
  demoFiles,
  demoLeadMessages,
  demoMarketingLeads,
  paterhausActivity,
  paterhausComplianceItems,
  paterhausConversations,
  paterhausGuests,
  paterhausMaintenance,
  paterhausMessages,
  paterhausNotifications,
  paterhausOpportunities,
  paterhausOwnerStatements,
  paterhausOwners,
  paterhausProperties,
  paterhausSnags,
  paterhausStays,
  paterhausTasks,
  paterhausVendors,
  CURRENT_PATERHAUS_USER,
  PATERHAUS_TODAY,
} from "@/data/paterhaus";
import type { DemoFile } from "@/data/paterhaus/files";
import type { Campaign, LeadMessage, MarketingLead } from "@/data/paterhaus/marketing";
import type {
  ActivityEvent,
  Conversation,
  Guest,
  MaintenanceIssue,
  Message,
  Notification,
  Owner,
  OwnerOpportunity,
  OwnerStatement,
  Property,
  Snag,
  Stay,
  Task,
  Vendor,
  OpportunityStage,
  PaterhausSettings,
} from "@/types/paterhaus";

interface NewSnagInput {
  propertyId: string;
  area: string;
  description: string;
  severity: Snag["severity"];
  costEstimate: number;
  deadline: string;
}

interface NewTaskInput {
  propertyId: string;
  title: string;
  description: string;
  category: Task["category"];
  priority: Task["priority"];
  dueAt: string;
  ownerId?: string;
  stayId?: string;
  vendorId?: string;
  assignee?: string;
  costEstimate?: number;
  snagId?: string;
  complianceItemId?: string;
}

export interface NewOpportunityInput {
  ownerName: string;
  prospectProperty: string;
  area: string;
  type: Property["type"];
  estimatedMonthlyRevenue: number;
  stage: OpportunityStage;
  assignedTo: string;
  leadSource: string;
  priority: OwnerOpportunity["priority"];
  nextAction: string;
  phone?: string;
  email?: string;
  campaignId?: string;
  bedrooms?: number;
  notes?: string;
}

export interface NewMarketingLeadInput {
  name: string;
  phone: string;
  email: string;
  campaignId?: string;
  propertyArea?: string;
  propertyType?: MarketingLead["propertyType"];
  bedrooms?: number;
  comment?: string;
}

export interface NewDemoFileInput {
  name: string;
  type: DemoFile["type"];
  sizeKb: number;
  leadId?: string;
  propertyId?: string;
  description?: string;
}

interface NewPropertyInput {
  name: string;
  unitIdentifier: string;
  community: string;
  ownerId: string;
  type: Property["type"];
}

interface NewStayInput {
  propertyId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  bookingValue: number;
}

interface PaterhausWorkspaceContextValue {
  properties: Property[];
  owners: Owner[];
  opportunities: OwnerOpportunity[];
  stays: Stay[];
  guests: Guest[];
  conversations: Conversation[];
  messages: Message[];
  tasks: Task[];
  snags: Snag[];
  maintenance: MaintenanceIssue[];
  vendors: Vendor[];
  statements: OwnerStatement[];
  compliance: typeof paterhausComplianceItems;
  notifications: Notification[];
  activity: ActivityEvent[];
  settings: PaterhausSettings;
  updateSettings: (changes: Partial<PaterhausSettings>) => void;
  markNotificationRead: (notificationId: string) => void;
  markConversationRead: (conversationId: string) => void;
  setConversationStatus: (conversationId: string, status: Conversation["status"]) => void;
  assignConversation: (conversationId: string, assignedTo: string) => void;
  moveOpportunityStage: (opportunityId: string, stage: OpportunityStage, lostReason?: string) => void;
  addOpportunity: (input: NewOpportunityInput) => void;
  files: DemoFile[];
  addFile: (input: NewDemoFileInput) => void;
  removeFile: (fileId: string) => void;
  campaigns: Campaign[];
  marketingLeads: MarketingLead[];
  addMarketingLead: (input: NewMarketingLeadInput) => void;
  leadMessages: LeadMessage[];
  sendLeadMessage: (opportunityId: string, text: string) => void;
  sendMessage: (conversationId: string, text: string, internal?: boolean) => void;
  createTask: (input: NewTaskInput) => void;
  setTaskStatus: (taskId: string, status: Task["status"]) => void;
  createTaskFromConversation: (conversationId: string) => void;
  assignVendor: (taskId: string, vendorId: string) => void;
  approveOwnerExpense: (taskId: string) => void;
  createSnag: (input: NewSnagInput) => void;
  addProperty: (input: NewPropertyInput) => void;
  addStay: (input: NewStayInput) => void;
  createOwnerStatement: (propertyId: string) => void;
}

const PaterhausWorkspaceContext = createContext<PaterhausWorkspaceContextValue | null>(null);

const nextId = (prefix: string, length: number) => `${prefix}-${String(length + 1).padStart(3, "0")}`;

export const PaterhausWorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [properties, setProperties] = useState<Property[]>(paterhausProperties);
  const [owners] = useState<Owner[]>(paterhausOwners);
  const [opportunities, setOpportunities] = useState<OwnerOpportunity[]>(paterhausOpportunities);
  const [stays, setStays] = useState<Stay[]>(paterhausStays);
  const [guests] = useState<Guest[]>(paterhausGuests);
  const [conversations, setConversations] = useState<Conversation[]>(paterhausConversations);
  const [messages, setMessages] = useState<Message[]>(paterhausMessages);
  const [tasks, setTasks] = useState<Task[]>(paterhausTasks);
  const [snags, setSnags] = useState<Snag[]>(paterhausSnags);
  const [maintenance, setMaintenance] = useState<MaintenanceIssue[]>(paterhausMaintenance);
  const [vendors] = useState<Vendor[]>(paterhausVendors);
  const [statements, setStatements] = useState<OwnerStatement[]>(paterhausOwnerStatements);
  const [notifications, setNotifications] = useState<Notification[]>(paterhausNotifications);
  const [compliance] = useState(paterhausComplianceItems);
  const [activity, setActivity] = useState<ActivityEvent[]>(paterhausActivity);
  const [files, setFiles] = useState<DemoFile[]>(demoFiles);
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [marketingLeads, setMarketingLeads] = useState<MarketingLead[]>(demoMarketingLeads);
  const [leadMessages, setLeadMessages] = useState<LeadMessage[]>(demoLeadMessages);
  const [settings, setSettings] = useState<PaterhausSettings>({
    workspaceName: "Paterhaus Property Management",
    expenseApprovalThreshold: 1000,
    complianceReminderWindows: "7 / 30 / 60 days",
    ownerReportDelivery: "Monthly",
    notifyReadinessRisk: true,
    notifyOwnerMessages: true,
    notifyTurnoverDelays: true,
    notifyGuestIncidents: true,
    notifyOwnerApprovals: true,
    notifyComplianceExpiries: true,
    notifyVendorSlas: true,
    notifyStatementApprovals: true,
    defaultCheckInTime: "15:00",
    defaultCheckOutTime: "11:00",
    communicationTemplates: [
      "I am reviewing this now and will update you within the agreed SLA.",
      "Thank you for the detail. We have logged the next operational step and will confirm once complete.",
      "The property is being checked now. I will share a clear update before the next arrival window.",
    ],
  });
  const updateSettings = (changes: Partial<PaterhausSettings>) =>
    setSettings((current) => ({ ...current, ...changes }));

  const addActivity = (event: Omit<ActivityEvent, "id" | "timestamp">) => {
    setActivity((current) => [
      { ...event, id: nextId("activity", current.length), timestamp: `${PATERHAUS_TODAY}T12:00:00` },
      ...current,
    ]);
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));
  };

  const markConversationRead = (conversationId: string) => {
    setConversations((current) =>
      current.map((item) => (item.id === conversationId ? { ...item, unread: false } : item)),
    );
  };

  const setConversationStatus = (conversationId: string, status: Conversation["status"]) => {
    setConversations((current) =>
      current.map((item) => (item.id === conversationId ? { ...item, status, unread: false } : item)),
    );
    const conversation = conversations.find((item) => item.id === conversationId);
    if (conversation) {
      addActivity({
        propertyId: conversation.propertyId,
        actor: CURRENT_PATERHAUS_USER.name,
        text: `${conversation.subject} moved to ${status}`,
        type: "Communication",
      });
    }
  };

  const assignConversation = (conversationId: string, assignedTo: string) => {
    setConversations((current) => current.map((item) => (item.id === conversationId ? { ...item, assignedTo } : item)));
  };

  const moveOpportunityStage = (opportunityId: string, stage: OpportunityStage, lostReason?: string) => {
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === opportunityId
          ? {
              ...opportunity,
              stage,
              lostReason: stage === "Lost / Not Proceeding" ? (lostReason ?? opportunity.lostReason) : undefined,
              onboardingChecklist:
                stage === "Agreement Signed"
                  ? (opportunity.onboardingChecklist ?? [
                      "Collect ownership documents",
                      "Confirm management agreement",
                      "Book inventory and condition survey",
                      "Approve launch budget",
                      "Schedule photography",
                    ])
                  : opportunity.onboardingChecklist,
            }
          : opportunity,
      ),
    );
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (opportunity) {
      addActivity({
        propertyId: null,
        actor: CURRENT_PATERHAUS_USER.name,
        text: `${opportunity.ownerName} moved to ${stage}`,
        type: "Property",
      });
    }
  };

  const addOpportunity = (input: NewOpportunityInput) => {
    const opportunity: OwnerOpportunity = {
      id: nextId("opp", opportunities.length),
      ownerId: `owner-lead-${String(opportunities.length + 1).padStart(3, "0")}`,
      ownerName: input.ownerName,
      prospectProperty: input.prospectProperty,
      area: input.area,
      type: input.type,
      estimatedMonthlyRevenue: input.estimatedMonthlyRevenue,
      estimatedAnnualRevenue: input.estimatedMonthlyRevenue * 12,
      potentialManagementFee: Math.round(input.estimatedMonthlyRevenue * 1.5),
      stage: input.stage,
      nextAction: input.nextAction,
      assignedTo: input.assignedTo,
      leadSource: input.leadSource,
      lastCommunication: PATERHAUS_TODAY,
      priority: input.priority,
      notes: input.notes?.trim() || "New demo lead added from the local Owner Pipeline workspace.",
      phone: input.phone,
      email: input.email,
      campaignId: input.campaignId,
      bedrooms: input.bedrooms,
      expectedRevenueMin: Math.round(input.estimatedMonthlyRevenue * 0.9),
      expectedRevenueMax: Math.round(input.estimatedMonthlyRevenue * 1.1),
      proposalStatus: "Not started",
      documents: [],
      taskIds: [],
      conversationIds: [],
      followUpAt: `${PATERHAUS_TODAY}T16:00:00`,
      activity: [`Lead added by ${CURRENT_PATERHAUS_USER.name} on ${PATERHAUS_TODAY}`],
    };
    setOpportunities((current) => [opportunity, ...current]);
  };

  const addFile = (input: NewDemoFileInput) => {
    setFiles((current) => [
      { ...input, id: nextId("file", current.length), uploadedAt: PATERHAUS_TODAY },
      ...current,
    ]);
  };

  const removeFile = (fileId: string) => {
    setFiles((current) => current.filter((file) => file.id !== fileId));
  };

  const addMarketingLead = (input: NewMarketingLeadInput) => {
    const createdAt = new Date().toISOString();
    setMarketingLeads((current) => [
      {
        id: nextId("mlead", current.length),
        name: input.name,
        phone: input.phone,
        email: input.email,
        source: "meta_lead_ads",
        campaignId: input.campaignId,
        status: "new",
        assignedTo: CURRENT_PATERHAUS_USER.name,
        propertyArea: input.propertyArea,
        propertyType: input.propertyType,
        bedrooms: input.bedrooms,
        createdAt,
      },
      ...current,
    ]);
    if (input.campaignId) {
      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === input.campaignId ? { ...campaign, leads: campaign.leads + 1 } : campaign,
        ),
      );
    }
    addOpportunity({
      ownerName: input.name,
      prospectProperty: input.propertyArea ? `${input.propertyArea} prospect` : "Prospect property",
      area: input.propertyArea ?? "Dubai",
      type:
        input.propertyType === "villa"
          ? "Villa"
          : input.propertyType === "townhouse"
            ? "Townhouse"
            : "Apartment",
      estimatedMonthlyRevenue: 4000,
      stage: "New Lead",
      assignedTo: CURRENT_PATERHAUS_USER.name,
      leadSource: "Meta Lead Ads",
      priority: "Medium",
      nextAction: "Contact new Meta lead",
      phone: input.phone,
      email: input.email,
      campaignId: input.campaignId,
      bedrooms: input.bedrooms,
      notes: input.comment,
    });
  };

  const sendLeadMessage = (opportunityId: string, text: string) => {
    if (!text.trim()) return;
    setLeadMessages((current) => [
      ...current,
      {
        id: nextId("lmsg", current.length),
        opportunityId,
        direction: "outbound",
        channel: "whatsapp",
        text: text.trim(),
        timestamp: `${PATERHAUS_TODAY}T12:00:00`,
      },
    ]);
  };

  const sendMessage = (conversationId: string, text: string, internal = false) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || !text.trim()) return;
    const message: Message = {
      id: nextId("msg", messages.length),
      conversationId,
      author: internal ? "internal" : "team",
      authorName: CURRENT_PATERHAUS_USER.name,
      text: text.trim(),
      timestamp: `${PATERHAUS_TODAY}T12:00:00`,
      internal,
    };
    setMessages((current) => [...current, message]);
    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              lastMessageAt: message.timestamp,
              status: internal ? "Waiting for internal action" : "Waiting for reply",
              unread: false,
              messageIds: [...item.messageIds, message.id],
            }
          : item,
      ),
    );
    addActivity({
      propertyId: conversation.propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `Message sent to ${conversation.contactName}`,
      type: "Communication",
    });
  };

  const createTask = (input: NewTaskInput) => {
    const task: Task = {
      id: nextId("task", tasks.length),
      propertyId: input.propertyId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      dueAt: input.dueAt,
      assignee: input.assignee ?? null,
      vendorId: input.vendorId ?? null,
      status: input.vendorId || input.assignee ? "Scheduled" : "Unassigned",
      costEstimate: input.costEstimate ?? null,
      stayId: input.stayId ?? null,
      ownerId: input.ownerId ?? null,
      snagId: input.snagId ?? null,
      complianceItemId: input.complianceItemId ?? null,
      createdAt: `${PATERHAUS_TODAY}T12:00:00`,
      completionProof: null,
      activityLog: [`Created by ${CURRENT_PATERHAUS_USER.name} on ${PATERHAUS_TODAY}`],
    };
    setTasks((current) => [task, ...current]);
    addActivity({
      propertyId: task.propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `Task created: ${task.title}`,
      type: "Task",
    });
  };

  const setTaskStatus = (taskId: string, status: Task["status"]) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status,
              activityLog: [...(item.activityLog ?? []), `Status changed to ${status} on ${PATERHAUS_TODAY}`],
              completionProof:
                status === "Completed"
                  ? (item.completionProof ?? "Completion proof placeholder")
                  : item.completionProof,
            }
          : item,
      ),
    );
    addActivity({
      propertyId: task.propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `${task.title} marked ${status}`,
      type: "Task",
    });
  };

  const createTaskFromConversation = (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation?.propertyId) return;
    createTask({
      propertyId: conversation.propertyId,
      title: `Follow up: ${conversation.subject}`,
      description: conversation.summary,
      category: conversation.contactType === "Guest" ? "Guest request" : "Owner request",
      priority: conversation.priority,
      dueAt: `${PATERHAUS_TODAY}T17:00:00`,
      stayId: conversation.stayId ?? undefined,
    });
  };

  const assignVendor = (taskId: string, vendorId: string) => {
    const vendor = vendors.find((item) => item.id === vendorId);
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, vendorId, status: "Scheduled" } : task)),
    );
    const task = tasks.find((item) => item.id === taskId);
    if (task && vendor)
      addActivity({
        propertyId: task.propertyId,
        actor: CURRENT_PATERHAUS_USER.name,
        text: `${task.title} assigned to ${vendor.name}`,
        type: "Task",
      });
  };

  const approveOwnerExpense = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setTasks((current) => current.map((item) => (item.id === taskId ? { ...item, status: "In progress" } : item)));
    setMaintenance((current) =>
      current.map((item) =>
        item.propertyId === task.propertyId && item.ownerApprovalRequired ? { ...item, status: "Scheduled" } : item,
      ),
    );
    addActivity({
      propertyId: task.propertyId,
      actor: "Khalid Al Farsi",
      text: `Owner approved ${task.costEstimate ? `$${task.costEstimate.toLocaleString("en-US")} ` : ""}expense`,
      type: "Finance",
    });
  };

  const createSnag = (input: NewSnagInput) => {
    const snag: Snag = {
      id: nextId("snag", snags.length),
      propertyId: input.propertyId,
      area: input.area,
      description: input.description,
      severity: input.severity,
      assignedVendorId: null,
      costEstimate: input.costEstimate,
      status: "Open",
      deadline: input.deadline,
      photoCount: 0,
      resolutionEvidence: null,
      createdAt: `${PATERHAUS_TODAY}T12:00:00`,
    };
    setSnags((current) => [snag, ...current]);
    setProperties((current) =>
      current.map((property) =>
        property.id === input.propertyId
          ? {
              ...property,
              openIssueCount: property.openIssueCount + 1,
              healthScore: Math.max(0, property.healthScore - 3),
            }
          : property,
      ),
    );
    addActivity({
      propertyId: input.propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `${snag.id} created in ${input.area}`,
      type: "Property",
    });
  };

  const addProperty = (input: NewPropertyInput) => {
    const property: Property = {
      id: nextId("prop", properties.length),
      name: input.name,
      unitIdentifier: input.unitIdentifier,
      community: input.community,
      area: input.community,
      address: `${input.community}, Dubai`,
      type: input.type,
      bedrooms: input.type === "Studio" ? 0 : 1,
      bathrooms: 1,
      capacity: input.type === "Studio" ? 2 : 3,
      ownerId: input.ownerId,
      manager: CURRENT_PATERHAUS_USER.name,
      managementStatus: "Onboarding",
      status: "Off market",
      listingStatus: "Not listed",
      readiness: "Not ready",
      dtcmStatus: "Missing documents",
      dtcmExpiry: "2025-12-31",
      occupancy: "Available",
      occupancyRate: 0,
      healthScore: 40,
      monthlyRevenue: 0,
      revenueTarget: 16000,
      openIssueCount: 0,
      nextCheckIn: null,
      nextCheckOut: null,
      lastOperationalActivity: `${PATERHAUS_TODAY}T12:00:00`,
      description: "Newly created demo property awaiting onboarding tasks.",
      imageTone: "from-stone-950 via-slate-900 to-slate-800",
      tags: ["New onboarding"],
    };
    setProperties((current) => [property, ...current]);
    addActivity({
      propertyId: property.id,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `${property.name} added to the portfolio`,
      type: "Property",
    });
  };

  const addStay = (input: NewStayInput) => {
    const checkIn = new Date(`${input.checkIn}T00:00:00`);
    const checkOut = new Date(`${input.checkOut}T00:00:00`);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
    const stay: Stay = {
      id: nextId("stay", stays.length),
      reservationId: `BK-${2110 + stays.length}`,
      propertyId: input.propertyId,
      guestId: input.guestId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      guestCount: 2,
      source: "Direct",
      bookingValue: input.bookingValue,
      lifecycle: "Confirmed",
      checkInStatus: "Pending",
      checkOutStatus: "Not due",
      idVerificationStatus: "Pending",
      paymentStatus: "Deposit pending",
      arrivalInstructionsStatus: "Pending",
      houseRulesAcknowledged: false,
      incidentCount: 0,
    };
    setStays((current) => [stay, ...current]);
    addActivity({
      propertyId: stay.propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `${stay.reservationId} added to the property calendar`,
      type: "Stay",
    });
  };

  const createOwnerStatement = (propertyId: string) => {
    const property = properties.find((item) => item.id === propertyId);
    if (!property) return;
    const grossRevenue = property.monthlyRevenue;
    const channelFees = Math.round(grossRevenue * 0.1);
    const cleaningLaundry = Math.round(grossRevenue * 0.06);
    const maintenanceCost = maintenance
      .filter((item) => item.propertyId === propertyId)
      .reduce((sum, item) => sum + item.cost, 0);
    const managementFee = Math.round(grossRevenue * 0.165);
    const statement: OwnerStatement = {
      id: nextId("stmt", statements.length),
      ownerId: property.ownerId,
      propertyId,
      period: "August 2025",
      grossRevenue,
      channelFees,
      cleaningLaundry,
      maintenance: maintenanceCost,
      managementFee,
      netPayout: grossRevenue - channelFees - cleaningLaundry - maintenanceCost - managementFee,
      status: "Draft",
      payoutDate: "2025-09-05",
      deliveryStatus: "Pending",
    };
    setStatements((current) => [statement, ...current]);
    addActivity({
      propertyId,
      actor: CURRENT_PATERHAUS_USER.name,
      text: `Draft owner statement created for ${property.name}`,
      type: "Finance",
    });
  };

  const value: PaterhausWorkspaceContextValue = {
    properties,
    owners,
    opportunities,
    stays,
    guests,
    conversations,
    messages,
    tasks,
    snags,
    maintenance,
    vendors,
    statements,
    compliance,
    notifications,
    activity,
    settings,
    updateSettings,
    markNotificationRead,
    markConversationRead,
    setConversationStatus,
    assignConversation,
    moveOpportunityStage,
    addOpportunity,
    files,
    addFile,
    removeFile,
    campaigns,
    marketingLeads,
    addMarketingLead,
    leadMessages,
    sendLeadMessage,
    sendMessage,
    createTask,
    setTaskStatus,
    createTaskFromConversation,
    assignVendor,
    approveOwnerExpense,
    createSnag,
    addProperty,
    addStay,
    createOwnerStatement,
  };

  return <PaterhausWorkspaceContext.Provider value={value}>{children}</PaterhausWorkspaceContext.Provider>;
};

export const usePaterhausWorkspace = () => {
  const context = useContext(PaterhausWorkspaceContext);
  if (!context) throw new Error("usePaterhausWorkspace must be used within PaterhausWorkspaceProvider");
  return context;
};
