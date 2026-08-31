import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLiveConversationCapabilities,
  fetchLiveConversationMessages,
  fetchLiveConversations,
  sendLiveConversationMessage,
  updateLiveConversationAi,
  type LiveConversation,
  type LiveConversationDetail,
} from "@/lib/paterhausConversationsApi";
import { LiveConversationsModule } from "./LiveConversationsModule";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    fetchLiveConversations: vi.fn(),
    fetchLiveConversationMessages: vi.fn(),
    fetchLiveConversationCapabilities: vi.fn(),
    sendLiveConversationMessage: vi.fn(),
    updateLiveConversationAi: vi.fn(),
  };
});

const conversation = (aiEnabled: boolean): LiveConversation => ({
  id: 6,
  chatId: "canonical-chat-id",
  number: "77021464983",
  contactName: "Sultan",
  aiEnabled,
  lastMessagePreview: "Latest message",
  lastMessageId: 24,
  lastMessageTimeRaw: "2026-08-28, 23:50:14.112",
  lastMessageAt: "2026-08-28T18:50:14.112Z",
});

const detail = (aiEnabled: boolean): LiveConversationDetail => ({
  conversation: {
    id: 6,
    chatId: "canonical-chat-id",
    number: "77021464983",
    contactName: "Sultan",
    aiEnabled,
    aiResumedAt: null,
  },
  messages: [
    {
      id: 23,
      chatId: "canonical-chat-id",
      senderName: "Sultan",
      senderType: "contact",
      direction: "inbound",
      text: "First incoming message",
      timeRaw: "2026-08-28, 23:50:12.438",
      sentAt: "2026-08-28T18:50:12.438Z",
    },
    {
      id: 24,
      chatId: "canonical-chat-id",
      senderName: "AI",
      senderType: "ai",
      direction: "outbound",
      text: "Second outgoing message",
      timeRaw: "2026-08-28, 23:50:14.112",
      sentAt: "2026-08-28T18:50:14.112Z",
    },
  ],
});

const listMock = vi.mocked(fetchLiveConversations);
const detailMock = vi.mocked(fetchLiveConversationMessages);
const updateMock = vi.mocked(updateLiveConversationAi);
const capabilitiesMock = vi.mocked(fetchLiveConversationCapabilities);
const sendMock = vi.mocked(sendLiveConversationMessage);

beforeEach(() => {
  vi.clearAllMocks();
  capabilitiesMock.mockResolvedValue({
    manualMessages: true,
    attachments: false,
    maxMessageLength: 4096,
  });
});

