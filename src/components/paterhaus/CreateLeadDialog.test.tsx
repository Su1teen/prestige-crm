import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, LANGUAGE_STORAGE_KEY } from "@/contexts/LanguageContext";
import {
  createManualLead,
  LiveConversationsError,
  type LiveLeadClassification,
} from "@/lib/paterhausConversationsApi";
import { CreateLeadDialog } from "./CreateLeadDialog";

vi.mock("@/lib/paterhausConversationsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/paterhausConversationsApi")>();
  return {
    ...original,
    createManualLead: vi.fn(),
  };
});

const createMock = vi.mocked(createManualLead);

const lead = (overrides: Partial<LiveLeadClassification> = {}): LiveLeadClassification => ({
  id: 41,
  chatId: "971501234567",
  number: "971501234567",
  username: null,
  name: null,
  email: null,
  displayName: "971501234567",
  summary: "Manual lead created from CRM. Conversation has not started yet.",
  leadType: "Townhouse",
  stage: "new",
  priority: "Medium",
  workType: "Staging",
  createdAt: "2026-09-03T08:00:00.000Z",
  updatedAt: "2026-09-03T08:00:00.000Z",
  isActive: null,
  ...overrides,
});

const renderWithLanguage = (ui: React.ReactNode, language: "en" | "ru" = "en") => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  return render(<LanguageProvider>{ui}</LanguageProvider>);
};

const renderDialog = (language: "en" | "ru" = "en", onCreated = vi.fn()) =>
  renderWithLanguage(
    <CreateLeadDialog
      email="info@paterhaus.com"
      open
      onOpenChange={vi.fn()}
      onCreated={onCreated}
    />,
    language,
  );

