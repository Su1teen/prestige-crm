import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { leadsApi, opportunitiesApi, usersApi, type ProductionLead } from "@/lib/paterhausApi";
import { ProductionPipelineModule } from "./ProductionPipelineModule";

vi.mock("@/lib/paterhausApi", () => ({
  leadsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(), delete: vi.fn() },
  opportunitiesApi: { list: vi.fn() },
  usersApi: { list: vi.fn() },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "info@paterhaus.com", workspace: "paterhaus", role: "admin" } }),
}));
vi.mock("./LiveOwnerPipelineModule", () => ({ LiveOwnerPipelineModule: () => <div /> }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

const lead: ProductionLead = {
  id: "lead-1", name: "Owner A", phone: "+971500000000", email: null,
  propertyArea: "Marina", propertyType: "Apartment", direction: "SNAGGING", source: "MANUAL", stage: "new",
  campaignId: null, priority: "Medium", note: null, archivedAt: null,
  nextActionType: "FOLLOW_UP", nextActionText: null, nextActionAt: null,
  quotedAmount: null, agreedAmount: null, currency: "AED",
  lostReason: null, assignedUser: null, externalChatId: null, createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(opportunitiesApi.list).mockResolvedValue({ items: [lead], integrationStatus: "live" });
  vi.mocked(leadsApi.list).mockResolvedValue({ data: [], meta: { page: 1, total: 0, totalPages: 0 } });
  vi.mocked(usersApi.list).mockResolvedValue({ items: [{ id: "user-1", name: "Ops Manager", email: "ops@paterhaus.com", role: "OPERATIONS" }] });
  vi.mocked(leadsApi.update).mockResolvedValue(lead);
});

describe("production pipeline assignment and loss", () => {
  it("assigns a lead to a CRM user through the persistent API", async () => {
    render(<ProductionPipelineModule />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(await screen.findByLabelText("Assignee"), { target: { value: "user-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save opportunity" }));
    await waitFor(() => expect(leadsApi.update).toHaveBeenCalledWith("lead-1", expect.objectContaining({ assignedUserId: "user-1" })));
  });

  it("records a lost reason only when the stage is lost", async () => {
    render(<ProductionPipelineModule />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.queryByLabelText("Lost reason")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Stage"), { target: { value: "lost" } });
    fireEvent.change(await screen.findByLabelText("Lost reason"), { target: { value: "Price above budget" } });
    fireEvent.click(screen.getByRole("button", { name: "Save opportunity" }));
    await waitFor(() => expect(leadsApi.update).toHaveBeenCalledWith("lead-1",
      expect.objectContaining({ stage: "lost", lostReason: "Price above budget" })));
  });

  it("shows the assignee on the card once linked", async () => {
    vi.mocked(opportunitiesApi.list).mockResolvedValue({
      items: [{ ...lead, assignedUser: { id: "user-1", name: "Ops Manager", email: "ops@paterhaus.com", role: "OPERATIONS" } }],
      integrationStatus: "live",
    });
    render(<ProductionPipelineModule />, { wrapper });
    expect(await screen.findByText(/Assigned Ops Manager/)).toBeInTheDocument();
  });
});
