import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createLiveCalendarEvent,
  deleteLiveCalendarEvent,
  fetchLiveCalendarEvents,
  type CalendarEventKind,
  type LiveCalendarEvent,
} from "@/lib/paterhausConversationsApi";
import { EmptyState, SectionHeader } from "./shared";

export const DUBAI_TIME_ZONE = "Asia/Dubai";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const KIND_LABELS: Record<CalendarEventKind, string> = {
  operation: "Operation",
  booking: "Booking",
  blocked: "Blocked",
  risk: "Risk",
  occupied: "Occupied",
};

const KIND_ORDER: readonly CalendarEventKind[] = ["operation", "booking", "blocked", "risk", "occupied"];

const kindStyles: Record<CalendarEventKind, string> = {
  occupied: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  blocked: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  operation: "border-primary/30 bg-primary/10 text-primary",
  risk: "border-red-500/30 bg-red-500/10 text-red-100",
  booking: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Today's calendar day in Asia/Dubai as YYYY-MM-DD, independent of the browser's zone. */
export const todayInDubai = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DUBAI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

// Calendar-day arithmetic is done on the YYYY-MM-DD string via UTC so no zone shifts leak in.
const parseDay = (value: string): Date => new Date(`${value}T00:00:00Z`);
const formatDay = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (value: string, amount: number): string => {
  const date = parseDay(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDay(date);
};

export const startOfMonth = (value: string): string => `${value.slice(0, 7)}-01`;

export const addMonths = (value: string, amount: number): string => {
  const date = parseDay(startOfMonth(value));
  date.setUTCMonth(date.getUTCMonth() + amount);
  return formatDay(date);
};

export const endOfMonth = (value: string): string => {
  const date = parseDay(startOfMonth(value));
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return formatDay(date);
};

const daysInMonth = (value: string): number => Number(endOfMonth(value).slice(8, 10));

/** Offset of the first day of the month in a Monday-first week (0 = Monday). */
export const mondayFirstOffset = (value: string): number => {
  const weekday = parseDay(startOfMonth(value)).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
};

export const monthLabel = (value: string): string =>
  parseDay(startOfMonth(value)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

const longDayLabel = (value: string): string =>
  parseDay(value).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const timeLabel = (event: LiveCalendarEvent): string => {
  if (!event.startTime) return "All day";
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
};

export const sortCalendarEvents = (items: readonly LiveCalendarEvent[]): LiveCalendarEvent[] =>
  [...items].sort((a, b) => {
    if (a.eventDate !== b.eventDate) return a.eventDate < b.eventDate ? -1 : 1;
    const aTime = a.startTime ?? "";
    const bTime = b.startTime ?? "";
    if (aTime !== bTime) {
      if (!aTime) return 1;
      if (!bTime) return -1;
      return aTime < bTime ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });

interface FormState {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  kind: CalendarEventKind;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const validate = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!ISO_DATE.test(form.eventDate)) errors.eventDate = "Select a date";
  if (form.startTime && !TIME.test(form.startTime)) errors.startTime = "Use HH:MM";
  if (form.endTime && !TIME.test(form.endTime)) errors.endTime = "Use HH:MM";
  if (form.endTime && !form.startTime) errors.startTime = "Add a start time";
  if (form.startTime && form.endTime && form.endTime <= form.startTime) errors.endTime = "End must be after start";
  return errors;
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const CreateEventDialog = ({
  email,
  open,
  initialDate,
  onOpenChange,
  onCreated,
}: {
  email: string;
  open: boolean;
  initialDate: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (event: LiveCalendarEvent) => void;
}) => {
  const emptyForm = useCallback(
    (): FormState => ({ title: "", description: "", eventDate: initialDate, startTime: "", endTime: "", kind: "operation" }),
    [initialDate],
  );
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open, emptyForm]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const close = (nextOpen: boolean) => {
    if (submitting) return;
    if (!nextOpen) {
      setErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createLiveCalendarEvent(email, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        eventDate: form.eventDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        kind: form.kind,
      });
      onCreated(created);
      onOpenChange(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Event could not be saved right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New calendar event</DialogTitle>
          <DialogDescription>Dates and times are in Dubai time (Asia/Dubai) and are saved for everyone.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="create-event-form">
          <div className="space-y-1.5">
            <Label htmlFor="calendar-event-title">Title</Label>
            <Input
              id="calendar-event-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              aria-invalid={Boolean(errors.title)}
              required
            />
            {errors.title && <p className="text-xs text-destructive" role="alert">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-event-date">Date</Label>
            <Input
              id="calendar-event-date"
              type="date"
              value={form.eventDate}
              onChange={(event) => update("eventDate", event.target.value)}
              aria-invalid={Boolean(errors.eventDate)}
              required
            />
            {errors.eventDate && <p className="text-xs text-destructive" role="alert">{errors.eventDate}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calendar-event-start">Start time</Label>
              <Input
                id="calendar-event-start"
                type="time"
                value={form.startTime}
                onChange={(event) => update("startTime", event.target.value)}
                aria-invalid={Boolean(errors.startTime)}
              />
              {errors.startTime && <p className="text-xs text-destructive" role="alert">{errors.startTime}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calendar-event-end">End time</Label>
              <Input
                id="calendar-event-end"
                type="time"
                value={form.endTime}
                onChange={(event) => update("endTime", event.target.value)}
                aria-invalid={Boolean(errors.endTime)}
              />
              {errors.endTime && <p className="text-xs text-destructive" role="alert">{errors.endTime}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-event-kind">Type</Label>
            <select
              id="calendar-event-kind"
              className={selectClassName}
              value={form.kind}
              onChange={(event) => update("kind", event.target.value as CalendarEventKind)}
            >
              {KIND_ORDER.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-event-description">Notes</Label>
            <Textarea
              id="calendar-event-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Optional"
              rows={3}
            />
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
              Save event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const LiveCalendarModule = ({ email }: { email: string }) => {
  const today = useMemo(() => todayInDubai(), []);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(today));
  const [items, setItems] = useState<LiveCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const from = monthAnchor;
  const to = endOfMonth(monthAnchor);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchLiveCalendarEvents(email, { from, to }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(sortCalendarEvents(result.items));
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("Calendar is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [email, from, to, reloadToken]);

  const goToMonth = (amount: number) => {
    setMonthAnchor((value) => {
      const next = addMonths(value, amount);
      setSelectedDay(next.slice(0, 7) === today.slice(0, 7) ? today : next);
      return next;
    });
  };

  const handleCreated = useCallback(
    (event: LiveCalendarEvent) => {
      setNotice(`Event "${event.title}" saved for ${event.eventDate}.`);
      if (event.eventDate < from || event.eventDate > to) {
        setMonthAnchor(startOfMonth(event.eventDate));
        setSelectedDay(event.eventDate);
        return;
      }
      setSelectedDay(event.eventDate);
      setItems((current) => sortCalendarEvents([...current.filter((item) => item.id !== event.id), event]));
    },
    [from, to],
  );

  const handleDelete = async (event: LiveCalendarEvent) => {
    setDeletingId(event.id);
    setError(null);
    try {
      await deleteLiveCalendarEvent(email, event.id);
      setItems((current) => current.filter((item) => item.id !== event.id));
      setNotice(`Event "${event.title}" deleted.`);
    } catch {
      setError("Event could not be deleted right now.");
    } finally {
      setDeletingId(null);
    }
  };

  const monthDays = Array.from({ length: daysInMonth(monthAnchor) }, (_, index) => addDays(monthAnchor, index));
  const leadingBlanks = Array.from({ length: mondayFirstOffset(monthAnchor) }, (_, index) => `blank-${index}`);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, LiveCalendarEvent[]>();
    for (const item of items) {
      const list = map.get(item.eventDate) ?? [];
      list.push(item);
      map.set(item.eventDate, list);
    }
    return map;
  }, [items]);
  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  return (
    <div className="space-y-6" data-testid="live-calendar">
      <SectionHeader
        eyebrow="Team calendar · Asia/Dubai"
        title="Calendar"
        description="Shared events for viewings, staging, snagging and property visits. Everything here is saved to the CRM and stays after refresh."
        action={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New event
          </Button>
        }
      />
      {notice && (
        <p role="status" className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          {notice}
        </p>
      )}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => setReloadToken((value) => value + 1)}>
            Retry
          </Button>
        </div>
      )}
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Today · <span className="text-foreground" data-testid="live-calendar-today">{longDayLabel(today)}</span>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous month" onClick={() => goToMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground" data-testid="live-calendar-month">
              {monthLabel(monthAnchor)}
            </span>
            <Button size="sm" variant="ghost" aria-label="Next month" onClick={() => goToMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {KIND_ORDER.map((kind) => (
            <span key={kind} className="flex items-center gap-1">
              <i className={`inline-block h-2 w-2 rounded-full border ${kindStyles[kind]}`} />
              {KIND_LABELS[kind]}
            </span>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/80 bg-card/80 p-4">
          {loading && items.length === 0 ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[640px] grid-cols-7 gap-2" role="grid" aria-label={monthLabel(monthAnchor)}>
                {DAY_LABELS.map((day) => (
                  <p key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </p>
                ))}
                {leadingBlanks.map((blank) => <div key={blank} aria-hidden="true" className="min-h-24" />)}
                {monthDays.map((date) => {
                  const dayEvents = eventsByDay.get(date) ?? [];
                  const isToday = date === today;
                  const isSelected = date === selectedDay;
                  return (
                    <button
                      key={date}
                      type="button"
                      data-testid={`live-calendar-day-${date}`}
                      data-today={isToday || undefined}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedDay(date)}
                      className={`min-h-24 rounded-xl border p-2 text-left transition-colors ${isToday ? "border-primary/60 bg-primary/5" : "border-border/70 bg-background/20"} ${isSelected ? "ring-2 ring-primary/50" : "hover:bg-secondary/40"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          {Number(date.slice(8, 10))}
                        </span>
                        {dayEvents.length > 0 && <CalendarDays className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span key={event.id} className={`block truncate rounded-md border px-2 py-1 text-[10px] ${kindStyles[event.kind]}`}>
                            {event.title}
                          </span>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
        <Card className="border-border/80 bg-card/80 p-4" data-testid="live-calendar-day-panel">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected day</p>
              <h3 className="text-sm font-semibold text-foreground">{longDayLabel(selectedDay)}</h3>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {selectedEvents.length === 0 ? (
              <EmptyState title="No events" description="Nothing scheduled for this day yet." />
            ) : (
              selectedEvents.map((event) => (
                <div key={event.id} data-testid={`live-calendar-event-${event.id}`} className={`rounded-lg border p-3 ${kindStyles[event.kind]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] opacity-80">
                        <Clock3 className="h-3 w-3" /> {timeLabel(event)} · {KIND_LABELS[event.kind]}
                      </p>
                      {event.description && <p className="mt-1 text-xs opacity-80">{event.description}</p>}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 flex-shrink-0"
                      aria-label={`Delete ${event.title}`}
                      disabled={deletingId === event.id}
                      onClick={() => void handleDelete(event)}
                    >
                      {deletingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      <CreateEventDialog
        email={email}
        open={createOpen}
        initialDate={selectedDay}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
};
