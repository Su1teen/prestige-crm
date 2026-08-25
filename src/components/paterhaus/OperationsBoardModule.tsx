import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  List,
  Search,
  Table2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PATERHAUS_TODAY, formatUSD, formatPaterhausDateTime } from "@/data/paterhaus";
import type { Priority, Task, TaskCategory, TaskStatus } from "@/types/paterhaus";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

const statuses: TaskStatus[] = [
  "Unassigned",
  "Scheduled",
  "In progress",
  "Waiting on vendor",
  "Waiting on owner approval",
  "Completed",
  "Blocked",
];
const categories: TaskCategory[] = [
  "Check-in preparation",
  "Check-out inspection",
  "Housekeeping",
  "Laundry",
  "Staging",
  "Snagging",
  "Maintenance",
  "Guest request",
  "Owner request",
  "Compliance",
  "Listing optimisation",
  "Finance approval",
];
const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];
const timeFilters = ["All", "Today", "Tomorrow", "This Week"] as const;
type TimeFilter = (typeof timeFilters)[number];
type ViewMode = "board" | "table";

const statusValues: string[] = statuses;
const categoryValues: string[] = categories;
const priorityValues: string[] = priorities;
const timeFilterValues: readonly string[] = timeFilters;
const isTaskStatus = (value: string): value is TaskStatus => statusValues.includes(value);
const isTaskCategory = (value: string): value is TaskCategory => categoryValues.includes(value);
const isPriority = (value: string): value is Priority => priorityValues.includes(value);
const isTimeFilter = (value: string): value is TimeFilter => timeFilterValues.includes(value);

const isOverdue = (task: Task): boolean => task.status !== "Completed" && task.dueAt.slice(0, 10) < PATERHAUS_TODAY;
const addDays = (value: string, amount: number): string => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

const matchesTime = (task: Task, filter: TimeFilter): boolean => {
  if (filter === "All") return true;
  const dueDate = task.dueAt.slice(0, 10);
  if (filter === "Today") return dueDate === PATERHAUS_TODAY;
  if (filter === "Tomorrow") return dueDate === addDays(PATERHAUS_TODAY, 1);
  return dueDate >= PATERHAUS_TODAY && dueDate <= addDays(PATERHAUS_TODAY, 6);
};