describe("LiveConversationsModule", () => {
  it("renders the live list and preserves backend message order", async () => {
    listMock.mockResolvedValue({ items: [conversation(true)], nextCursor: null });
    detailMock.mockResolvedValue(detail(true));

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    expect(await screen.findByText("Latest message")).toBeInTheDocument();
    expect(screen.getAllByText("77021464983")).toHaveLength(2);
    const first = await screen.findByTestId("live-message-23");
    const second = screen.getByTestId("live-message-24");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("sends aiEnabled false when taking over", async () => {
    listMock.mockResolvedValue({ items: [conversation(true)], nextCursor: null });
    detailMock.mockResolvedValue(detail(true));
    updateMock.mockResolvedValue({
      id: 6,
      chatId: "canonical-chat-id",
      aiEnabled: false,
      aiResumedAt: null,
    });

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    fireEvent.click(await screen.findByRole("button", { name: "Take over AI" }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("info@paterhaus.com", 6, false),
    );
    expect(await screen.findByRole("button", { name: "Resume AI" })).toBeInTheDocument();
  });

  it("sends aiEnabled true when resuming AI", async () => {
    listMock.mockResolvedValue({ items: [conversation(false)], nextCursor: null });
    detailMock.mockResolvedValue(detail(false));
    updateMock.mockResolvedValue({
      id: 6,
      chatId: "canonical-chat-id",
      aiEnabled: true,
      aiResumedAt: "2026-08-28T18:55:00.000Z",
    });

    render(<LiveConversationsModule email="r_tszi@paterhaus.com" />);

    fireEvent.click(await screen.findByRole("button", { name: "Resume AI" }));
    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("r_tszi@paterhaus.com", 6, true),
    );
    expect(await screen.findByRole("button", { name: "Take over AI" })).toBeInTheDocument();
  });

  it("shows a failure state instead of an empty history when the request fails", async () => {
    listMock.mockResolvedValue({ items: [conversation(true)], nextCursor: null });
    detailMock.mockRejectedValue(new Error("unavailable"));

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    expect(
      await screen.findByText("Live conversation history is temporarily unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No messages in this conversation")).not.toBeInTheDocument();
  });

  it("distinguishes a genuinely empty history from a failure", async () => {
    listMock.mockResolvedValue({ items: [conversation(true)], nextCursor: null });
    detailMock.mockResolvedValue({ ...detail(true), messages: [] });

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    expect(await screen.findByText("No messages in this conversation")).toBeInTheDocument();
  });

  it("hides the composer and attachment control while AI is active", async () => {
    listMock.mockResolvedValue({ items: [conversation(true)], nextCursor: null });
    detailMock.mockResolvedValue(detail(true));

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    await screen.findByTestId("live-message-23");
    expect(screen.queryByTestId("live-composer")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Reply message" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /attach/i })).not.toBeInTheDocument();
  });

  it("hides the composer again once AI is resumed", async () => {
    listMock.mockResolvedValue({ items: [conversation(false)], nextCursor: null });
    detailMock.mockResolvedValue(detail(false));
    updateMock.mockResolvedValue({
      id: 6,
      chatId: "canonical-chat-id",
      aiEnabled: true,
      aiResumedAt: "2026-08-28T18:55:00.000Z",
    });

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    expect(await screen.findByTestId("live-composer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume AI" }));

    await waitFor(() => expect(screen.queryByTestId("live-composer")).not.toBeInTheDocument());
  });

  it("keeps the composer hidden when the deployment cannot send manual replies", async () => {
    listMock.mockResolvedValue({ items: [conversation(false)], nextCursor: null });
    detailMock.mockResolvedValue(detail(false));
    capabilitiesMock.mockResolvedValue({
      manualMessages: false,
      attachments: false,
      maxMessageLength: 4096,
    });

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    expect(
      await screen.findByText("Manual replies are not configured for this deployment yet."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("live-composer")).not.toBeInTheDocument();
  });

  it("sends a manual reply and appends the delivered message", async () => {
    listMock.mockResolvedValue({ items: [conversation(false)], nextCursor: null });
    detailMock.mockResolvedValue(detail(false));
    sendMock.mockResolvedValue({
      message: {
        id: 25,
        chatId: "canonical-chat-id",
        senderName: "info@paterhaus.com",
        senderType: "human",
        direction: "outbound",
        text: "Manager reply text",
        timeRaw: "2026-08-29, 10:00:00.000",
        sentAt: "2026-08-29T05:00:00.000Z",
      },
    });

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    const input = await screen.findByRole("textbox", { name: "Reply message" });
    fireEvent.change(input, { target: { value: "Manager reply text" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(sendMock).toHaveBeenCalledWith(
        "info@paterhaus.com",
        6,
        "Manager reply text",
        expect.any(String),
      ),
    );
    expect(await screen.findByTestId("live-message-25")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Reply message" })).toHaveValue("");
  });

  it("keeps the draft and reports the failure when delivery fails", async () => {
    listMock.mockResolvedValue({ items: [conversation(false)], nextCursor: null });
    detailMock.mockResolvedValue(detail(false));
    sendMock.mockRejectedValue(new Error("not delivered"));

    render(<LiveConversationsModule email="info@paterhaus.com" />);

    const input = await screen.findByRole("textbox", { name: "Reply message" });
    fireEvent.change(input, { target: { value: "Undelivered text" } });
    fireEvent.click(screen.getByRole("button", { name: /Send/ }));

    expect(
      await screen.findByText("The reply could not be delivered. Your text was kept."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Reply message" })).toHaveValue("Undelivered text");
  });
});
