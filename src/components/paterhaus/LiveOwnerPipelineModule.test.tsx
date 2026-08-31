import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLiveLeadClassifications,
  type LiveLeadClassification,
} from "@/lib/paterhausConversationsApi";
import { LiveOwnerPipelineModule } from "./LiveOwnerPipelineModule";

vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    fetchLiveLeadClassifications: vi.fn(),
  };
});

const classification = (
  overrides: Partial<LiveLeadClassification> = {},
): LiveLeadClassification => ({
  id: 3,
  chatId: "77021464983@c.us",
  number: "77021464983",
  username: "sultan",
  name: null,
  displayName: "sultan",
  summary: "Wants staging for a 3-bedroom apartment",
  leadType: "owner",
  stage: "qualified",
  priority: "high",
  workType: "property_management",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-28T18:00:00.000Z",
  isActive: null,
  ...overrides,
});

const listMock = vi.mocked(fetchLiveLeadClassifications);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LiveOwnerPipelineModule", () => {
  it("renders live classifications with human-readable labels in API order", async () => {
    listMock.mockResolvedValue({
      items: [classification(), classification({ id: 4, displayName: "Aruzhan", stage: "new" })],
      nextCursor: null,
      supportsArchive: false,
    });

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    const first = await screen.findByTestId("live-classification-3");
    const second = screen.getByTestId("live-classification-4");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("Wants staging for a 3-bedroom apartment")).toHaveLength(2);
    expect(screen.getAllByText("Owner")).toHaveLength(2);
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getAllByText("Property Management")).toHaveLength(2);
    expect(listMock).toHaveBeenCalledWith("info@paterhaus.com", expect.anything());
  });

  it("shows an empty state when no classifications exist", async () => {
    listMock.mockResolvedValue({ items: [], nextCursor: null, supportsArchive: false });

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    expect(await screen.findByText("No AI lead classifications yet")).toBeInTheDocument();
  });

  it("shows a retryable failure state", async () => {
    listMock.mockRejectedValueOnce(new Error("unavailable"));
    listMock.mockResolvedValueOnce({
      items: [classification()],
      nextCursor: null,
      supportsArchive: false,
    });

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    expect(
      await screen.findByText("Live lead classifications are temporarily unavailable."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }));

    await waitFor(() => expect(screen.getByTestId("live-classification-3")).toBeInTheDocument());
  });

  it("keeps unrecognized backend values visible", async () => {
    listMock.mockResolvedValue({
      items: [classification({ stage: "escalated", workType: "snagging" })],
      nextCursor: null,
      supportsArchive: false,
    });

    render(<LiveOwnerPipelineModule email="r_tszi@paterhaus.com" />);

    expect(await screen.findByText("escalated")).toBeInTheDocument();
    expect(screen.getByText("Snagging")).toBeInTheDocument();
  });
});
