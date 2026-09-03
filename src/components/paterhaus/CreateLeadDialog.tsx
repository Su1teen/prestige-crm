import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createManualLead,
  LEAD_SERVICES,
  normalizeManualLeadPhone,
  type LeadService,
  type LiveLeadClassification,
} from "@/lib/paterhausConversationsApi";

interface CreateLeadDialogProps {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: LiveLeadClassification) => void;
}

interface FormState {
  name: string;
  phoneNumber: string;
  email: string;
  propertyType: string;
  service: LeadService | "";
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: "",
  phoneNumber: "",
  email: "",
  propertyType: "",
  service: "",
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICE_LABEL_KEYS: Record<LeadService, string> = {
  Staging: "createLead.service.staging",
  Snagging: "createLead.service.snagging",
  "Property Management": "createLead.service.propertyManagement",
};

export const CreateLeadDialog = ({
  email,
  open,
  onOpenChange,
  onCreated,
}: CreateLeadDialogProps) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (next: FormState): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!next.phoneNumber.trim()) {
      nextErrors.phoneNumber = t("createLead.errors.phoneRequired");
    } else if (!normalizeManualLeadPhone(next.phoneNumber)) {
      nextErrors.phoneNumber = t("createLead.errors.phoneInvalid");
    }
    if (next.email.trim() && !EMAIL_PATTERN.test(next.email.trim())) {
      nextErrors.email = t("createLead.errors.emailInvalid");
    }
    if (!next.propertyType.trim()) {
      nextErrors.propertyType = t("createLead.errors.propertyTypeRequired");
    }
    if (!next.service) {
      nextErrors.service = t("createLead.errors.serviceRequired");
    }
    return nextErrors;
  };

  const close = (nextOpen: boolean) => {
    if (submitting) return;
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.service) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const lead = await createManualLead(email, {
        name: form.name.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        propertyType: form.propertyType.trim(),
        service: form.service,
      });
      setForm(EMPTY_FORM);
      onCreated(lead);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("createLead.errorFallback"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="dark max-h-[90vh] overflow-y-auto border-border bg-background text-foreground sm:max-w-lg"
        data-testid="create-lead-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("createLead.title")}</DialogTitle>
          <DialogDescription>{t("createLead.description")}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
          data-testid="create-lead-form"
        >
          <div className="space-y-1.5">
            <Label htmlFor="create-lead-name">{t("createLead.name")}</Label>
            <Input
              id="create-lead-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder={t("createLead.namePlaceholder")}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-phone">{t("createLead.phone")}</Label>
            <Input
              id="create-lead-phone"
              value={form.phoneNumber}
              onChange={(event) => update("phoneNumber", event.target.value)}
              placeholder={t("createLead.phonePlaceholder")}
              inputMode="tel"
              autoComplete="off"
              aria-invalid={Boolean(errors.phoneNumber)}
              required
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive" role="alert">
                {errors.phoneNumber}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-email">{t("createLead.email")}</Label>
            <Input
              id="create-lead-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder={t("createLead.emailPlaceholder")}
              autoComplete="off"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-property-type">
              {t("createLead.propertyType")}
            </Label>
            <Input
              id="create-lead-property-type"
              value={form.propertyType}
              onChange={(event) => update("propertyType", event.target.value)}
              placeholder={t("createLead.propertyTypePlaceholder")}
              autoComplete="off"
              aria-invalid={Boolean(errors.propertyType)}
              required
            />
            {errors.propertyType && (
              <p className="text-xs text-destructive" role="alert">
                {errors.propertyType}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-service">{t("createLead.service")}</Label>
            <select
              id="create-lead-service"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.service}
              onChange={(event) =>
                update("service", event.target.value as LeadService | "")
              }
              aria-invalid={Boolean(errors.service)}
              required
            >
              <option value="">{t("createLead.servicePlaceholder")}</option>
              {LEAD_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {t(SERVICE_LABEL_KEYS[service])}
                </option>
              ))}
            </select>
            {errors.service && (
              <p className="text-xs text-destructive" role="alert">
                {errors.service}
              </p>
            )}
          </div>

          {submitError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
            >
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => close(false)}
              disabled={submitting}
            >
              {t("createLead.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("createLead.submitting") : t("createLead.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
