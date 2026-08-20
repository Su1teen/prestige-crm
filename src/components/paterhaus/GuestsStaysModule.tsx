import { useMemo, useState } from "react";
import { ExternalLink, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { formatAED } from "@/data/paterhaus";
import type { Guest, Stay } from "@/types/paterhaus";
import { EmptyState, SectionHeader, StatusPill } from "./shared";

const lifecycleStates: Stay["lifecycle"][] = [
  "Inquiry",
  "Confirmed",
  "Pre-arrival",
  "Checked in",
  "In stay",
  "Check-out due",
  "Checked out",
  "Incident",
];
const lifecycleValues: string[] = lifecycleStates;
const isLifecycle = (value: string): value is Stay["lifecycle"] => lifecycleValues.includes(value);

const StayDetail = ({
  stay,
  open,
  onOpenChange,
  onPropertySelect,
}: {
  stay: Stay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertySelect?: (propertyId: string) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  if (!stay) return null;
  const guest = workspace.guests.find((item) => item.id === stay.guestId);
  const property = workspace.properties.find((item) => item.id === stay.propertyId);
  const conversations = workspace.conversations.filter((conversation) => conversation.stayId === stay.id);
  const tasks = workspace.tasks.filter((task) => task.stayId === stay.id);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-2xl">
        <SheetHeader>
          <p className="text-xs uppercase tracking-[0.16em] text-primary">{stay.reservationId}</p>
          <SheetTitle>{guest?.name ?? "Guest stay"}</SheetTitle>
          <SheetDescription>
            {property?.name} · {stay.checkIn} to {stay.checkOut} · {stay.nights} nights
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Card className="border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill status={stay.lifecycle} />
              <StatusPill status={stay.checkInStatus} />
              <StatusPill status={stay.paymentStatus} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Guest</span>
                <span className="text-foreground">{guest?.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Property</span>
                <button
                  type="button"
                  className="text-left text-primary hover:underline"
                  onClick={() => property && onPropertySelect?.(property.id)}
                >
                  {property?.name}
                </button>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Booking source</span>
                <span className="text-foreground">{stay.source}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Booking value</span>
                <span className="text-foreground">{formatAED(stay.bookingValue)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Guest count</span>
                <span className="text-foreground">{stay.guestCount}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Check-out status</span>
                <span className="text-foreground">{stay.checkOutStatus}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">ID verification</span>
                <span className="text-foreground">{stay.idVerificationStatus}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Deposit / payment</span>
                <span className="text-foreground">{stay.paymentStatus}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">Arrival instructions</span>
                <span className="text-foreground">{stay.arrivalInstructionsStatus}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="block text-xs">House rules</span>
                <span className="text-foreground">{stay.houseRulesAcknowledged ? "Acknowledged" : "Pending"}</span>
              </p>
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Requests and incidents</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {stay.incidentCount > 0
                ? `${stay.incidentCount} open incident linked to this stay.`
                : "No open incidents recorded."}
            </p>
            <div className="mt-3 space-y-2">
              {conversations.map((conversation) => (
                <p key={conversation.id} className="text-sm text-muted-foreground">
                  Conversation · <span className="text-foreground">{conversation.subject}</span> · {conversation.status}
                </p>
              ))}
              {conversations.length === 0 && <p className="text-sm text-muted-foreground">No linked conversations.</p>}
            </div>
          </Card>
          <Card className="border-border bg-card p-4">
            <h3 className="font-medium text-foreground">Timeline and linked tasks</h3>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">
                {stay.checkIn} · Reservation created and arrival workflow opened.
              </p>
              <p className="text-sm text-muted-foreground">
                {stay.checkIn} · ID verification {stay.idVerificationStatus.toLowerCase()}.
              </p>
              <p className="text-sm text-muted-foreground">
                {stay.checkOut} · Check-out {stay.checkOutStatus.toLowerCase()}.
              </p>
              {tasks.map((task) => (
                <p key={task.id} className="text-sm text-muted-foreground">
                  Task · <span className="text-foreground">{task.title}</span> · {task.status}
                </p>
              ))}
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const GuestsStaysModule = ({ onPropertySelect }: { onPropertySelect?: (propertyId: string) => void }) => {
  const workspace = usePaterhausWorkspace();
  const [query, setQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<Stay["lifecycle"] | "All">("All");
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const guests = useMemo(() => {
    const normalized = query.toLowerCase();
    return workspace.guests.filter((guest) => {
      const stays = workspace.stays.filter((stay) => stay.guestId === guest.id);
      const currentStay =
        stays.find((stay) => stay.lifecycle === "In stay" || stay.lifecycle === "Checked in") ?? stays[0];
      const property = currentStay
        ? workspace.properties.find((item) => item.id === currentStay.propertyId)
        : undefined;
      const matchesText = `${guest.name} ${guest.nationality} ${property?.name ?? ""}`
        .toLowerCase()
        .includes(normalized);
      const matchesLifecycle = lifecycleFilter === "All" || stays.some((stay) => stay.lifecycle === lifecycleFilter);
      return matchesText && matchesLifecycle;
    });
  }, [lifecycleFilter, query, workspace.guests, workspace.properties, workspace.stays]);
  const getStay = (guest: Guest): Stay | undefined =>
    workspace.stays.find((stay) => stay.guestId === guest.id && stay.lifecycle !== "Checked out") ??
    workspace.stays.find((stay) => stay.guestId === guest.id);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Guest lifecycle and reservations"
        title="Guests & Stays"
        description="Track fictional guest records, operational readiness, incidents and linked stay work across the portfolio."
      />
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guest, nationality or property"
              className="pl-9"
            />
          </div>
          <select
            aria-label="Guest lifecycle filter"
            value={lifecycleFilter}
            onChange={(event) => {
              if (event.target.value === "All" || isLifecycle(event.target.value))
                setLifecycleFilter(event.target.value);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option>All</option>
            {lifecycleStates.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </div>
      </Card>
      {guests.length === 0 ? (
        <EmptyState title="No guest records found" description="Adjust the guest search or lifecycle filter." />
      ) : (
        <Card className="overflow-hidden border-border/80 bg-card/80">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Nationality</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Contact channel</th>
                  <th className="px-4 py-3">Current / upcoming stay</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Check-out</th>
                  <th className="px-4 py-3">Guest status</th>
                  <th className="px-4 py-3">Requests / incidents</th>
                  <th className="px-4 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const stay = getStay(guest);
                  const property = stay ? workspace.properties.find((item) => item.id === stay.propertyId) : undefined;
                  const incidents =
                    workspace.conversations.filter((conversation) => conversation.stayId === stay?.id).length +
                    (stay?.incidentCount ?? 0);
                  return (
                    <tr
                      key={guest.id}
                      className="cursor-pointer border-b border-border/60 hover:bg-secondary/30"
                      onClick={() => stay && setSelectedStay(stay)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{guest.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.nationality}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={guest.verificationStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{guest.preferredChannel}</td>
                      <td className="px-4 py-3">
                        {stay ? (
                          <button
                            type="button"
                            className="text-left text-primary hover:underline"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedStay(stay);
                            }}
                          >
                            {stay.reservationId}
                          </button>
                        ) : (
                          "No stay"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{property?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{stay?.checkIn ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{stay?.checkOut ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={stay?.lifecycle ?? "Inquiry"} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{incidents}</td>
                      <td className="px-4 py-3">
                        {guest.riskFlag ? (
                          <StatusPill status={guest.riskFlag} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Card className="border-border/80 bg-card/60 p-4">
        <div className="flex flex-wrap gap-2">
          {lifecycleStates.map((state) => (
            <div key={state} className="rounded-lg border border-border/70 px-3 py-2 text-xs text-muted-foreground">
              {state} · {workspace.stays.filter((stay) => stay.lifecycle === state).length}
            </div>
          ))}
        </div>
      </Card>
      <StayDetail
        stay={selectedStay}
        open={selectedStay !== null}
        onOpenChange={(open) => !open && setSelectedStay(null)}
        onPropertySelect={onPropertySelect}
      />
    </div>
  );
};
