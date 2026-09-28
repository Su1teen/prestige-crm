import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarModule } from "./CalendarModule";

let currentEmail = "guest@example.com";
let currentWorkspace = "paterhaus";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: currentEmail, workspace: currentWorkspace, role: "admin" },
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

vi.mock("@/contexts/PaterhausWorkspaceContext", () => ({
  usePaterhausWorkspace: () => ({
    properties: [],
    tasks: [],
    stays: [],
    compliance: [],
    bookings: [],
  }),
}));

vi.mock("./LiveCalendarModule", () => ({
  LiveCalendarModule: ({ email }: { email: string }) => <div>Live calendar for {email}</div>,
}));

beforeEach(() => {
  currentEmail = "guest@example.com";
  currentWorkspace = "paterhaus";
});

describe("CalendarModule mode selection", () => {
  it("keeps the demo calendar for non-Paterhaus workspaces", () => {
    currentWorkspace = "steppe";
    render(<CalendarModule />);
    expect(screen.getByText("calendar.eyebrow")).toBeInTheDocument();
    expect(screen.queryByText(/Live calendar for/)).not.toBeInTheDocument();
  });

  it("uses the persistent calendar for every authenticated Paterhaus account", () => {
    render(<CalendarModule />);
    expect(screen.getByText("Live calendar for guest@example.com")).toBeInTheDocument();
  });

  it("uses the same persistent calendar for info@paterhaus.com", () => {
    currentEmail = "info@paterhaus.com";
    render(<CalendarModule />);
    expect(screen.getByText("Live calendar for info@paterhaus.com")).toBeInTheDocument();
  });

  it("uses the persistent backend calendar for r_tszi@paterhaus.com", () => {
    currentEmail = "R_Tszi@paterhaus.com";
    render(<CalendarModule />);
    expect(screen.getByText("Live calendar for R_Tszi@paterhaus.com")).toBeInTheDocument();
  });
});