const fillForm = (values: {
  name?: string;
  phone?: string;
  email?: string;
  propertyType?: string;
  service?: string;
}) => {
  if (values.name !== undefined)
    fireEvent.change(screen.getByLabelText(/Name|Имя/), { target: { value: values.name } });
  if (values.phone !== undefined)
    fireEvent.change(screen.getByLabelText(/Phone number|Номер телефона/), {
      target: { value: values.phone },
    });
  if (values.email !== undefined)
    fireEvent.change(screen.getByLabelText(/Email|Эл\. почта/), { target: { value: values.email } });
  if (values.propertyType !== undefined)
    fireEvent.change(screen.getByLabelText(/Property type|Тип недвижимости/), {
      target: { value: values.propertyType },
    });
  if (values.service !== undefined)
    fireEvent.change(screen.getByLabelText(/Service|Услуга/), { target: { value: values.service } });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateLeadDialog", () => {
  it("applies the dark Paterhaus styling to the dialog content", () => {
    renderDialog("en");
    const dialog = screen.getByTestId("create-lead-dialog");
    expect(dialog.className).toContain("dark");
    expect(dialog.className).toContain("bg-background");
    expect(dialog.className).toContain("border-border");
  });

  it("renders English translations when the locale is English", () => {
    renderDialog("en");
    expect(screen.getByRole("heading", { name: "Create lead" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Adds the lead to the live Owner Pipeline. Only the phone number, property type and service are required.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Property type")).toBeInTheDocument();
    expect(screen.getByLabelText("Service")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save lead" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders Russian translations when the locale is Russian", () => {
    renderDialog("ru");
    expect(screen.getByRole("heading", { name: "Создать лида" })).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Номер телефона")).toBeInTheDocument();
    expect(screen.getByLabelText("Эл. почта")).toBeInTheDocument();
    expect(screen.getByLabelText("Тип недвижимости")).toBeInTheDocument();
    expect(screen.getByLabelText("Услуга")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить лида" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeInTheDocument();
  });

  it("uses the English property-type placeholder", () => {
    renderDialog("en");
    expect(screen.getByPlaceholderText("e.g. Apartment, Villa, Townhouse")).toBeInTheDocument();
  });

  it("uses the Russian property-type placeholder", () => {
    renderDialog("ru");
    expect(screen.getByPlaceholderText("напр. Квартира, Вилла, Таунхаус")).toBeInTheDocument();
  });

  it("property type is a free-text input, not a fixed select", () => {
    renderDialog("en");
    const form = screen.getByTestId("create-lead-form");
    const propertyType = screen.getByLabelText("Property type");
    expect(propertyType.tagName).toBe("INPUT");
    // It is exposed as a textbox, not a combobox (select).
    expect(propertyType).toHaveRole("textbox");
    // The only combobox in the form is the Service select; property type has no options.
    expect(within(form).getAllByRole("combobox")).toHaveLength(1);
    expect(within(form).getAllByRole("textbox")).toContain(propertyType);
  });

  it("accepts a custom property type such as 'Duplex with garden'", async () => {
    const onCreated = vi.fn();
    createMock.mockResolvedValue(lead({ leadType: "Duplex with garden" }));
    renderDialog("en", onCreated);

    fillForm({ phone: "+971 50 123 4567", propertyType: "  Duplex with garden  ", service: "Staging" });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith("info@paterhaus.com", {
        name: null,
        phoneNumber: "+971 50 123 4567",
        email: null,
        // Trimmed, exact user-entered value, not normalized to a hardcoded enum.
        propertyType: "Duplex with garden",
        service: "Staging",
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ leadType: "Duplex with garden" }));
  });

  it("rejects a blank/whitespace-only property type before calling the API", async () => {
    renderDialog("en");
    fillForm({ phone: "+971 50 123 4567", propertyType: "   ", service: "Staging" });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

    expect(await screen.findByText("Enter a property type")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("sends the canonical service value even when the label is localized", async () => {
    createMock.mockResolvedValue(lead());
    renderDialog("ru");

    fillForm({ phone: "+971 50 123 4567", propertyType: "Вилла", service: "Staging" });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить лида" }));

    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith("info@paterhaus.com", {
        name: null,
        phoneNumber: "+971 50 123 4567",
        email: null,
        propertyType: "Вилла",
        service: "Staging",
      }),
    );
  });

  it("offers exactly the three canonical services with localized labels", () => {
    renderDialog("ru");
    const serviceSelect = screen.getByLabelText("Услуга") as HTMLSelectElement;
    const options = Array.from(serviceSelect.querySelectorAll("option")).map(
      (option) => option.textContent,
    );
    expect(options).toEqual([
      "Выберите услугу",
      "Хоум-стейджинг",
      "Снэггинг",
      "Управление недвижимостью",
    ]);
  });

  it("passes the backend response (e.g. an updated duplicate) to onCreated", async () => {
    const onCreated = vi.fn();
    // Backend upserts by chat_id and returns the updated existing row.
    createMock.mockResolvedValue(lead({ id: 3, leadType: "Villa", workType: "Snagging" }));
    renderDialog("en", onCreated);

    fillForm({ phone: "971501234567", propertyType: "Villa", service: "Snagging" });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 3, leadType: "Villa", workType: "Snagging" }),
      ),
    );
  });

  it("surfaces a backend error message inside the dialog and keeps the form open", async () => {
    createMock.mockRejectedValue(
      new LiveConversationsError("Account is not allowed to create leads", 403),
    );
    renderDialog("en");

    fillForm({ phone: "971501234567", propertyType: "Other", service: "Property Management" });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));

    expect(await screen.findByText("Account is not allowed to create leads")).toBeInTheDocument();
    expect(screen.getByTestId("create-lead-form")).toBeInTheDocument();
  });

  it("does not reset the form before the API request succeeds", async () => {
    createMock.mockRejectedValue(new LiveConversationsError("boom", 400));
    renderDialog("en");

    fillForm({ phone: "+971 50 123 4567", propertyType: "Villa", service: "Staging" });
    fireEvent.click(screen.getByRole("button", { name: "Save lead" }));
    await screen.findByText("boom");

    // Form values are preserved after a failed submit so the user can retry.
    expect((screen.getByLabelText("Phone number") as HTMLInputElement).value).toBe("+971 50 123 4567");
    expect((screen.getByLabelText("Property type") as HTMLInputElement).value).toBe("Villa");
  });
});
