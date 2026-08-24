import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Grid2X2,
  List,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { formatAED, formatPaterhausDateTime, PATERHAUS_TODAY } from "@/data/paterhaus";
import type { Property, Snag } from "@/types/paterhaus";
import { SectionHeader, StatusPill, EmptyState } from "./shared";
import { OpsCopilot } from "./OpsCopilot";

type ViewMode = "table" | "cards";
type SortKey = "revenue" | "occupancy" | "owner" | "checkIn" | "health" | "activity";
type FilterKey =
  "type" | "community" | "owner" | "status" | "listing" | "readiness" | "occupancy" | "compliance" | "issue";

interface FilterState {
  type: string;
  community: string;
  owner: string;
  status: string;
  listing: string;
  readiness: string;
  occupancy: string;
  compliance: string;
  issue: string;
}

interface FilterDescriptor {
  key: FilterKey;
  label: string;
  options: Array<{ value: string; label: string }>;
}

const filterDefaults: FilterState = {
  type: "All",
  community: "All",
  owner: "All",
  status: "All",
  listing: "All",
  readiness: "All",
  occupancy: "All",
  compliance: "All",
  issue: "All",
};

const isSortKey = (value: string): value is SortKey => Object.keys(sortLabels).includes(value);
const riskLevels = ["Low", "Medium", "High", "Critical"];
const isRiskLevel = (value: string): value is Snag["severity"] => riskLevels.includes(value);

const sortLabels: Record<SortKey, string> = {
  revenue: "Revenue",
  occupancy: "Occupancy",
  owner: "Owner",
  checkIn: "Upcoming check-in",
  health: "Health score",
  activity: "Last operational activity",
};

