import type { Vendor, VendorJob } from "@/types/paterhaus";

const brightturnJobs: VendorJob[] = [
  { id: "vj-bt-1", date: "2025-08-19", propertyId: "prop-001", cost: 220, onTime: true, qualityScore: 4.7, completedAt: "2025-08-19T11:00:00", responseTime: 1.4 },
  { id: "vj-bt-2", date: "2025-08-17", propertyId: "prop-002", cost: 180, onTime: true, qualityScore: 4.5, completedAt: "2025-08-17T15:30:00", responseTime: 1.8 },
  { id: "vj-bt-3", date: "2025-08-15", propertyId: "prop-003", cost: 260, onTime: true, qualityScore: 4.8, completedAt: "2025-08-15T10:00:00", responseTime: 2.1 },
  { id: "vj-bt-4", date: "2025-08-12", propertyId: "prop-001", cost: 200, onTime: false, qualityScore: 4.2, completedAt: "2025-08-12T18:00:00", responseTime: 2.6 },
  { id: "vj-bt-5", date: "2025-08-08", propertyId: "prop-004", cost: 240, onTime: true, qualityScore: 4.6, completedAt: "2025-08-08T09:30:00", responseTime: 1.6 },
];

const vertexJobs: VendorJob[] = [
  { id: "vj-vx-1", date: "2025-08-18", propertyId: "prop-002", cost: 540, onTime: false, qualityScore: 4.1, completedAt: "2025-08-18T17:00:00", responseTime: 3.6 },
  { id: "vj-vx-2", date: "2025-08-14", propertyId: "prop-003", cost: 1250, onTime: true, qualityScore: 4.4, completedAt: "2025-08-14T12:00:00", responseTime: 3.0 },
  { id: "vj-vx-3", date: "2025-08-10", propertyId: "prop-001", cost: 780, onTime: false, qualityScore: 4.0, completedAt: "2025-08-10T19:00:00", responseTime: 4.2 },
  { id: "vj-vx-4", date: "2025-08-06", propertyId: "prop-004", cost: 320, onTime: true, qualityScore: 4.5, completedAt: "2025-08-06T11:00:00", responseTime: 2.8 },
];

const framefoundryJobs: VendorJob[] = [
  { id: "vj-ff-1", date: "2025-08-19", propertyId: "prop-001", cost: 1200, onTime: true, qualityScore: 4.9, completedAt: "2025-08-19T14:00:00", responseTime: 6 },
  { id: "vj-ff-2", date: "2025-08-13", propertyId: "prop-002", cost: 980, onTime: true, qualityScore: 4.8, completedAt: "2025-08-13T15:00:00", responseTime: 7.5 },
  { id: "vj-ff-3", date: "2025-08-07", propertyId: "prop-003", cost: 1500, onTime: true, qualityScore: 5.0, completedAt: "2025-08-07T10:00:00", responseTime: 8 },
];

const linenlaneJobs: VendorJob[] = [
  { id: "vj-ll-1", date: "2025-08-18", propertyId: "prop-003", cost: 140, onTime: true, qualityScore: 4.6, completedAt: "2025-08-18T08:30:00", responseTime: 3.5 },
  { id: "vj-ll-2", date: "2025-08-16", propertyId: "prop-001", cost: 110, onTime: true, qualityScore: 4.4, completedAt: "2025-08-16T09:00:00", responseTime: 4.2 },
  { id: "vj-ll-3", date: "2025-08-11", propertyId: "prop-002", cost: 180, onTime: false, qualityScore: 4.2, completedAt: "2025-08-11T20:00:00", responseTime: 5.1 },
  { id: "vj-ll-4", date: "2025-08-05", propertyId: "prop-004", cost: 95, onTime: true, qualityScore: 4.7, completedAt: "2025-08-05T08:00:00", responseTime: 3.8 },
];

const conciergeJobs: VendorJob[] = [
  { id: "vj-cp-1", date: "2025-08-20", propertyId: "prop-001", cost: 180, onTime: true, qualityScore: 4.8, completedAt: "2025-08-20T10:00:00", responseTime: 1.0 },
  { id: "vj-cp-2", date: "2025-08-15", propertyId: "prop-002", cost: 240, onTime: true, qualityScore: 4.7, completedAt: "2025-08-15T16:00:00", responseTime: 1.3 },
  { id: "vj-cp-3", date: "2025-08-09", propertyId: "prop-003", cost: 160, onTime: true, qualityScore: 4.6, completedAt: "2025-08-09T11:00:00", responseTime: 1.2 },
];

const computeOnTimeRate = (jobs: VendorJob[]): number =>
  jobs.length === 0 ? 0 : Math.round((jobs.filter((job) => job.onTime).length / jobs.length) * 100);

const computeAvgCost = (jobs: VendorJob[]): number =>
  jobs.length === 0 ? 0 : Math.round(jobs.reduce((sum, job) => sum + job.cost, 0) / jobs.length);

const computeAvgResponse = (jobs: VendorJob[]): number =>
  jobs.length === 0 ? 0 : Math.round((jobs.reduce((sum, job) => sum + job.responseTime, 0) / jobs.length) * 10) / 10;

const computeAvgQuality = (jobs: VendorJob[]): number =>
  jobs.length === 0 ? 0 : Math.round((jobs.reduce((sum, job) => sum + job.qualityScore, 0) / jobs.length) * 10) / 10;

