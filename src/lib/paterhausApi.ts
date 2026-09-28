import { getPaterhausSession } from "./paterhausConversationsApi";

export class PaterhausApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function paterhausRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getPaterhausSession();
  if (!token) throw new PaterhausApiError("Sign in to Paterhaus to continue.", 401);
  const base = import.meta.env.VITE_PATERHAUS_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) throw new PaterhausApiError("Paterhaus API is not configured.", 503);
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    let message = "Request failed. Please retry.";
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch { message = "Request failed. Please retry."; }
    throw new PaterhausApiError(message, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const paterhausJson = <T>(path: string, method: "POST" | "PATCH" | "PUT", body: unknown): Promise<T> =>
  paterhausRequest(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export interface Page<T> { data: T[]; meta: { page: number; total: number; totalPages: number }; }
export interface Items<T> { items: T[]; total: number; }
export interface ProductionCampaign {
  id: string; name: string; platform: string; direction: string; status: string;
  spendUsd: number; spendAmount: string | null; currency: string | null;
  startsAt: string | null; endsAt: string | null; notes: string | null;
  archivedAt: string | null;
}
export interface CrmUser { id: string; name: string; email: string; role: string; }
export interface ProductionLead {
  id: string; name: string | null; phone: string | null; email: string | null;
  propertyArea: string | null; propertyType: string | null; direction: string;
  source: string; stage: string; campaignId: string | null;
  priority: string | null; note: string | null; archivedAt: string | null;
  nextActionType: string | null; nextActionText: string | null; nextActionAt: string | null;
  quotedAmount: string | null; agreedAmount: string | null; currency: string;
  lostReason: string | null;
  assignedUser: CrmUser | null;
  externalChatId?: string | null; createdAt: string;
}
export interface ProjectRecord {
  id: string; name: string; status: string; propertyId: string | null;
  ownerLeadId: string | null; serviceDirections: string[];
  startDate: string | null; expectedCompletionDate: string | null; comment: string | null;
  money: { quoted: string | null; agreed: string | null; currency: string; paid: string; outstanding: string | null };
  milestones: Array<{ id: string; title: string; completedAt: string | null; sortOrder: number }>;
  payments: Array<{ id: string; type: string; status: string; amount: string; paidAt: string | null }>;
  contractors: Array<{ id: string; contractorId: string; contractor: { name: string } }>;
  archivedAt: string | null;
}
export interface PropertyRecord { id: string; name: string; area: string | null; address: string | null; type: string | null; archivedAt: string | null; }
export interface ContractorRecord { id: string; name: string; serviceTypes: string[]; active: boolean; email: string | null; phone: string | null; contactPerson: string | null; notes: string | null; }
export interface GuestRecord { id: string; name: string; phone: string | null; email: string | null; }
export interface StayRecord { id: string; checkIn: string; checkOut: string; status: string; guestCount: number; bookingValue: string | null; guest: GuestRecord; property: PropertyRecord; }

export const campaignsApi = {
  list: (page = 1) => paterhausRequest<Page<ProductionCampaign>>(`/campaigns?page=${page}&limit=100`),
  create: (body: unknown) => paterhausJson<ProductionCampaign>("/api/paterhaus/marketing/campaigns", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<ProductionCampaign>(`/api/paterhaus/marketing/campaigns/${id}`, "PATCH", body),
  archive: (id: string, archived: boolean) => paterhausJson<ProductionCampaign>(`/api/paterhaus/marketing/campaigns/${id}/archive`, "PATCH", { archived }),
  delete: (id: string) => paterhausRequest<void>(`/campaigns/${id}`, { method: "DELETE" }),
};
export const leadsApi = {
  list: (page = 1, archived = false) => paterhausRequest<Page<ProductionLead>>(`/leads?page=${page}&limit=100&archived=${archived}`),
  create: (body: unknown) => paterhausJson<ProductionLead>("/leads", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<ProductionLead>(`/leads/${id}`, "PATCH", body),
  archive: (id: string, archived: boolean) => paterhausJson<ProductionLead>(`/api/paterhaus/leads/${id}/archive`, "PATCH", { archived }),
  delete: (id: string) => paterhausRequest<void>(`/leads/${id}`, { method: "DELETE" }),
};
export const opportunitiesApi = {
  list: () => paterhausRequest<{ items: ProductionLead[]; integrationStatus: "live" | "unavailable" }>("/api/paterhaus/opportunities"),
};
export const usersApi = {
  list: () => paterhausRequest<Items<CrmUser>>("/api/paterhaus/users"),
};
export const projectsApi = {
  list: (archived = false) => paterhausRequest<Items<ProjectRecord>>(`/api/paterhaus/projects?archived=${archived}&limit=100`),
  create: (body: unknown) => paterhausJson<ProjectRecord>("/api/paterhaus/projects", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<ProjectRecord>(`/api/paterhaus/projects/${id}`, "PATCH", body),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/projects/${id}`, { method: "DELETE" }),
  archive: (id: string, archived: boolean) => paterhausJson<ProjectRecord>(`/api/paterhaus/projects/${id}/archive`, "PATCH", { archived }),
  milestone: (id: string, body: unknown) => paterhausJson(`/api/paterhaus/projects/${id}/milestones`, "POST", body),
  completeMilestone: (id: string, milestoneId: string, completedAt: string | null) =>
    paterhausJson(`/api/paterhaus/projects/${id}/milestones/${milestoneId}`, "PATCH", { completedAt }),
  payment: (id: string, body: unknown) => paterhausJson(`/api/paterhaus/projects/${id}/payments`, "POST", body),
  assign: (id: string, contractorId: string) => paterhausJson(`/api/paterhaus/projects/${id}/contractors`, "POST", { contractorId }),
};
export const propertiesApi = {
  list: (archived = false) => paterhausRequest<Items<PropertyRecord>>(`/api/paterhaus/properties?limit=100&archived=${archived}`),
  create: (body: unknown) => paterhausJson<PropertyRecord>("/api/paterhaus/properties", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<PropertyRecord>(`/api/paterhaus/properties/${id}`, "PATCH", body),
  archive: (id: string, archived: boolean) => paterhausJson<PropertyRecord>(`/api/paterhaus/properties/${id}/archive`, "PATCH", { archived }),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/properties/${id}`, { method: "DELETE" }),
};
export const contractorsApi = {
  list: (inactive = false) => paterhausRequest<Items<ContractorRecord>>(`/api/paterhaus/contractors?limit=100&archived=${inactive}`),
  create: (body: unknown) => paterhausJson<ContractorRecord>("/api/paterhaus/contractors", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<ContractorRecord>(`/api/paterhaus/contractors/${id}`, "PATCH", body),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/contractors/${id}`, { method: "DELETE" }),
};
export const guestsApi = {
  list: () => paterhausRequest<GuestRecord[]>("/api/paterhaus/guests?limit=100"),
  create: (body: unknown) => paterhausJson<GuestRecord>("/api/paterhaus/guests", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<GuestRecord>(`/api/paterhaus/guests/${id}`, "PATCH", body),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/guests/${id}`, { method: "DELETE" }),
};
export const staysApi = {
  list: () => paterhausRequest<StayRecord[]>("/api/paterhaus/stays?limit=100"),
  create: (body: unknown) => paterhausJson<StayRecord>("/api/paterhaus/stays", "POST", body),
  update: (id: string, body: unknown) => paterhausJson<StayRecord>(`/api/paterhaus/stays/${id}`, "PATCH", body),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/stays/${id}`, { method: "DELETE" }),
};
export interface InternalDocument { id: string; title: string; originalFileName: string; mimeType: string; sizeBytes: number; category: string; description: string | null; createdAt: string; }
export const internalDocumentsApi = {
  list: () => paterhausRequest<{ items: InternalDocument[] }>("/api/paterhaus/internal-documents"),
  upload: (file: File, title: string, category: string, description: string) =>
    paterhausRequest<InternalDocument>("/api/paterhaus/internal-documents", { method: "POST", body: file,
      headers: { "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(file.name),
        "X-File-Mime": file.type, "X-Title": encodeURIComponent(title), "X-Category": category,
        "X-Description": encodeURIComponent(description) } }),
  downloadUrl: (id: string) => paterhausRequest<{ url: string; expiresIn: number }>(`/api/paterhaus/internal-documents/${id}/download-url`, { method: "POST" }),
  delete: (id: string) => paterhausRequest<void>(`/api/paterhaus/internal-documents/${id}`, { method: "DELETE" }),
};
export interface BusinessOverview {
  sales: { newLeads: number; qualifiedLeads: number; activeOpportunities: number; overdueFollowUps: number; pipelineValue: Record<string, string> };
  operations: { activeProjects: number; projectsByService: Record<string, number>; completedThisMonth: number; awaitingPayment: number; awaitingContractor: number; overdue: number };
  finance: { revenueCollected: Record<string, string>; contractedValue: Record<string, string>; outstanding: Record<string, string>; depositsReceived: Record<string, string>; revenueByService: Record<string, Record<string, string>> };
  marketing: { spend: Record<string, string>; leads: number; qualified: number; signed: number; cpl: Record<string, string> | null };
  stays: { active: number; upcomingCheckIns: number };
}
export const analyticsApi = {
  overview: () => paterhausRequest<BusinessOverview>("/api/paterhaus/analytics/overview"),
};
