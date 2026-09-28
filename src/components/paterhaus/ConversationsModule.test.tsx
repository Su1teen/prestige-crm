import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationsModule } from "./ConversationsModule";

let currentEmail = "guest@example.com";
let currentWorkspace = "paterhaus";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: currentEmail, workspace: currentWorkspace, role: "admin" },
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
  currentWorkspace = "paterhaus";
});

describe("ConversationsModule mode selection", () => {
  it("keeps non-Paterhaus workspaces on the demo path", () => {
    currentWorkspace = "steppe";
    render(<ConversationsModule />);

    expect(screen.getByText("conversations.eyebrow")).toBeInTheDocument();
    expect(screen.queryByText(/Live conversations for/)).not.toBeInTheDocument();
  });

  it("uses live conversations for every authenticated Paterhaus account", () => {
    render(<ConversationsModule />);

    expect(screen.getByText("Live conversations for guest@example.com")).toBeInTheDocument();
  });

  it("uses live mode for an allowlisted authenticated user", () => {
    currentEmail = "info@paterhaus.com";

    render(<ConversationsModule />);

    expect(screen.getByText("Live conversations for info@paterhaus.com")).toBeInTheDocument();
  });
});
