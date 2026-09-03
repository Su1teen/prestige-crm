import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createManualLead,
  fetchLiveLeadClassifications,
  LiveConversationsError,
  type LiveLeadClassification,
} from "@/lib/paterhausConversationsApi";
import { LiveOwnerPipelineModule, sortLeadClassifications } from "./LiveOwnerPipelineModule";

vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    fetchLiveLeadClassifications: vi.fn(),
    createManualLead: vi.fn(),
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
  email: null,
  displayName: "sultan",
  summary: "Wants staging for a 3-bedroom apartment",
  leadType: "Apartment",
  stage: "qualified",
  priority: "High",
  workType: "Property Management",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-28T18:00:00.000Z",
  isActive: null,
  ...overrides,
});

const listMock = vi.mocked(fetchLiveLeadClassifications);
const createMock = vi.mocked(createManualLead);

const listOf = (items: LiveLeadClassification[]) =>
  listMock.mockResolvedValue({ items, nextCursor: null, supportsArchive: false });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LiveOwnerPipelineModule", () => {
  it("renders live classifications with property type, service and Asia/Dubai timestamps", async () => {
    listOf([
      classification(),
      classification({
        id: 4,
        displayName: "Aruzhan",
        stage: "new",
        leadType: "Villa",
        updatedAt: "2026-08-27T18:00:00.000Z",
      }),
    ]);

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    const first = await screen.findByTestId("live-classification-3");
    const second = screen.getByTestId("live-classification-4");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText("Wants staging for a 3-bedroom apartment")).toHaveLength(2);
    expect(within(first).getByTitle("Property type")).toHaveTextContent("Apartment");
    expect(within(second).getByTitle("Property type")).toHaveTextContent("Villa");
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getAllByText("Property Management")).toHaveLength(2);
    // 2026-08-28T18:00Z is 22:00 in Dubai (UTC+4)
    expect(within(first).getByText(/Updated 28 Aug 2026, 22:00/)).toBeInTheDocument();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith("info@paterhaus.com", expect.anything());
  });

  it("maps every property type and legacy identity values to the property-type badge", async () => {
    listOf([
      classification({ id: 1, leadType: "Apartment" }),
      classification({ id: 2, leadType: "Villa" }),
      classification({ id: 3, leadType: "Townhouse" }),
      classification({ id: 4, leadType: "Studio" }),
      classification({ id: 5, leadType: "Other" }),
      classification({ id: 6, leadType: "owner" }),
      classification({ id: 7, leadType: null }),
    ]);

    render(<LiveOwnerPipelineModule email="r_tszi@paterhaus.com" />);

    await screen.findByTestId("live-classification-1");
    const badges = [1, 2, 3, 4, 5, 6, 7].map(
      (id) => within(screen.getByTestId(`live-classification-${id}`)).getByTitle("Property type").textContent,
    );
    expect(badges).toEqual(["Apartment", "Villa", "Townhouse", "Studio", "Other", "Other", "Other"]);
  });

  it("falls back for missing name, email and service", async () => {
    listOf([
      classification({
        id: 9,
        displayName: "Unnamed lead",
        name: null,
        username: null,
        email: null,
        workType: null,
      }),
      classification({ id: 10, displayName: "Ivan", email: "ivan@example.com", workType: "Snagging" }),
    ]);

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    const unnamed = await screen.findByTestId("live-classification-9");
    expect(within(unnamed).getByText("Unnamed lead")).toBeInTheDocument();
    expect(screen.getByTestId("live-classification-9-email")).toHaveTextContent("Not provided");
    expect(within(unnamed).getByTitle("Service")).toHaveTextContent("Not specified");
    expect(screen.getByTestId("live-classification-10-email")).toHaveTextContent("ivan@example.com");
    expect(within(screen.getByTestId("live-classification-10")).getByTitle("Service")).toHaveTextContent(
      "Snagging",
    );
  });

  it("sorts by priority (Urgent, High, Medium, Low) and then by updated_at descending", () => {
    const sorted = sortLeadClassifications([
      classification({ id: 1, priority: "Low", updatedAt: "2026-09-03T10:00:00.000Z" }),
      classification({ id: 2, priority: "Medium", updatedAt: "2026-09-01T10:00:00.000Z" }),
      classification({ id: 3, priority: "Medium", updatedAt: "2026-09-02T10:00:00.000Z" }),
      classification({ id: 4, priority: "urgent", updatedAt: "2026-08-01T10:00:00.000Z" }),
      classification({ id: 5, priority: "High", updatedAt: "2026-08-15T10:00:00.000Z" }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual([4, 5, 3, 2, 1]);
  });

  it("shows an empty state when no classifications exist", async () => {
    listOf([]);

    render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);

    expect(await screen.findByText("No leads yet")).toBeInTheDocument();
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
    listOf([classification({ stage: "escalated", workType: "snagging" })]);

    render(<LiveOwnerPipelineModule email="r_tszi@paterhaus.com" />);

    expect(await screen.findByText("escalated")).toBeInTheDocument();
    expect(screen.getByText("Snagging")).toBeInTheDocument();
  });

  describe("Create lead", () => {
    it.each(["info@paterhaus.com", "r_tszi@paterhaus.com"])("is offered to %s", async (email) => {
      listOf([]);
      render(<LiveOwnerPipelineModule email={email} />);
      await screen.findByText("No leads yet");
      expect(screen.getByRole("button", { name: /Create lead/ })).toBeInTheDocument();
    });

    it("is hidden for any other account", async () => {
      listOf([]);
      render(<LiveOwnerPipelineModule email="someone@paterhaus.com" />);
      await screen.findByText("No leads yet");
      expect(screen.queryByRole("button", { name: /Create lead/ })).not.toBeInTheDocument();
    });

    const fillForm = (values: {
      name?: string;
      phone?: string;
      email?: string;
      propertyType?: string;
      service?: string;
    }) => {
      if (values.name !== undefined)
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: values.name } });
      if (values.phone !== undefined)
        fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: values.phone } });
      if (values.email !== undefined)
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: values.email } });
      if (values.propertyType !== undefined)
        fireEvent.change(screen.getByLabelText("Property type"), {
          target: { value: values.propertyType },
        });
      if (values.service !== undefined)
        fireEvent.change(screen.getByLabelText("Service"), { target: { value: values.service } });
    };

    it("offers exactly the five fields with the exact property-type and service options", async () => {
      listOf([]);
      render(<LiveOwnerPipelineModule email="r_tszi@paterhaus.com" />);
      await screen.findByText("No leads yet");
      fireEvent.click(screen.getByRole("button", { name: /Create lead/ }));

      const form = await screen.findByTestId("create-lead-form");
      expect(within(form).getAllByRole("textbox")).toHaveLength(3);
      expect(within(form).getAllByRole("combobox")).toHaveLength(2);
      const propertyOptions = within(screen.getByLabelText("Property type"))
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(propertyOptions).toEqual([
        "Select property type",
        "Apartment",
        "Villa",
        "Townhouse",
        "Studio",
        "Other",
      ]);
      const serviceOptions = within(screen.getByLabelText("Service"))
        .getAllByRole("option")
        .map((option) => option.textContent);
      expect(serviceOptions).toEqual(["Select service", "Staging", "Snagging", "Property Management"]);
    });

    it("validates required fields client-side before calling the API", async () => {
      listOf([]);
      render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);
      await screen.findByText("No leads yet");
      fireEvent.click(screen.getByRole("button", { name: /Create lead/ }));
      await screen.findByTestId("create-lead-form");

      fillForm({ email: "nope" });
      fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

      expect(await screen.findByText("Phone number is required")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
      expect(screen.getByText("Select a property type")).toBeInTheDocument();
      expect(screen.getByText("Select a service")).toBeInTheDocument();
      expect(createMock).not.toHaveBeenCalled();

      fillForm({ phone: "abc" });
      fireEvent.click(screen.getByRole("button", { name: "Save lead" }));
      expect(await screen.findByText("Enter a valid phone number")).toBeInTheDocument();
      expect(createMock).not.toHaveBeenCalled();
    });

    it("submits the mapped payload, closes, shows success and adds the lead without reloading", async () => {
      listOf([classification({ id: 3, priority: "High" })]);
      const created = classification({
        id: 41,
        chatId: "971501234567",
        number: "971501234567",
        username: null,
        name: null,
        displayName: "971501234567",
        email: null,
        summary: "Manual lead created from CRM. Conversation has not started yet.",
        leadType: "Townhouse",
        stage: "new",
        priority: "Medium",
        workType: "Staging",
        updatedAt: "2026-09-03T08:00:00.000Z",
      });
      createMock.mockResolvedValue(created);

      render(<LiveOwnerPipelineModule email="r_tszi@paterhaus.com" />);
      await screen.findByTestId("live-classification-3");
      fireEvent.click(screen.getByRole("button", { name: /Create lead/ }));
      await screen.findByTestId("create-lead-form");

      fillForm({ name: "  ", phone: "+971 50 123 4567", email: "", propertyType: "Townhouse", service: "Staging" });
      fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

      await waitFor(() =>
        expect(createMock).toHaveBeenCalledWith("r_tszi@paterhaus.com", {
          name: null,
          phoneNumber: "+971 50 123 4567",
          email: null,
          propertyType: "Townhouse",
          service: "Staging",
        }),
      );
      await waitFor(() => expect(screen.queryByTestId("create-lead-form")).not.toBeInTheDocument());
      expect(screen.getByRole("status")).toHaveTextContent("Lead 971501234567 saved to the pipeline.");

      const added = screen.getByTestId("live-classification-41");
      expect(within(added).getByTitle("Property type")).toHaveTextContent("Townhouse");
      expect(within(added).getByTitle("Service")).toHaveTextContent("Staging");
      expect(screen.getByTestId("live-classification-41-email")).toHaveTextContent("Not provided");
      // Medium priority sorts after the existing High lead.
      const existing = screen.getByTestId("live-classification-3");
      expect(existing.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(listMock).toHaveBeenCalledTimes(1);
    });

    it("replaces the existing card when the backend updates a duplicate phone", async () => {
      listOf([classification({ id: 3, leadType: "Apartment", workType: "Staging" })]);
      createMock.mockResolvedValue(classification({ id: 3, leadType: "Villa", workType: "Snagging" }));

      render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);
      await screen.findByTestId("live-classification-3");
      fireEvent.click(screen.getByRole("button", { name: /Create lead/ }));
      await screen.findByTestId("create-lead-form");
      fillForm({ phone: "77021464983", propertyType: "Villa", service: "Snagging" });
      fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

      await waitFor(() => expect(screen.queryByTestId("create-lead-form")).not.toBeInTheDocument());
      expect(screen.getAllByTestId(/^live-classification-\d+$/)).toHaveLength(1);
      expect(within(screen.getByTestId("live-classification-3")).getByTitle("Property type")).toHaveTextContent(
        "Villa",
      );
    });

    it("surfaces backend errors inside the dialog", async () => {
      listOf([]);
      createMock.mockRejectedValue(new LiveConversationsError("Account is not allowed to create leads", 403));

      render(<LiveOwnerPipelineModule email="info@paterhaus.com" />);
      await screen.findByText("No leads yet");
      fireEvent.click(screen.getByRole("button", { name: /Create lead/ }));
      await screen.findByTestId("create-lead-form");
      fillForm({ phone: "971501234567", propertyType: "Other", service: "Property Management" });
      fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

      expect(await screen.findByText("Account is not allowed to create leads")).toBeInTheDocument();
      expect(screen.getByTestId("create-lead-form")).toBeInTheDocument();
    });
  });
});
