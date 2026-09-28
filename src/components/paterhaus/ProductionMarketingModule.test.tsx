import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { campaignsApi, leadsApi, paterhausRequest } from "@/lib/paterhausApi";
import { ProductionMarketingModule } from "./ProductionMarketingModule";

vi.mock("@/lib/paterhausApi", () => ({
  campaignsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(), delete: vi.fn() },
  leadsApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn(), delete: vi.fn() },
  paterhausRequest: vi.fn(),
}));
const renderModule = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><ProductionMarketingModule /></QueryClientProvider>);
const campaign = { id: "campaign-1", name: "Snagging Dubai", platform: "INSTAGRAM", direction: "SNAGGING", status: "ACTIVE", spendAmount: "150.00", spendUsd: 0, currency: "AED", archivedAt: null, notes: null, startsAt: null, endsAt: null };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(campaignsApi.list).mockResolvedValue({ data: [campaign], meta: { page: 1, total: 1, totalPages: 1 } });
  vi.mocked(leadsApi.list).mockResolvedValue({ data: [], meta: { page: 1, total: 0, totalPages: 0 } });
  vi.mocked(paterhausRequest).mockResolvedValue({ leads: 0, qualified: 0, proposals: 0, signed: 0, spend: {}, cpl: null, costPerSigned: null, leadToQualified: null, byDirection: {} });
});

describe("shared production marketing", () => {
  it("loads campaigns from API and creates an AED campaign without localStorage", async () => {
    vi.mocked(campaignsApi.create).mockResolvedValue(campaign);
    renderModule();
    expect(await screen.findByText("Snagging Dubai")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add campaign" }));
    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Staging" } });
    fireEvent.change(screen.getByLabelText("Campaign spend"), { target: { value: "220.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save campaign" }));
    await waitFor(() => expect(campaignsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Staging", spendAmount: 220.5, currency: "AED" })));
  });

  it("creates a canonical lead and offers archive separate from delete", async () => {
    vi.mocked(leadsApi.create).mockResolvedValue({ id: "lead-1" } as never);
    vi.mocked(campaignsApi.archive).mockResolvedValue({ ...campaign, archivedAt: new Date().toISOString() });
    renderModule();
    await screen.findByText("Snagging Dubai");
    fireEvent.click(screen.getByRole("button", { name: "Leads" }));
    fireEvent.click(screen.getByRole("button", { name: "Add lead" }));
    fireEvent.change(screen.getByLabelText("Lead name"), { target: { value: "Client A" } });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));
    await waitFor(() => expect(leadsApi.create).toHaveBeenCalledWith(expect.objectContaining({ name: "Client A", source: "MANUAL" })));
    fireEvent.click(screen.getByRole("button", { name: "Campaigns" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(campaignsApi.archive).toHaveBeenCalledWith("campaign-1", true));
    expect(campaignsApi.delete).not.toHaveBeenCalled();
  });
});
