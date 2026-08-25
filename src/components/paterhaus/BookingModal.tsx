import { useMemo, useState } from "react";
import { CalendarPlus, Check, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { PATERHAUS_TODAY } from "@/data/paterhaus";
import type { BookingType, OwnerOpportunity } from "@/types/paterhaus";

const bookingTypes: { value: BookingType; labelKey: string; defaultLabel: string }[] = [
  { value: "property_assessment", labelKey: "lead.booking.type.assessment", defaultLabel: "Property Assessment" },
  { value: "call", labelKey: "lead.booking.type.call", defaultLabel: "Call" },
  { value: "follow_up", labelKey: "lead.booking.type.followUp", defaultLabel: "Follow-up" },
];

const addDays = (date: string, amount: number): string => {
  const d = new Date(`${date}T10:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString();
};

const formatSlot = (slot: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(slot));

interface BookingModalProps {
  lead: OwnerOpportunity;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal = ({ lead, isOpen, onClose }: BookingModalProps) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [type, setType] = useState<BookingType>("property_assessment");
  const [proposedSlots, setProposedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [customSlot, setCustomSlot] = useState("");

  // Pre-existing bookings for this lead
  const leadBookings = useMemo(
    () => workspace.bookings.filter((booking) => booking.leadId === lead.id),
    [workspace.bookings, lead.id],
  );

  const proposeDefaultSlots = () => {
    const slots = [
      addDays(PATERHAUS_TODAY, 1).replace(":00.000Z", ":00:00"),
      addDays(PATERHAUS_TODAY, 1).replace(":00.000Z", ":00:00").replace("T10", "T14"),
      addDays(PATERHAUS_TODAY, 2).replace(":00.000Z", ":00:00").replace("T10", "T11"),
    ];
    setProposedSlots(slots);
  };

  const addCustomSlot = () => {
    if (!customSlot.trim()) return;
    // Normalize to ISO format
    const normalized = customSlot.includes("T") ? customSlot : `${customSlot}T10:00:00`;
    setProposedSlots((current) => [...current, normalized]);
    setCustomSlot("");
  };

  const handleConfirm = () => {
    if (!selectedSlot) {
      toast.error(t("lead.booking.selectSlot"));
      return;
    }
    workspace.createBooking({
      leadId: lead.id,
      leadName: lead.ownerName,
      type,
      proposedSlots,
      selectedSlot,
      area: lead.area,
      notes: notes.trim() || undefined,
    });
    toast.success(t("lead.booking.confirmed"));
    resetAndClose();
  };

  const handleSavePending = () => {
    if (proposedSlots.length === 0) {
      toast.error(t("lead.booking.proposeSlots"));
      return;
    }
    workspace.createBooking({
      leadId: lead.id,
      leadName: lead.ownerName,
      type,
      proposedSlots,
      area: lead.area,
      notes: notes.trim() || undefined,
    });
    toast.success(t("lead.booking.savedPending"));
    resetAndClose();
  };

  const resetAndClose = () => {
    setType("property_assessment");
    setProposedSlots([]);
    setSelectedSlot(undefined);
    setNotes("");
    setCustomSlot("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="dark max-h-[90vh] overflow-y-auto border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            {t("lead.booking.title")}
          </DialogTitle>
          <DialogDescription>
            {lead.ownerName} · {lead.area}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing bookings */}
          {leadBookings.length > 0 && (
            <div className="rounded-lg border border-border/70 bg-card/40 p-3">
              <p className="text-xs font-medium text-foreground">{t("lead.booking.existing")}</p>
              <ul className="mt-2 space-y-1.5">
                {leadBookings.map((booking) => (
                  <li key={booking.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {booking.type.replace(/_/g, " ")} ·{" "}
                      {booking.selectedSlot ? formatSlot(booking.selectedSlot) : t("lead.booking.pending")}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        booking.status === "confirmed"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : booking.status === "cancelled"
                            ? "border-red-500/40 bg-red-500/10 text-red-200"
                            : booking.status === "completed"
                              ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking type */}
          <div>
            <p className="text-xs font-medium text-foreground">{t("lead.booking.type")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {bookingTypes.map((bookingType) => (
                <Button
                  key={bookingType.value}
                  type="button"
                  size="sm"
                  variant={type === bookingType.value ? "secondary" : "outline"}
                  onClick={() => setType(bookingType.value)}
                >
                  {t(bookingType.labelKey) || bookingType.defaultLabel}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <Input
            placeholder={t("lead.booking.notesPlaceholder")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {/* Slot proposal */}
          {proposedSlots.length === 0 ? (
            <Button onClick={proposeDefaultSlots} className="w-full">
              <Clock3 className="h-4 w-4" />
              {t("lead.booking.proposeSlots")}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-foreground">{t("lead.booking.selectSlot")}</p>
              <RadioGroup value={selectedSlot ?? ""} onValueChange={setSelectedSlot}>
                <div className="space-y-2">
                  {proposedSlots.map((slot) => (
                    <label
                      key={slot}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                        selectedSlot === slot
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/70 bg-background/40 text-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <RadioGroupItem value={slot} />
                      <span className="flex-1">{formatSlot(slot)}</span>
                      {selectedSlot === slot && <Check className="h-4 w-4 text-primary" />}
                    </label>
                  ))}
                </div>
              </RadioGroup>

              {/* Add custom slot */}
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={customSlot}
                  onChange={(event) => setCustomSlot(event.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addCustomSlot} disabled={!customSlot.trim()}>
                  {t("lead.booking.addSlot")}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={handleConfirm} disabled={!selectedSlot}>
                  <Check className="h-4 w-4" />
                  {t("lead.booking.confirm")}
                </Button>
                <Button variant="outline" onClick={handleSavePending}>
                  {t("lead.booking.savePending")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setProposedSlots([]);
                    setSelectedSlot(undefined);
                  }}
                >
                  {t("lead.booking.reset")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
