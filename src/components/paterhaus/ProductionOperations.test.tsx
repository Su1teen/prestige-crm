import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { contractorsApi, leadsApi, projectsApi, propertiesApi } from "@/lib/paterhausApi";
import { ProductionProjectsModule } from "./ProductionProjectsModule";
import { ProductionContractorsModule, ProductionPropertiesModule } from "./ProductionOperationsRecords";

vi.mock("@/lib/paterhausApi", () => ({
  contractorsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
  leadsApi: { list: vi.fn() }, projectsApi: { list: vi.fn(), create: vi.fn(), payment: vi.fn(), archive: vi.fn() },
  propertiesApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(), delete: vi.fn() },
  guestsApi: { list: vi.fn() }, staysApi: { list: vi.fn() },
}));
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
const project = { id: "project-1", name: "Snagging A", propertyId: null, ownerLeadId: null, status: "DRAFT", serviceDirections: ["SNAGGING"],
  money: { quoted: null, agreed: null, currency: "AED", paid: "0.00", outstanding: null },
  milestones: [], contractors: [], payments: [], archivedAt: null, startDate: null, expectedCompletionDate: null, comment: null };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(projectsApi.list).mockResolvedValue({ items: [project], total: 1 });
  vi.mocked(propertiesApi.list).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(contractorsApi.list).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(leadsApi.list).mockResolvedValue({ data: [], meta: { page: 1, total: 0, totalPages: 0 } });
});

describe("production operations UI", () => {
  it("shows unknown project amounts as dash and allows a service project to be created", async () => {
    vi.mocked(projectsApi.create).mockResolvedValue(project);
    render(<ProductionProjectsModule />, { wrapper });
    expect(await screen.findByText("Snagging A")).toBeInTheDocument();
    expect(screen.getByText(/Agreed —/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New project" }));
    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Staging project" } });
    fireEvent.click(screen.getByRole("button", { name: "Save project" }));
    await waitFor(() => expect(projectsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Staging project", agreedAmount: null, quotedAmount: null, currency: "AED" })));
  });

  it("records an explicit positive prepayment against a selected project", async () => {
    vi.mocked(projectsApi.payment).mockResolvedValue({} as never);
    render(<ProductionProjectsModule />, { wrapper });
    await screen.findByText("Snagging A");
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    fireEvent.change(screen.getByLabelText("Payment amount"), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() => expect(projectsApi.payment).toHaveBeenCalledWith("project-1", expect.objectContaining({ amount: 3000, currency: "AED", type: "PREPAYMENT" })));
  });

  it("archives and unarchives a property through the archive action", async () => {
    const property = { id: "prop-1", name: "Villa A", area: "Palm", address: null, type: "Villa", archivedAt: null };
    vi.mocked(propertiesApi.list).mockResolvedValue({ items: [property], total: 1 });
    vi.mocked(propertiesApi.archive).mockResolvedValue({ ...property, archivedAt: "2026-01-01T00:00:00.000Z" });
    render(<ProductionPropertiesModule />, { wrapper });
    await screen.findByText("Villa A");
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(propertiesApi.archive).toHaveBeenCalledWith("prop-1", true));
  });

  it("requires Snagging or Staging for a contractor and saves both services", async () => {
    vi.mocked(contractorsApi.create).mockResolvedValue({ id: "contractor-1" } as never);
    render(<ProductionContractorsModule />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Add contractor" }));
    fireEvent.change(screen.getByLabelText("Contractor name"), { target: { value: "Supplier A" } });
    fireEvent.click(screen.getByLabelText("SNAGGING"));
    fireEvent.click(screen.getByLabelText("STAGING"));
    fireEvent.click(screen.getByRole("button", { name: "Save contractor" }));
    await waitFor(() => expect(contractorsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Supplier A", serviceTypes: ["SNAGGING", "STAGING"] })));
  });
});
