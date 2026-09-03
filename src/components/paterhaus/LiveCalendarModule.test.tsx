import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLiveCalendarEvent,
  deleteLiveCalendarEvent,
  fetchLiveCalendarEvents,
  type LiveCalendarEvent,
} from "@/lib/paterhausConversationsApi";
import {
  LiveCalendarModule,
  addMonths,
  endOfMonth,
  mondayFirstOffset,
  sortCalendarEvents,
  todayInDubai,
} from "./LiveCalendarModule";

vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    fetchLiveCalendarEvents: vi.fn(),
    createLiveCalendarEvent: vi.fn(),
    deleteLiveCalendarEvent: vi.fn(),
  };
});

const listMock = vi.mocked(fetchLiveCalendarEvents);
const createMock = vi.mocked(createLiveCalendarEvent);
const deleteMock = vi.mocked(deleteLiveCalendarEvent);

const event = (overrides: Partial<LiveCalendarEvent> = {}): LiveCalendarEvent => ({
  id: "evt-1",
  title: "Snagging · Marina Gate",
  description: null,
  eventDate: "2026-09-10",
  startTime: "10:00",
  endTime: "11:30",
  kind: "operation",
  createdBy: "r_tszi@paterhaus.com",
  createdAt: "2026-09-01T06:00:00.000Z",
  updatedAt: "2026-09-01T06:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  // 2026-09-02 23:30 UTC is already 2026-09-03 03:30 in Dubai (UTC+4).
  vi.useFakeTimers({ now: new Date("2026-09-02T23:30:00.000Z"), toFake: ["Date"] });
  listMock.mockResolvedValue({ items: [], timeZone: "Asia/Dubai" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Asia/Dubai calendar helpers", () => {
  it("derives today from Dubai time rather than UTC", () => {
    expect(todayInDubai(new Date("2026-09-02T23:30:00.000Z"))).toBe("2026-09-03");
    expect(todayInDubai(new Date("2026-09-30T20:30:00.000Z"))).toBe("2026-10-01");
    expect(todayInDubai(new Date("2026-09-03T12:00:00.000Z"))).toBe("2026-09-03");
  });

  it("aligns September 2026 correctly (starts on a Tuesday, 30 days)", () => {
    expect(mondayFirstOffset("2026-09-01")).toBe(1);
    expect(endOfMonth("2026-09-01")).toBe("2026-09-30");
    expect(addMonths("2026-09-15", 1)).toBe("2026-10-01");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-01");
  });

  it("sorts by day, then start time (all-day last), then creation", () => {
    const sorted = sortCalendarEvents([
      event({ id: "c", eventDate: "2026-09-11", startTime: "08:00" }),
      event({ id: "b", eventDate: "2026-09-10", startTime: null }),
      event({ id: "a", eventDate: "2026-09-10", startTime: "09:00" }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});

describe("LiveCalendarModule", () => {
  it("opens on the current Dubai month, highlights today and requests that month's range", async () => {
    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);

    expect(await screen.findByTestId("live-calendar-month")).toHaveTextContent("September 2026");
    expect(screen.getByTestId("live-calendar-today")).toHaveTextContent(/Thursday,? 3 September 2026/);
    expect(screen.getByTestId("live-calendar-day-2026-09-03")).toHaveAttribute("data-today", "true");
    expect(screen.queryByTestId("live-calendar-day-2026-09-31")).not.toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith(
      "r_tszi@paterhaus.com",
      { from: "2026-09-01", to: "2026-09-30" },
      expect.anything(),
    );
  });

  it("renders persisted events on their Dubai calendar day and lists them for the selected day", async () => {
    listMock.mockResolvedValue({
      items: [event(), event({ id: "evt-2", eventDate: "2026-09-03", title: "Owner call", startTime: null, endTime: null, kind: "booking" })],
      timeZone: "Asia/Dubai",
    });

    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);

    expect(await screen.findByTestId("live-calendar-event-evt-2")).toHaveTextContent("All day");
    expect(within(screen.getByTestId("live-calendar-day-2026-09-10")).getByText("Snagging · Marina Gate")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("live-calendar-day-2026-09-10"));
    expect(screen.getByTestId("live-calendar-event-evt-1")).toHaveTextContent("10:00–11:30");
    expect(screen.queryByTestId("live-calendar-event-evt-2")).not.toBeInTheDocument();
  });

  it("navigates months and refetches the new range", async () => {
    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);
    await screen.findByTestId("live-calendar-month");

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByTestId("live-calendar-month")).toHaveTextContent("October 2026");
    await waitFor(() =>
      expect(listMock).toHaveBeenLastCalledWith(
        "r_tszi@paterhaus.com",
        { from: "2026-10-01", to: "2026-10-31" },
        expect.anything(),
      ),
    );
  });

  it("creates an event through the backend and shows it immediately", async () => {
    createMock.mockResolvedValue(
      event({ id: "evt-9", title: "Viewing · JVC", eventDate: "2026-09-03", startTime: "14:00", endTime: null, kind: "booking" }),
    );

    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);
    await screen.findByTestId("live-calendar-month");
    fireEvent.click(screen.getByRole("button", { name: /New event/ }));
    await screen.findByTestId("create-event-form");

    expect(screen.getByLabelText("Date")).toHaveValue("2026-09-03");
    fireEvent.click(screen.getByRole("button", { name: "Save event" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Viewing · JVC" } });
    fireEvent.change(screen.getByLabelText("Start time"), { target: { value: "14:00" } });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "booking" } });
    fireEvent.click(screen.getByRole("button", { name: "Save event" }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith("r_tszi@paterhaus.com", {
        title: "Viewing · JVC",
        description: null,
        eventDate: "2026-09-03",
        startTime: "14:00",
        endTime: null,
        kind: "booking",
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("create-event-form")).not.toBeInTheDocument());
    expect(screen.getByTestId("live-calendar-event-evt-9")).toHaveTextContent("Viewing · JVC");
    expect(screen.getByRole("status")).toHaveTextContent('Event "Viewing · JVC" saved for 2026-09-03.');
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it("deletes an event through the backend and removes it from the view", async () => {
    listMock.mockResolvedValue({ items: [event({ eventDate: "2026-09-03" })], timeZone: "Asia/Dubai" });
    deleteMock.mockResolvedValue(undefined);

    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);
    await screen.findByTestId("live-calendar-event-evt-1");

    fireEvent.click(screen.getByRole("button", { name: "Delete Snagging · Marina Gate" }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("r_tszi@paterhaus.com", "evt-1"));
    await waitFor(() => expect(screen.queryByTestId("live-calendar-event-evt-1")).not.toBeInTheDocument());
    expect(screen.getByText("No events")).toBeInTheDocument();
  });

  it("shows a retryable error when the backend is unavailable", async () => {
    listMock.mockRejectedValueOnce(new Error("down"));
    listMock.mockResolvedValueOnce({ items: [event({ eventDate: "2026-09-03" })], timeZone: "Asia/Dubai" });

    render(<LiveCalendarModule email="r_tszi@paterhaus.com" />);

    expect(await screen.findByText("Calendar is temporarily unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByTestId("live-calendar-event-evt-1")).toBeInTheDocument();
  });
});
