import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarModule } from "./CalendarModule";

let currentEmail = "guest@example.com";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: currentEmail, workspace: "paterhaus", role: "admin" },
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
});

describe("CalendarModule mode selection", () => {
  it("keeps the demo calendar for other accounts", () => {
    render(<CalendarModule />);
    expect(screen.getByText("calendar.eyebrow")).toBeInTheDocument();
    expect(screen.queryByText(/Live calendar for/)).not.toBeInTheDocument();
  });

  it("keeps the demo calendar for info@paterhaus.com", () => {
    currentEmail = "info@paterhaus.com";
    render(<CalendarModule />);
    expect(screen.getByText("calendar.eyebrow")).toBeInTheDocument();
  });

  it("uses the persistent backend calendar for r_tszi@paterhaus.com", () => {
    currentEmail = "R_Tszi@paterhaus.com";
    render(<CalendarModule />);
    expect(screen.getByText("Live calendar for R_Tszi@paterhaus.com")).toBeInTheDocument();
  });
});
