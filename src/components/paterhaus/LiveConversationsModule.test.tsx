import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchLiveConversationMessages,
  fetchLiveConversations,
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

beforeEach(() => {
  vi.clearAllMocks();
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
});