const PropertyDetail = ({
  property,
  open,
  onOpenChange,
}: {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const [showSnagDialog, setShowSnagDialog] = useState(false);
  const [snagArea, setSnagArea] = useState("");
  const [snagDescription, setSnagDescription] = useState("");
  const [snagSeverity, setSnagSeverity] = useState<Snag["severity"]>("Medium");
  const [snagCost, setSnagCost] = useState("250");
  const owner = property ? workspace.owners.find((item) => item.id === property.ownerId) : undefined;
  const propertyStays = property ? workspace.stays.filter((stay) => stay.propertyId === property.id) : [];
  const propertyTasks = property ? workspace.tasks.filter((task) => task.propertyId === property.id) : [];
  const propertySnags = property ? workspace.snags.filter((snag) => snag.propertyId === property.id) : [];
  const propertyMaintenance = property ? workspace.maintenance.filter((issue) => issue.propertyId === property.id) : [];
  const propertyStatements = property
    ? workspace.statements.filter((statement) => statement.propertyId === property.id)
    : [];
  const propertyActivity = property ? workspace.activity.filter((event) => event.propertyId === property.id) : [];

  const submitSnag = () => {
    if (!property || !snagArea.trim() || !snagDescription.trim()) return;
    workspace.createSnag({
      propertyId: property.id,
      area: snagArea.trim(),
      description: snagDescription.trim(),
      severity: snagSeverity,
      costEstimate: Number(snagCost) || 0,
      deadline: PATERHAUS_TODAY,
    });
    setShowSnagDialog(false);
    setSnagArea("");
    setSnagDescription("");
    setSnagCost("250");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-3xl">
          {property && (
            <>
              <SheetHeader>
                <div className={`mb-2 h-28 rounded-2xl bg-gradient-to-br ${property.imageTone} p-5`}>
                  <div className="flex h-full items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/60">{property.community}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{property.name}</h2>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <StatusPill status={property.status} className="bg-black/20" />
                      <OpsCopilot propertyId={property.id} />
                    </div>
                  </div>
                </div>
                <SheetTitle className="sr-only">{property.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {property.address} · {property.unitIdentifier}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{owner?.name ?? "Unassigned"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Monthly revenue</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{formatAED(property.monthlyRevenue)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{property.occupancyRate}%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Health score</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{property.healthScore}/100</p>
                </div>
              </div>
              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary/70 p-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="stays">Stays</TabsTrigger>
                  <TabsTrigger value="operations">Operations</TabsTrigger>
                  <TabsTrigger value="snagging">Snagging</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="listings">Listings</TabsTrigger>
                  <TabsTrigger value="finance">Finance</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <Card className="border-border bg-card p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Property profile</p>
                        <p className="mt-2 text-sm leading-6 text-foreground">{property.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {property.tags.map((tag) => (
                            <StatusPill key={tag} status={tag} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Type</span>
                          <span className="text-foreground">
                            {property.type} · {property.bedrooms} bed · {property.bathrooms} bath
                          </span>
                        </p>
                        <p className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className="text-foreground">{property.capacity} guests</span>
                        </p>
                        <p className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Management</span>
                          <span className="text-foreground">{property.managementStatus}</span>
                        </p>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">DTCM licence</span>
                          <StatusPill status={property.dtcmStatus} />
                        </div>
                        <p className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Expiry</span>
                          <span className="text-foreground">{property.dtcmExpiry}</span>
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card className="border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">Readiness score</h3>
                      <span className="text-lg font-semibold text-primary">{property.healthScore}%</span>
                    </div>
                    <Progress value={property.healthScore} className="mt-3 h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Readiness: {property.readiness} · {property.openIssueCount} open operational issue
                      {property.openIssueCount === 1 ? "" : "s"}
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="calendar">
                  <Card className="border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-foreground">August 2025 property calendar</h3>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                        <span key={day} className="p-2 text-muted-foreground">
                          {day}
                        </span>
                      ))}
                      {Array.from({ length: 31 }, (_, index) => {
                        const day = index + 1;
                        const date = `2025-08-${String(day).padStart(2, "0")}`;
                        const occupied = propertyStays.some((stay) => stay.checkIn <= date && stay.checkOut > date);
                        const event = date === PATERHAUS_TODAY && property.status === "Turnover in progress";
                        return (
                          <div
                            key={date}
                            className={`rounded-lg border p-2 ${occupied ? "border-blue-500/30 bg-blue-500/10 text-blue-200" : event ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-border/60 text-muted-foreground"}`}
                          >
                            {day}
                            <span className="mt-1 block text-[9px]">
                              {occupied ? "Stay" : event ? "Turnover" : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        <i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-400" />
                        Occupied dates
                      </span>
                      <span>
                        <i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                        Operational event
                      </span>
                    </div>
                  </Card>
                </TabsContent>
                <TabsContent value="stays" className="space-y-2">
                  {propertyStays.length ? (
                    propertyStays.map((stay) => {
                      const guest = workspace.guests.find((item) => item.id === stay.guestId);
                      return (
                        <Card key={stay.id} className="border-border bg-card p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {stay.reservationId} · {guest?.name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {stay.checkIn} → {stay.checkOut} · {stay.guestCount} guests · {stay.source}
                              </p>
                            </div>
                            <StatusPill status={stay.lifecycle} />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatAED(stay.bookingValue)} · ID {stay.idVerificationStatus} · Payment{" "}
                            {stay.paymentStatus}
                          </p>
                        </Card>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="No stays recorded"
                      description="This property has no linked reservations in the demo period."
                    />
                  )}
                </TabsContent>
                <TabsContent value="operations" className="space-y-2">
                  {propertyTasks.length ? (
                    propertyTasks.map((task) => (
                      <Card key={task.id} className="border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {task.category} · Due {formatPaterhausDateTime(task.dueAt)}
                            </p>
                          </div>
                          <StatusPill status={task.status} />
                        </div>
                        <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                          <span>{task.assignee ?? "Unassigned"}</span>
                          {task.vendorId && (
                            <span>· {workspace.vendors.find((vendor) => vendor.id === task.vendorId)?.name}</span>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <EmptyState title="No open operations" description="The property has no linked tasks right now." />
                  )}
                </TabsContent>
                <TabsContent value="snagging" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {propertySnags.length} snag record{propertySnags.length === 1 ? "" : "s"}
                    </p>
                    <Button size="sm" onClick={() => setShowSnagDialog(true)}>
                      <ClipboardCheck className="h-4 w-4" />
                      Create Snag Report
                    </Button>
                  </div>
                  {propertySnags.length ? (
                    propertySnags.map((snag) => (
                      <Card key={snag.id} className="border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {snag.id} · {snag.area}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{snag.description}</p>
                          </div>
                          <StatusPill status={snag.severity} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>Cost estimate {formatAED(snag.costEstimate)}</span>
                          <span>Deadline {snag.deadline}</span>
                          <StatusPill status={snag.status} />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      title="No snag reports"
                      description="Create an inspection record when a property issue is found."
                    />
                  )}
                </TabsContent>
                <TabsContent value="maintenance" className="space-y-2">
                  {propertyMaintenance.map((issue) => (
                    <Card key={issue.id} className="border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{issue.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {issue.asset} · SLA {issue.slaHours}h
                          </p>
                        </div>
                        <StatusPill status={issue.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatAED(issue.cost)}</span>
                        <span>
                          {issue.vendorId
                            ? workspace.vendors.find((vendor) => vendor.id === issue.vendorId)?.name
                            : "Vendor unassigned"}
                        </span>
                        {(issue.ownerApprovalRequired || issue.cost >= workspace.settings.expenseApprovalThreshold) && (
                          <StatusPill status="Owner approval" />
                        )}
                      </div>
                    </Card>
                  ))}
                </TabsContent>
                <TabsContent value="listings">
                  <Card className="border-border bg-card p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {["Airbnb", "Booking.com", "Expedia", "Direct channel"].map((channel) => (
                        <div key={channel} className="rounded-xl border border-border/70 p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{channel}</p>
                            <StatusPill status={property.listingStatus} />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {property.listingStatus === "Live"
                              ? "Content 94% complete · Last sync demo data"
                              : "Content and photography workflow incomplete"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Channel cards represent local demo data. No OTA API connectivity is claimed.
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="finance" className="space-y-2">
                  {propertyStatements.length ? (
                    propertyStatements.map((statement) => (
                      <Card key={statement.id} className="border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{statement.period} owner statement</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Gross {formatAED(statement.grossRevenue)} · Fees{" "}
                              {formatAED(
                                statement.channelFees +
                                  statement.cleaningLaundry +
                                  statement.maintenance +
                                  statement.managementFee,
                              )}
                            </p>
                          </div>
                          <StatusPill status={statement.status} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-primary">
                          Net owner payout {formatAED(statement.netPayout)}
                        </p>
                      </Card>
                    ))
                  ) : (
                    <EmptyState
                      title="No statements yet"
                      description="Create a local draft owner statement from a financial event."
                    />
                  )}
                </TabsContent>
                <TabsContent value="documents">
                  <Card className="border-border bg-card p-4">
                    <div className="space-y-3">
                      {[
                        "Management agreement",
                        "Owner ID and ownership documents",
                        "DTCM licence document",
                        "Inventory and inspection report",
                        "Invoices and payout statement",
                      ].map((document) => (
                        <div key={document} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="flex-1 text-sm text-foreground">{document}</span>
                          <StatusPill
                            status={
                              document.includes("DTCM")
                                ? property.dtcmStatus
                                : document.includes("Owner") && property.dtcmStatus === "Missing documents"
                                  ? "Missing documents"
                                  : "Complete"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
                <TabsContent value="activity">
                  <div className="space-y-2">
                    {propertyActivity.map((event) => (
                      <Card key={event.id} className="border-border bg-card p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm text-foreground">{event.text}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {event.actor} · {formatPaterhausDateTime(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
      <Dialog open={showSnagDialog} onOpenChange={setShowSnagDialog}>
        <DialogContent className="dark border-border bg-background">
          <DialogHeader>
            <DialogTitle>Create Snag Report</DialogTitle>
            <DialogDescription>
              Record a property inspection issue. The new snag will appear across the workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="snag-area" className="text-sm font-medium text-foreground">
                Area
              </label>
              <Input
                id="snag-area"
                value={snagArea}
                onChange={(event) => setSnagArea(event.target.value)}
                placeholder="e.g. Guest bathroom"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="snag-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                id="snag-description"
                value={snagDescription}
                onChange={(event) => setSnagDescription(event.target.value)}
                placeholder="Describe the issue and the expected resolution."
                className="mt-1"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="snag-severity" className="text-sm font-medium text-foreground">
                  Severity
                </label>
                <select
                  id="snag-severity"
                  value={snagSeverity}
                  onChange={(event) => {
                    if (isRiskLevel(event.target.value)) setSnagSeverity(event.target.value);
                  }}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="snag-cost" className="text-sm font-medium text-foreground">
                  Cost estimate (AED)
                </label>
                <Input
                  id="snag-cost"
                  type="number"
                  min="0"
                  value={snagCost}
                  onChange={(event) => setSnagCost(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitSnag} disabled={!snagArea.trim() || !snagDescription.trim()}>
              Create report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const PropertiesModule = ({ initialPropertyId }: { initialPropertyId?: string }) => {
  const workspace = usePaterhausWorkspace();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState<FilterState>(filterDefaults);

  useEffect(() => {
    if (initialPropertyId) {
      const property = workspace.properties.find((item) => item.id === initialPropertyId);
      if (property) setSelectedProperty(property);
    }
  }, [initialPropertyId, workspace.properties]);

  const communities = Array.from(new Set(workspace.properties.map((property) => property.community)));
  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const ownerName = (property: Property) =>
      workspace.owners.find((owner) => owner.id === property.ownerId)?.name ?? "";
    return workspace.properties
      .filter((property) => {
        const matchesSearch =
          `${property.name} ${property.ownerId} ${ownerName(property)} ${property.community} ${property.unitIdentifier}`
            .toLowerCase()
            .includes(normalizedQuery);
        return (
          matchesSearch &&
          (filters.type === "All" || property.type === filters.type) &&
          (filters.community === "All" || property.community === filters.community) &&
          (filters.owner === "All" || property.ownerId === filters.owner) &&
          (filters.status === "All" || property.status === filters.status) &&
          (filters.listing === "All" || property.listingStatus === filters.listing) &&
          (filters.readiness === "All" || property.readiness === filters.readiness) &&
          (filters.occupancy === "All" || property.occupancy === filters.occupancy) &&
          (filters.compliance === "All" || property.dtcmStatus === filters.compliance) &&
          (filters.issue === "All" ||
            (filters.issue === "Open issues" ? property.openIssueCount > 0 : property.openIssueCount === 0))
        );
      })
      .sort((first, second) => {
        if (sortKey === "owner") return ownerName(first).localeCompare(ownerName(second));
        if (sortKey === "checkIn") return (first.nextCheckIn ?? "9999").localeCompare(second.nextCheckIn ?? "9999");
        if (sortKey === "activity") return second.lastOperationalActivity.localeCompare(first.lastOperationalActivity);
        if (sortKey === "occupancy") return second.occupancyRate - first.occupancyRate;
        if (sortKey === "revenue") return second.monthlyRevenue - first.monthlyRevenue;
        return second.healthScore - first.healthScore;
      });
  }, [workspace.properties, workspace.owners, query, filters, sortKey]);

  const resetFilters = () => {
    setFilters(filterDefaults);
    setQuery("");
  };
  const updateFilter = (key: FilterKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const filterDescriptors: FilterDescriptor[] = [
    {
      key: "type",
      label: "Property type",
      options: ["All", "Apartment", "Villa", "Townhouse", "Penthouse", "Studio"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "community",
      label: "Community / area",
      options: ["All", ...communities].map((value) => ({ value, label: value })),
    },
    {
      key: "owner",
      label: "Owner",
      options: [
        { value: "All", label: "All" },
        ...workspace.owners.map((owner) => ({ value: owner.id, label: owner.name })),
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        "All",
        "Ready",
        "Occupied",
        "Turnover in progress",
        "Maintenance required",
        "Compliance risk",
        "Off market",
      ].map((value) => ({ value, label: value })),
    },
    {
      key: "listing",
      label: "Listing status",
      options: ["All", "Live", "Draft", "Paused", "Not listed"].map((value) => ({ value, label: value })),
    },
    {
      key: "readiness",
      label: "Readiness",
      options: ["All", "Ready", "Staging in progress", "Not ready", "Blocked"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "occupancy",
      label: "Occupancy",
      options: ["All", "Occupied", "Available", "Arriving today", "Departing today", "Blocked"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "compliance",
      label: "Compliance",
      options: ["All", "Complete", "Due soon", "Missing documents", "Expired"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "issue",
      label: "Active issue status",
      options: ["All", "Open issues", "No open issues"].map((value) => ({ value, label: value })),
    },
  ];
  const ownerName = (property: Property) =>
    workspace.owners.find((owner) => owner.id === property.ownerId)?.name ?? "Unassigned";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Portfolio management"
        title="Properties"
        description="Search, filter and open the operational record for every managed Dubai property."
        action={
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <Button
              type="button"
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              aria-label="Card view"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search property, owner, community or unit"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Sort
          </div>
          <select
            aria-label="Sort properties"
            value={sortKey}
            onChange={(event) => {
              if (isSortKey(event.target.value)) setSortKey(event.target.value);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {Object.entries(sortLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {filterDescriptors.map((descriptor) => (
            <div key={descriptor.key}>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{descriptor.label}</label>
              <select
                aria-label={descriptor.label}
                value={filters[descriptor.key]}
                onChange={(event) => updateFilter(descriptor.key, event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
              >
                {descriptor.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {filteredProperties.length} properties shown · Select any row for deep operational detail.
        </p>
      </Card>
      {filteredProperties.length === 0 ? (
        <EmptyState title="No matching properties" description="Try clearing one or more filters." />
      ) : view === "table" ? (
        <Card className="overflow-hidden border-border/80 bg-card/80">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Operational state</th>
                  <th className="px-4 py-3 font-medium">Next movement</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Readiness</th>
                  <th className="px-4 py-3 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    tabIndex={0}
                    onClick={() => setSelectedProperty(property)}
                    onKeyDown={(event) => event.key === "Enter" && setSelectedProperty(property)}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/30 focus-visible:bg-secondary/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-9 w-9 rounded-lg bg-gradient-to-br ${property.imageTone}`} />
                        <span>
                          <span className="block font-medium text-foreground">{property.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {property.community} · {property.type} · {property.unitIdentifier}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ownerName(property)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={property.status} />
                      <span className="mt-1 block text-xs text-muted-foreground">{property.occupancy}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {property.nextCheckIn
                        ? `In ${property.nextCheckIn}`
                        : property.nextCheckOut
                          ? `Out ${property.nextCheckOut}`
                          : "No upcoming stay"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatAED(property.monthlyRevenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={property.healthScore} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{property.healthScore}</span>
                      </div>
                      <StatusPill status={property.listingStatus} className="mt-1" />
                    </td>
                    <td className="px-4 py-3">
                      {property.openIssueCount > 0 ? (
                        <span className="text-amber-300">{property.openIssueCount}</span>
                      ) : (
                        <span className="text-emerald-300">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => setSelectedProperty(property)}
              className="rounded-2xl border border-border/80 bg-card/80 p-4 text-left shadow-card transition-colors hover:border-primary/50"
            >
              <div className={`h-28 rounded-xl bg-gradient-to-br ${property.imageTone} p-3`}>
                <div className="flex h-full items-end justify-between">
                  <span className="text-xs text-white/70">{property.community}</span>
                  <StatusPill status={property.status} className="bg-black/20" />
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{property.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {property.type} · {property.bedrooms} bed · {property.unitIdentifier}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">{property.healthScore}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">
                  Owner<span className="mt-1 block text-foreground">{ownerName(property)}</span>
                </span>
                <span className="text-muted-foreground">
                  Revenue<span className="mt-1 block text-foreground">{formatAED(property.monthlyRevenue)}</span>
                </span>
                <span className="text-muted-foreground">
                  Occupancy
                  <span className="mt-1 block text-foreground">
                    {property.occupancyRate}% · {property.occupancy}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Issues<span className="mt-1 block text-foreground">{property.openIssueCount}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <PropertyDetail
        property={selectedProperty}
        open={Boolean(selectedProperty)}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      />
    </div>
  );
};