const TaskDetail = ({
  task,
  open,
  onOpenChange,
  onPropertySelect,
  onStatusChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertySelect?: (propertyId: string) => void;
  onStatusChange: (status: TaskStatus) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  if (!task) return null;
  const property = workspace.properties.find((item) => item.id === task.propertyId);
  const stay = workspace.stays.find((item) => item.id === task.stayId);
  const owner = workspace.owners.find((item) => item.id === task.ownerId);
  const guest = stay ? workspace.guests.find((item) => item.id === stay.guestId) : undefined;
  const vendor = workspace.vendors.find((item) => item.id === task.vendorId);
  const snag = workspace.snags.find((item) => item.id === task.snagId);
  const compliance = workspace.compliance.find((item) => item.id === task.complianceItemId);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-2xl">
        <SheetHeader>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">{task.id}</p>
          <SheetTitle>{task.title}</SheetTitle>
          <SheetDescription>{task.description}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Card className="border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={task.status} />
              <StatusPill status={task.priority} />
              <StatusPill status={task.category} />
              {isOverdue(task) && <StatusPill status="Overdue" />}
            </div>
            <label className="mt-4 block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("operations.updateStatus")}
              <select
                aria-label={t("operations.updateTaskStatus")}
                value={task.status}
                onChange={(event) => {
                  if (isTaskStatus(event.target.value)) onStatusChange(event.target.value);
                }}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("operations.slaDue")}</span>
                <span className="text-foreground">{formatPaterhausDateTime(task.dueAt)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("operations.assignee")}</span>
                <span className="text-foreground">{task.assignee ?? t("operations.unassigned")}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("operations.vendor")}</span>
                <span className="text-foreground">{vendor?.name ?? t("operations.notAssigned")}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">{t("operations.costEstimate")}</span>
                <span className="text-foreground">
                  {task.costEstimate ? formatUSD(task.costEstimate) : t("operations.notEstimated")}
                </span>
              </p>
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">{t("operations.linkedEntities")}</h3>
            <div className="mt-3 space-y-2 text-sm">
              {property && (
                <button
                  type="button"
                  className="block text-left text-primary hover:underline"
                  onClick={() => onPropertySelect?.(property.id)}
                >
                  {t("operations.property")} · {property.name}
                </button>
              )}
              {stay && <p className="text-muted-foreground">{t("operations.stay")} · {stay.reservationId}</p>}
              {guest && <p className="text-muted-foreground">{t("operations.guest")} · {guest.name}</p>}
              {owner && <p className="text-muted-foreground">{t("pipeline.owner")} · {owner.name}</p>}
              {snag && (
                <p className="text-muted-foreground">
                  {t("operations.snag")} · {snag.id} · {snag.area}
                </p>
              )}
              {compliance && <p className="text-muted-foreground">{t("operations.compliance")} · {compliance.title}</p>}
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">{t("operations.activityLog")}</h3>
            <div className="mt-3 space-y-2">
              {(task.activityLog ?? [`Created on ${formatPaterhausDateTime(task.createdAt)}`]).map((event) => (
                <p key={event} className="border-l border-primary/40 pl-3 text-sm text-muted-foreground">
                  {event}
                </p>
              ))}
            </div>
          </Card>
          <Card className="border-dashed border-border bg-card/50 p-4">
            <h3 className="font-medium text-foreground">{t("operations.completionProof")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {task.completionProof ?? t("operations.completionProofPlaceholder")}
            </p>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const OperationsBoardModule = ({
  onPropertySelect,
  initialTaskId,
}: {
  onPropertySelect?: (propertyId: string) => void;
  initialTaskId?: string;
}) => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const [view, setView] = useState<ViewMode>("board");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [communityFilter, setCommunityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "All">("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [overdueFilter, setOverdueFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Task | null>(null);
  useEffect(() => {
    if (initialTaskId) {
      const task = workspace.tasks.find((item) => item.id === initialTaskId);
      if (task) setSelected(task);
    }
  }, [initialTaskId, workspace.tasks]);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return workspace.tasks.filter((task) => {
      const property = workspace.properties.find((item) => item.id === task.propertyId);
      const text = `${task.id} ${task.title} ${task.description} ${property?.name ?? ""}`.toLowerCase();
      return (
        text.includes(normalized) &&
        matchesTime(task, timeFilter) &&
        (propertyFilter === "All" || task.propertyId === propertyFilter) &&
        (communityFilter === "All" || property?.community === communityFilter) &&
        (categoryFilter === "All" || task.category === categoryFilter) &&
        (assigneeFilter === "All" || task.assignee === assigneeFilter) &&
        (vendorFilter === "All" || task.vendorId === vendorFilter) &&
        (priorityFilter === "All" || task.priority === priorityFilter) &&
        (overdueFilter === "All" || (overdueFilter === "Overdue" ? isOverdue(task) : !isOverdue(task))) &&
        (statusFilter === "All" || task.status === statusFilter)
      );
    });
  }, [
    assigneeFilter,
    categoryFilter,
    communityFilter,
    overdueFilter,
    priorityFilter,
    propertyFilter,
    query,
    statusFilter,
    timeFilter,
    vendorFilter,
    workspace.properties,
    workspace.tasks,
  ]);
  const communities = Array.from(new Set(workspace.properties.map((property) => property.community)));
  const assignees = Array.from(new Set(workspace.tasks.map((task) => task.assignee).filter(Boolean)));
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("operations.eyebrow")}
        title={t("operations.title")}
        description={t("operations.description")}
        action={
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <Button variant={view === "board" ? "secondary" : "ghost"} size="sm" onClick={() => setView("board")}>
              <ClipboardList className="h-4 w-4" />
              {t("operations.board")}
            </Button>
            <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}>
              <Table2 className="h-4 w-4" />
              {t("operations.table")}
            </Button>
          </div>
        }
      />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("operations.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <select
            aria-label={t("operations.timeFilter")}
            value={timeFilter}
            onChange={(event) => {
              if (isTimeFilter(event.target.value)) setTimeFilter(event.target.value);
            }}
            className="h-10 min-w-[100px] rounded-md border border-input bg-background px-2 text-xs"
          >
            {timeFilters.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "All" ? t("operations.all") : filter === "Today" ? t("operations.today") : filter === "Tomorrow" ? t("operations.tomorrow") : t("operations.thisWeek")}
              </option>
            ))}
          </select>
          <select
            aria-label={t("operations.propertyFilter")}
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {workspace.properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t("operations.communityFilter")}
            value={communityFilter}
            onChange={(event) => setCommunityFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {communities.map((community) => (
              <option key={community}>{community}</option>
            ))}
          </select>
          <select
            aria-label={t("operations.taskTypeFilter")}
            value={categoryFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isTaskCategory(event.target.value))
                setCategoryFilter(event.target.value);
            }}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            aria-label={t("operations.assigneeFilter")}
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {assignees.map((assignee) => (
              <option key={assignee}>{assignee}</option>
            ))}
          </select>
          <select
            aria-label={t("operations.vendorFilter")}
            value={vendorFilter}
            onChange={(event) => setVendorFilter(event.target.value)}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {workspace.vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t("operations.priorityFilter")}
            value={priorityFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isPriority(event.target.value)) setPriorityFilter(event.target.value);
            }}
            className="h-10 min-w-[100px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {priorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
          <select
            aria-label={t("operations.overdueFilter")}
            value={overdueFilter}
            onChange={(event) => setOverdueFilter(event.target.value)}
            className="h-10 min-w-[100px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            <option value="Overdue">{t("operations.overdue")}</option>
            <option value="On time">{t("operations.onTime")}</option>
          </select>
          <select
            aria-label={t("operations.statusFilter")}
            value={statusFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isTaskStatus(event.target.value)) setStatusFilter(event.target.value);
            }}
            className="h-10 min-w-[120px] rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="All">{t("operations.all")}</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {filtered.length} {t("operations.tasksShown")} · {filtered.filter(isOverdue).length} {t("operations.overdueCount")} · {filtered.filter((task) => task.status !== "Completed" && task.dueAt.slice(0, 10) === PATERHAUS_TODAY).length} {t("operations.dueToday")}
        </p>
      </Card>
      {filtered.length === 0 ? (
        <EmptyState
          title={t("operations.noTasksMatch")}
          description={t("operations.noTasksMatchDescription")}
        />
      ) : view === "table" ? (
        <Card className="overflow-hidden border-border/80 bg-card/80">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("operations.task")}</th>
                  <th className="px-4 py-3">{t("operations.property")}</th>
                  <th className="px-4 py-3">{t("operations.category")}</th>
                  <th className="px-4 py-3">{t("operations.dueSla")}</th>
                  <th className="px-4 py-3">{t("operations.assignee")}</th>
                  <th className="px-4 py-3">{t("operations.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const property = workspace.properties.find((item) => item.id === task.propertyId);
                  return (
                    <tr
                      key={task.id}
                      className="cursor-pointer border-b border-border/60 hover:bg-secondary/30"
                      onClick={() => setSelected(task)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.id}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{property?.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{task.category}</td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{formatPaterhausDateTime(task.dueAt)}</span>
                        {isOverdue(task) && <StatusPill status="Overdue" className="ml-2" />}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{task.assignee ?? t("operations.unassigned")}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={task.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max items-start gap-4">
            {statuses.map((status) => {
              const tasks = filtered.filter((task) => task.status === status);
              return (
                <section key={status} className="w-[300px] min-w-[300px] shrink-0">
                  <Card className="min-h-[120px] border-border/80 bg-card/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{status}</p>
                      <StatusPill status={`${tasks.length}`} />
                    </div>
                    <div className="mt-3 space-y-2">
                      {tasks.map((task) => {
                        const property = workspace.properties.find((item) => item.id === task.propertyId);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => setSelected(task)}
                            className="w-full rounded-xl border border-border/70 bg-background/40 p-3 text-left hover:border-primary/40"
                          >
                            <div className="flex min-w-0 items-start gap-2">
                              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0 break-words whitespace-normal text-sm font-medium leading-snug text-foreground">{task.title}</span>
                            </div>
                            <p className="mt-2 break-words text-xs text-muted-foreground">{property?.name}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <StatusPill status={task.category} />
                              <StatusPill status={task.priority} />
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {formatPaterhausDateTime(task.dueAt)}
                              {isOverdue(task) ? ` · ${t("operations.overdueLabel")}` : ""}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                </section>
              );
            })}
          </div>
        </div>
      )}
      <TaskDetail
        task={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onPropertySelect={onPropertySelect}
        onStatusChange={(status) => {
          if (!selected) return;
          workspace.setTaskStatus(selected.id, status);
          setSelected((current) => (current ? { ...current, status } : current));
        }}
      />
    </div>
  );
};
