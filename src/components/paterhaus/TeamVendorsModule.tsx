import { BriefcaseBusiness, Mail, Phone, Star, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import { SectionHeader, StatusPill } from "./shared";

const internalTeam = [
  { name: "Amelia Hart", role: "Operations Director", focus: "Portfolio escalation and owner reporting" },
  { name: "Priya Nair", role: "Compliance & Onboarding Lead", focus: "DTCM, documents and onboarding" },
  { name: "Omar Rahman", role: "Guest Experience Manager", focus: "Stay readiness and guest incidents" },
  { name: "Leila Haddad", role: "Finance Coordinator", focus: "Statements, approvals and payout controls" },
];

export const TeamVendorsModule = () => {
  const workspace = usePaterhausWorkspace();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="People and partners"
        title="Team & Vendors"
        description="Internal ownership and trusted Dubai service partners with live local task context."
      />
      <Card className="border-border/80 bg-card/80 p-4">
        <div className="flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Internal team</h3>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {internalTeam.map((member) => (
            <div key={member.name} className="rounded-xl border border-border/70 p-4">
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="mt-1 text-xs text-primary">{member.role}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{member.focus}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300">
                <Mail className="h-3 w-3" /> Shared inbox enabled
              </span>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {workspace.vendors.map((vendor) => {
          const activeTasks = workspace.tasks.filter(
            (task) => task.vendorId === vendor.id && task.status !== "Completed",
          );
          const recentWork = workspace.tasks
            .filter((task) => task.vendorId === vendor.id && task.status === "Completed")
            .sort((first, second) => second.dueAt.localeCompare(first.dueAt))
            .slice(0, 3);

          return (
            <Card key={vendor.id} className="border-border/80 bg-card/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-primary">{vendor.category}</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{vendor.name}</h3>
                </div>
                <StatusPill status={vendor.slaRisk} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Services</p>
                  <p className="mt-1 text-sm text-foreground">{vendor.services.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Coverage</p>
                  <p className="mt-1 text-sm text-foreground">{vendor.coverageAreas.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-foreground">
                    <Phone className="h-3 w-3 text-primary" />
                    {vendor.contactPerson} · {vendor.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performance</p>
                  <p className="mt-1 text-sm text-foreground">
                    {vendor.averageResponseHours}h response · {vendor.completionRate}% completion
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost range</p>
                  <p className="mt-1 text-sm text-foreground">{vendor.costRange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Internal quality score</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-foreground">
                    <Star className="h-3 w-3 text-amber-300" />
                    {vendor.qualityScore}/5
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border/70 p-3">
                <p className="text-xs font-medium text-foreground">Active task cross-links · {activeTasks.length}</p>
                {activeTasks.length ? (
                  activeTasks.map((task) => (
                    <p key={task.id} className="mt-2 text-xs text-muted-foreground">
                      {task.title} · {task.status} · {task.dueAt.slice(0, 10)}
                    </p>
                  ))
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No active tasks assigned.</p>
                )}
              </div>
              <div className="mt-4 rounded-lg border border-border/70 p-3">
                <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                  <BriefcaseBusiness className="h-3 w-3 text-primary" /> Recent work history
                </p>
                {recentWork.length ? (
                  recentWork.map((task) => (
                    <p key={task.id} className="mt-2 text-xs text-muted-foreground">
                      {task.dueAt.slice(0, 10)} · {task.title} · {task.description}
                    </p>
                  ))
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No completed vendor work in the demo period.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