export const paterhausVendors: Vendor[] = [
  {
    id: "vendor-brightturn",
    name: "BrightTurn Housekeeping",
    category: "Housekeeping vendor",
    services: ["Housekeeping", "Turnover", "Linen"],
    coverageAreas: ["Downtown Dubai", "Dubai Marina", "JBR"],
    contactPerson: "Maya Fernandes",
    phone: "+971 50 555 0201",
    averageResponseHours: 1.8,
    activeTaskCount: 3,
    completionRate: 94,
    slaRisk: "Medium",
    costRange: "$180–420",
    qualityScore: 4.6,
    totalJobs: 47,
    onTimeRate: computeOnTimeRate(brightturnJobs),
    avgCostUsd: computeAvgCost(brightturnJobs),
    repeatIssues: 3,
    customerSatisfaction: 4.5,
    status: "active",
    preferredVendor: true,
    jobs: brightturnJobs,
  },
  {
    id: "vendor-vertex",
    name: "Vertex Technical Services",
    category: "Maintenance vendor",
    services: ["HVAC", "General maintenance", "Electrical"],
    coverageAreas: ["All Dubai"],
    contactPerson: "Faisal Nadeem",
    phone: "+971 55 555 0206",
    averageResponseHours: 3.2,
    activeTaskCount: 2,
    completionRate: 89,
    slaRisk: "High",
    costRange: "$250–2,800",
    qualityScore: 4.3,
    totalJobs: 38,
    onTimeRate: computeOnTimeRate(vertexJobs),
    avgCostUsd: computeAvgCost(vertexJobs),
    repeatIssues: 6,
    customerSatisfaction: 4.0,
    status: "active",
    preferredVendor: false,
    jobs: vertexJobs,
  },
  {
    id: "vendor-framefoundry",
    name: "FrameFoundry Studio",
    category: "Staging / photography partner",
    services: ["Photography", "Floor plans", "Listing content"],
    coverageAreas: ["Dubai Marina", "Business Bay", "Dubai Creek Harbour"],
    contactPerson: "Theo Martin",
    phone: "+971 52 555 0210",
    averageResponseHours: 8,
    activeTaskCount: 1,
    completionRate: 98,
    slaRisk: "Low",
    costRange: "$850–1,900",
    qualityScore: 4.8,
    totalJobs: 22,
    onTimeRate: computeOnTimeRate(framefoundryJobs),
    avgCostUsd: computeAvgCost(framefoundryJobs),
    repeatIssues: 1,
    customerSatisfaction: 4.9,
    status: "active",
    preferredVendor: true,
    jobs: framefoundryJobs,
  },
  {
    id: "vendor-linenlane",
    name: "Linen Lane Dubai",
    category: "Laundry vendor",
    services: ["Laundry", "Linen supply"],
    coverageAreas: ["Palm Jumeirah", "Dubai Hills Estate", "JVC"],
    contactPerson: "Aisha Rahman",
    phone: "+971 54 555 0214",
    averageResponseHours: 4,
    activeTaskCount: 2,
    completionRate: 96,
    slaRisk: "Low",
    costRange: "$80–260",
    qualityScore: 4.5,
    totalJobs: 64,
    onTimeRate: computeOnTimeRate(linenlaneJobs),
    avgCostUsd: computeAvgCost(linenlaneJobs),
    repeatIssues: 2,
    customerSatisfaction: 4.4,
    status: "active",
    preferredVendor: false,
    jobs: linenlaneJobs,
  },
  {
    id: "vendor-concierge",
    name: "Harbour Concierge Partners",
    category: "Concierge partner",
    services: ["Guest assistance", "Arrival support", "Local recommendations"],
    coverageAreas: ["Dubai Marina", "JBR", "Downtown Dubai"],
    contactPerson: "Rania Haddad",
    phone: "+971 50 555 0220",
    averageResponseHours: 1.2,
    activeTaskCount: 1,
    completionRate: 97,
    slaRisk: "Low",
    costRange: "$120–450",
    qualityScore: 4.7,
    totalJobs: 31,
    onTimeRate: computeOnTimeRate(conciergeJobs),
    avgCostUsd: computeAvgCost(conciergeJobs),
    repeatIssues: 1,
    customerSatisfaction: 4.8,
    status: "active",
    preferredVendor: true,
    jobs: conciergeJobs,
  },
];

/* ------------------------------------------------------------------ */
/* P0.3 — Vendor ROI summary                                          */
/* ------------------------------------------------------------------ */

export type VendorRoi = {
  totalMarketingSpend: number;
  totalVendorCosts: number;
  totalOperatingCost: number;
  revenueFromSignedAgreements: number;
  netProfit: number;
  roi: number;
};

export const vendorRoi: VendorRoi = {
  totalMarketingSpend: 5550,
  totalVendorCosts: 18420,
  totalOperatingCost: 23970,
  revenueFromSignedAgreements: 198400,
  netProfit: 174430,
  roi: 728,
};

/** Aggregate a vendor's job history into a single performance row. */
export const summarizeVendorJobs = (jobs: VendorJob[]) => ({
  totalJobs: jobs.length,
  onTimeRate: computeOnTimeRate(jobs),
  avgResponseHours: computeAvgResponse(jobs),
  avgCostUsd: computeAvgCost(jobs),
  avgQuality: computeAvgQuality(jobs),
});
