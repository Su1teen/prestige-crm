import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import PaterhausCRM from "./PaterhausCRM";

let currentUser: { email: string; role: "admin" | "marketing" } = {
  email: "info@paterhaus.com",
  role: "admin",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { ...currentUser, workspace: "paterhaus" } }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Radix DropdownMenu relies on PointerEvent, which jsdom does not implement.
// Render the menu inline so menu items are clickable in tests.
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div />,
}));

vi.mock("@/contexts/PaterhausWorkspaceContext", () => ({
  PaterhausWorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePaterhausWorkspace: () => ({
    notifications: [],
    tasks: [],
    opportunities: [],
    owners: [],
    properties: [],
    guests: [],
    files: [],
    knowledgeItems: [],
  }),
}));

vi.mock("@/components/paterhaus/PortfolioOverview", () => ({ PortfolioOverview: () => <div data-testid="module-portfolio">portfolio</div> }));
vi.mock("@/components/paterhaus/OwnerPipelineModule", () => ({ OwnerPipelineModule: () => <div data-testid="module-pipeline">pipeline</div> }));
vi.mock("@/components/paterhaus/MarketingModule", () => ({ MarketingModule: () => <div data-testid="module-marketing">marketing</div> }));
vi.mock("@/components/paterhaus/ConversationsModule", () => ({ ConversationsModule: () => <div data-testid="module-conversations">conversations</div> }));
vi.mock("@/components/paterhaus/CalendarModule", () => ({ CalendarModule: () => <div data-testid="module-calendar">calendar</div> }));
vi.mock("@/components/paterhaus/KnowledgeBaseModule", () => ({ KnowledgeBaseModule: () => <div data-testid="module-knowledge">knowledge</div> }));
vi.mock("@/components/paterhaus/NotificationsModule", () => ({ NotificationsModule: () => <div data-testid="module-notifications">notifications</div> }));
vi.mock("@/components/paterhaus/SettingsModule", () => ({ SettingsModule: () => <div data-testid="module-settings">settings</div> }));
vi.mock("@/components/paterhaus/PropertiesModule", () => ({ PropertiesModule: () => <div data-testid="module-properties">properties</div> }));
vi.mock("@/components/paterhaus/OperationsBoardModule", () => ({ OperationsBoardModule: () => <div data-testid="module-operations">operations</div> }));
vi.mock("@/components/paterhaus/FilesHubModule", () => ({ FilesHubModule: () => <div data-testid="module-files">files</div> }));
vi.mock("@/components/paterhaus/GuestsStaysModule", () => ({ GuestsStaysModule: () => <div data-testid="module-stays">stays</div> }));
vi.mock("@/components/paterhaus/FinanceModule", () => ({ FinanceModule: () => <div data-testid="module-finance">finance</div> }));
vi.mock("@/components/paterhaus/ComplianceModule", () => ({ ComplianceModule: () => <div data-testid="module-compliance">compliance</div> }));
vi.mock("@/components/paterhaus/TeamVendorsModule", () => ({ TeamVendorsModule: () => <div data-testid="module-team">team</div> }));
vi.mock("@/components/paterhaus/CreateDialog", () => ({ CreateDialog: () => null }));

const primaryNavLabels = () =>
  within(screen.getAllByRole("navigation", { name: "Primary navigation" })[0])
    .getAllByRole("button")
    .filter((button) => !button.hasAttribute("aria-expanded"))
    .map((button) => button.textContent ?? "")
    .filter((label) => label.startsWith("nav."));

beforeEach(() => {
  currentUser = { email: "info@paterhaus.com", role: "admin" };
});

