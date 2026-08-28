import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationsModule } from "./ConversationsModule";

let currentEmail = "guest@example.com";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: currentEmail, workspace: "paterhaus", role: "admin" },
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/contexts/PaterhausWorkspaceContext", () => ({
  usePaterhausWorkspace: () => ({
    conversations: [],
    messages: [],
    properties: [],
    stays: [],
    tasks: [],
    opportunities: [],
    files: [],
    markConversationRead: vi.fn(),
    sendMessage: vi.fn(),
    createTaskFromConversation: vi.fn(),
    assignConversation: vi.fn(),
    setConversationStatus: vi.fn(),
  }),
}));

vi.mock("./LiveConversationsModule", () => ({
  LiveConversationsModule: ({ email }: { email: string }) => (
    <div>Live conversations for {email}</div>
  ),
}));

beforeEach(() => {
  currentEmail = "guest@example.com";
});

describe("ConversationsModule mode selection", () => {
  it("keeps non-allowlisted users on the demo path", () => {
    render(<ConversationsModule />);

    expect(screen.getByText("conversations.eyebrow")).toBeInTheDocument();
    expect(screen.queryByText(/Live conversations for/)).not.toBeInTheDocument();
  });

  it("uses live mode for an allowlisted authenticated user", () => {
    currentEmail = "info@paterhaus.com";

    render(<ConversationsModule />);

    expect(screen.getByText("Live conversations for info@paterhaus.com")).toBeInTheDocument();
  });
});
