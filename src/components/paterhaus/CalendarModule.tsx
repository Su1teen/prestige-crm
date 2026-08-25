import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PATERHAUS_TODAY } from "@/data/paterhaus";
import type { Task } from "@/types/paterhaus";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

type CalendarView = "month" | "week";
type CalendarEventKind = "occupied" | "blocked" | "operation" | "risk" | "booking";

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  detail: string;
  kind: CalendarEventKind;
  propertyId: string | null;
  sourceId: string;
}

const kindStyles: Record<CalendarEventKind, string> = {
  occupied: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  blocked: "border-slate-500/40 bg-slate-500/10 text-slate-200",
  operation: "border-primary/30 bg-primary/10 text-primary",
  risk: "border-red-500/30 bg-red-500/10 text-red-100",
  booking: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const parseDate = (value: string): Date => new Date(`${value}T00:00:00Z`);

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (value: string, amount: number): string => {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
};

const addMonths = (value: string, amount: number): string => {
  const date = parseDate(value);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return formatDate(date);
};

const monthLabel = (value: string): string =>
  parseDate(value).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

const daysInMonth = (value: string): number => {
  const date = parseDate(value);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.getUTCDate();
};

const mondayFirstOffset = (value: string): number => {
  const weekday = parseDate(value).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
};

const EventDetail = ({
  event,
  open,
  onOpenChange,
  onPropertySelect,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertySelect?: (propertyId: string) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  if (!event) return null;
  const property = event.propertyId ? workspace.properties.find((item) => item.id === event.propertyId) : undefined;
  const task = workspace.tasks.find((item) => item.id === event.sourceId);
  const stay = workspace.stays.find((item) => item.id === event.sourceId);
  const compliance = workspace.compliance.find((item) => item.id === event.sourceId);
  const booking = workspace.bookings.find((item) => item.id === event.sourceId);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="dark border-border bg-background">
        <SheetHeader>
          <StatusPill status={event.kind} />
          <SheetTitle>{event.title}</SheetTitle>
          <SheetDescription>{event.detail}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3 text-sm">
          <p className="text-muted-foreground">
            {t("calendar.scheduledFor", { date: event.date, time: event.time })}
          </p>
          {property && (
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => onPropertySelect?.(property.id)}
            >
              {t("operations.property")} · {property.name}
            </button>
          )}
          {task && (
            <p className="text-muted-foreground">
              {t("operations.task")} · <span className="text-foreground">{task.title}</span>
            </p>
          )}
          {stay && (
            <p className="text-muted-foreground">
              {t("calendar.reservation")} · <span className="text-foreground">{stay.reservationId}</span>
            </p>
          )}
          {compliance && (
            <p className="text-muted-foreground">
              {t("operations.compliance")} · <span className="text-foreground">{compliance.title}</span>
            </p>
          )}
          {booking && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-xs font-medium text-indigo-200">{t("calendar.leadBooking")}</p>
              <p className="mt-1 text-sm text-foreground">{booking.leadName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {booking.type.replace(/_/g, " ")} · {booking.status}
              </p>
              {booking.area && <p className="mt-1 text-xs text-muted-foreground">{booking.area}</p>}
              {booking.notes && <p className="mt-1 text-xs text-muted-foreground">{booking.notes}</p>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const eventForTask = (task: Task): CalendarEvent => {
  const isRisk =
    task.status === "Blocked" ||
    task.status === "Waiting on owner approval" ||
    task.status === "Waiting on vendor" ||
    task.dueAt.slice(0, 10) < PATERHAUS_TODAY;
  const isBlock = task.category === "Owner request" || task.category === "Maintenance";
  return {
    id: task.id,
    date: task.dueAt.slice(0, 10),
    time: task.dueAt.slice(11, 16),
    title: task.title,
    detail: `${task.category} · ${task.status}`,
    kind: isRisk ? "risk" : isBlock ? "blocked" : "operation",
    propertyId: task.propertyId,
    sourceId: task.id,
  };
};

export const CalendarModule = ({ onPropertySelect }: { onPropertySelect?: (propertyId: string) => void }) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [view, setView] = useState<CalendarView>("month");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [communityFilter, setCommunityFilter] = useState("All");
  const [taskTypeFilter, setTaskTypeFilter] = useState("All");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [monthAnchor, setMonthAnchor] = useState(`${PATERHAUS_TODAY.slice(0, 7)}-01`);
  const [weekAnchor, setWeekAnchor] = useState("2025-08-18");
  const communities = Array.from(new Set(workspace.properties.map((property) => property.community)));
  const taskTypes = Array.from(new Set(workspace.tasks.map((task) => task.category)));
  const events = useMemo<CalendarEvent[]>(() => {
    const stayEvents = workspace.stays.flatMap((stay) => {
      const property = workspace.properties.find((item) => item.id === stay.propertyId);
      const records: CalendarEvent[] = [];
      for (let date = stay.checkIn; date < stay.checkOut; date = addDays(date, 1)) {
        records.push({
          id: `${stay.id}-occupied-${date}`,
          date,
          time: date === stay.checkIn ? (stay.checkInAt?.slice(11, 16) ?? "—") : "—",
          title: `${stay.reservationId} · occupied`,
          detail: `${property?.name ?? "Property"} · night ${date}`,
          kind: "occupied",
          propertyId: stay.propertyId,
          sourceId: stay.id,
        });
      }
      if (stay.checkOut) {
        records.push({
          id: `${stay.id}-checkout`,
          date: stay.checkOut,
          time: stay.checkOutAt?.slice(11, 16) ?? "—",
          title: `${stay.reservationId} · check-out`,
          detail: `${property?.name ?? "Property"} · departure hand-off`,
          kind: "operation",
          propertyId: stay.propertyId,
          sourceId: stay.id,
        });
      }
      return records;
    });
    const taskEvents = workspace.tasks.map(eventForTask);
    const complianceEvents = workspace.compliance.map(
      (item) =>
        ({
          id: item.id,
          date: item.expiryDate,
          time: item.dueAt.slice(11, 16),
          title: item.title,
          detail: `${item.type} · ${item.status}`,
          kind: item.status === "Complete" ? "operation" : "risk",
          propertyId: item.propertyId,
          sourceId: item.id,
        }) satisfies CalendarEvent,
    );
    // P1.2 — Booking events from lead bookings
    const bookingEvents: CalendarEvent[] = workspace.bookings
      .filter((booking) => booking.selectedSlot && booking.status !== "cancelled")
      .map((booking) => {
        const slot = booking.selectedSlot!;
        return {
          id: `booking-${booking.id}`,
          date: slot.slice(0, 10),
          time: slot.slice(11, 16),
          title: `${booking.leadName} — ${booking.type.replace(/_/g, " ")}`,
          detail: `${booking.area ?? ""} · ${booking.status}${booking.notes ? ` · ${booking.notes}` : ""}`,
          kind: "booking" as const,
          propertyId: null,
          sourceId: booking.id,
        };
      });
    return [...stayEvents, ...taskEvents, ...complianceEvents, ...bookingEvents];
  }, [workspace.bookings, workspace.compliance, workspace.properties, workspace.stays, workspace.tasks]);
  const filteredEvents = events.filter((event) => {
    const property = event.propertyId ? workspace.properties.find((item) => item.id === event.propertyId) : undefined;
    const task = workspace.tasks.find((item) => item.id === event.sourceId);
    return (
      (propertyFilter === "All" || event.propertyId === propertyFilter) &&
      (communityFilter === "All" || property?.community === communityFilter) &&
      (taskTypeFilter === "All" || task?.category === taskTypeFilter)
    );
  });
  const monthDays = Array.from({ length: daysInMonth(monthAnchor) }, (_, index) => addDays(monthAnchor, index));
  const monthLeadingBlanks = Array.from({ length: mondayFirstOffset(monthAnchor) }, (_, index) => `blank-${index}`);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index));
  const visibleDays = view === "month" ? monthDays : weekDays;
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("calendar.eyebrow")}
        title={t("calendar.title")}
        description={t("calendar.description")}
        action={
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <Button variant={view === "month" ? "secondary" : "ghost"} size="sm" onClick={() => setView("month")}>
              {t("calendar.month")}
            </Button>
            <Button variant={view === "week" ? "secondary" : "ghost"} size="sm" onClick={() => setView("week")}>
              {t("calendar.week")}
            </Button>
          </div>
        }
      />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap gap-2">
          <select
            aria-label={t("calendar.propertyFilter")}
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("calendar.allProperties")}</option>
            {workspace.properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t("calendar.communityFilter")}
            value={communityFilter}
            onChange={(event) => setCommunityFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("calendar.allCommunities")}</option>
            {communities.map((community) => (
              <option key={community}>{community}</option>
            ))}
          </select>
          <select
            aria-label={t("calendar.taskTypeFilter")}
            value={taskTypeFilter}
            onChange={(event) => setTaskTypeFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("calendar.allTaskTypes")}</option>
            {taskTypes.map((taskType) => (
              <option key={taskType}>{taskType}</option>
            ))}
          </select>
          {view === "month" ? (
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("calendar.prevMonth")}
                onClick={() => setMonthAnchor((value) => addMonths(value, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{monthLabel(monthAnchor)}</span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("calendar.nextMonth")}
                onClick={() => setMonthAnchor((value) => addMonths(value, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("calendar.prevWeek")}
                onClick={() => setWeekAnchor((value) => addDays(value, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs text-muted-foreground">{t("calendar.weekOf", { date: weekDays[0] })}</span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t("calendar.nextWeek")}
                onClick={() => setWeekAnchor((value) => addDays(value, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-400" />
            {t("calendar.occupied")}
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-400" />
            {t("calendar.blocked")}
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />
            {t("calendar.operational")}
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
            {t("calendar.risks")}
          </span>
          <span>
            <i className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-400" />
            {t("calendar.bookings")}
          </span>
        </div>
      </Card>
      {filteredEvents.length === 0 ? (
        <EmptyState
          title={t("calendar.noEvents")}
          description={t("calendar.noEventsDescription")}
        />
      ) : (
        <Card className="border-border/80 bg-card/80 p-4">
          <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[700px] grid-cols-7 gap-2">
            {view === "month" &&
              dayLabels.map((day) => (
                <p key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </p>
              ))}
            {view === "month" &&
              monthLeadingBlanks.map((blank) => <div key={blank} aria-hidden="true" className="min-h-28" />)}
            {visibleDays.map((date) => {
              const dateEvents = filteredEvents.filter((event) => event.date === date);
              const dayNumber = Number(date.slice(8, 10));
              return (
                <div
                  key={date}
                  className={`min-h-28 rounded-xl border p-2 ${date === PATERHAUS_TODAY ? "border-primary/60 bg-primary/5" : "border-border/70 bg-background/20"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {view === "month" ? dayNumber : date.slice(5)}
                    </span>
                    {dateEvents.length > 0 && <CalendarDays className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="mt-2 space-y-1">
                    {dateEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelected(event)}
                        className={`w-full rounded-md border px-2 py-1 text-left text-[10px] ${kindStyles[event.kind]}`}
                      >
                        <span className="block truncate">{event.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 opacity-70">
                          <Clock3 className="h-2.5 w-2.5" />
                          {event.time}
                        </span>
                      </button>
                    ))}
                    {dateEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{dateEvents.length - 3} {t("calendar.more")}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </Card>
      )}
      <EventDetail
        event={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onPropertySelect={onPropertySelect}
      />
    </div>
  );
};