describe("PaterhausCRM navigation", () => {
  it("shows exactly Owner Pipeline, Marketing, Conversations and Calendar to r_tszi@paterhaus.com", () => {
    currentUser = { email: "r_tszi@paterhaus.com", role: "marketing" };

    render(<PaterhausCRM onLogout={vi.fn()} />);

    expect(primaryNavLabels()).toEqual([
      "nav.owner_pipeline",
      "nav.marketing",
      "nav.conversations",
      "nav.calendar",
    ]);
    expect(screen.queryByText("nav.portfolio")).not.toBeInTheDocument();
    expect(screen.queryByTestId("module-portfolio")).not.toBeInTheDocument();
    expect(screen.getByTestId("module-pipeline")).toBeInTheDocument();
    expect(screen.queryByText("shell.demoWorkspace")).not.toBeInTheDocument();
  });

  it("lets r_tszi@paterhaus.com move between the four sections and never reach Portfolio", () => {
    currentUser = { email: "r_tszi@paterhaus.com", role: "marketing" };

    render(<PaterhausCRM onLogout={vi.fn()} />);
    const nav = screen.getAllByRole("navigation", { name: "Primary navigation" })[0];

    fireEvent.click(within(nav).getByText("nav.marketing"));
    expect(screen.getByTestId("module-marketing")).toBeInTheDocument();
    fireEvent.click(within(nav).getByText("nav.conversations"));
    expect(screen.getByTestId("module-conversations")).toBeInTheDocument();
    fireEvent.click(within(nav).getByText("nav.calendar"));
    expect(screen.getByTestId("module-calendar")).toBeInTheDocument();
    fireEvent.click(within(nav).getByText("nav.owner_pipeline"));
    expect(screen.getByTestId("module-pipeline")).toBeInTheDocument();
    expect(screen.queryByTestId("module-portfolio")).not.toBeInTheDocument();
  });

  it("keeps Portfolio and the full admin navigation for info@paterhaus.com", () => {
    render(<PaterhausCRM onLogout={vi.fn()} />);

    const labels = primaryNavLabels();
    expect(labels[0]).toBe("nav.portfolio");
    expect(labels).toEqual(
      expect.arrayContaining([
        "nav.owner_pipeline",
        "nav.marketing",
        "nav.conversations",
        "nav.calendar",
        "nav.properties",
        "nav.knowledge_base",
        "nav.settings",
      ]),
    );
    expect(screen.getByTestId("module-portfolio")).toBeInTheDocument();
  });

  it("keeps the demo marketing workspace (with Portfolio) for other marketing accounts", () => {
    currentUser = { email: "marketing@example.com", role: "marketing" };

    render(<PaterhausCRM onLogout={vi.fn()} />);

    expect(primaryNavLabels()).toEqual([
      "nav.portfolio",
      "nav.owner_pipeline",
      "nav.marketing",
      "nav.conversations",
      "nav.calendar",
      "nav.knowledge_base",
      "nav.notifications",
      "nav.settings",
    ]);
    expect(screen.getByTestId("module-portfolio")).toBeInTheDocument();
    expect(screen.getByText("shell.demoWorkspace")).toBeInTheDocument();
  });
});

describe("PaterhausCRM global Create Lead action", () => {
  it("opens the shared Create Lead modal directly for live accounts (no Owner-Pipeline-only hint)", () => {
    render(<PaterhausCRM onLogout={vi.fn()} />);

    // Choose "New Lead" from the global Create menu.
    fireEvent.click(screen.getByText("create.newLead"));

    // The shared Create Lead modal opens immediately, from anywhere in the workspace.
    expect(screen.getByTestId("create-lead-form")).toBeInTheDocument();
    // The Owner-Pipeline-only hint toast is never shown.
    expect(toast.info).not.toHaveBeenCalledWith("create.liveLeadHint");
  });

  it("does not render the Create Lead modal for non-live accounts", () => {
    currentUser = { email: "marketing@example.com", role: "marketing" };
    render(<PaterhausCRM onLogout={vi.fn()} />);

    fireEvent.click(screen.getByText("create.newLead"));

    // Non-live accounts keep the demo "Log Owner Note" flow; no live Create Lead form.
    expect(screen.queryByTestId("create-lead-form")).not.toBeInTheDocument();
  });
});
