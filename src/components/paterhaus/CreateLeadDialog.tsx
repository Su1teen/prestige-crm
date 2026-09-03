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
import {
  createManualLead,
  LEAD_PROPERTY_TYPES,
  LEAD_SERVICES,
  normalizeManualLeadPhone,
  type LeadPropertyType,
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
  propertyType: LeadPropertyType | "";
  service: LeadService | "";
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: "", phoneNumber: "", email: "", propertyType: "", service: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const validate = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
  else if (!normalizeManualLeadPhone(form.phoneNumber)) errors.phoneNumber = "Enter a valid phone number";
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (!form.propertyType) errors.propertyType = "Select a property type";
  if (!form.service) errors.service = "Select a service";
  return errors;
};

export const CreateLeadDialog = ({ email, open, onOpenChange, onCreated }: CreateLeadDialogProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
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
    if (Object.keys(nextErrors).length > 0 || !form.propertyType || !form.service) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const lead = await createManualLead(email, {
        name: form.name.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        propertyType: form.propertyType,
        service: form.service,
      });
      setForm(EMPTY_FORM);
      onCreated(lead);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Lead could not be saved right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create lead</DialogTitle>
          <DialogDescription>
            Adds the lead to the live Owner Pipeline. Only the phone number, property type and
            service are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="create-lead-form">
          <div className="space-y-1.5">
            <Label htmlFor="create-lead-name">Name</Label>
            <Input
              id="create-lead-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Optional"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-phone">Phone number</Label>
            <Input
              id="create-lead-phone"
              value={form.phoneNumber}
              onChange={(event) => update("phoneNumber", event.target.value)}
              placeholder="+971 50 123 4567"
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
            <Label htmlFor="create-lead-email">Email</Label>
            <Input
              id="create-lead-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="Optional"
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
            <Label htmlFor="create-lead-property-type">Property type</Label>
            <select
              id="create-lead-property-type"
              className={selectClassName}
              value={form.propertyType}
              onChange={(event) => update("propertyType", event.target.value as LeadPropertyType | "")}
              aria-invalid={Boolean(errors.propertyType)}
              required
            >
              <option value="">Select property type</option>
              {LEAD_PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.propertyType && (
              <p className="text-xs text-destructive" role="alert">
                {errors.propertyType}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-lead-service">Service</Label>
            <select
              id="create-lead-service"
              className={selectClassName}
              value={form.service}
              onChange={(event) => update("service", event.target.value as LeadService | "")}
              aria-invalid={Boolean(errors.service)}
              required
            >
              <option value="">Select service</option>
              {LEAD_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
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
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
