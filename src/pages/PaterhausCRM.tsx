import { useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  FileCheck2,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePaterhausWorkspace, PaterhausWorkspaceProvider } from "@/contexts/PaterhausWorkspaceContext";
import { PortfolioOverview } from "@/components/paterhaus/PortfolioOverview";
import { PropertiesModule } from "@/components/paterhaus/PropertiesModule";
import { OwnerPipelineModule } from "@/components/paterhaus/OwnerPipelineModule";
import { OperationsBoardModule } from "@/components/paterhaus/OperationsBoardModule";
import { CalendarModule } from "@/components/paterhaus/CalendarModule";
import { GuestsStaysModule } from "@/components/paterhaus/GuestsStaysModule";
import { ConversationsModule } from "@/components/paterhaus/ConversationsModule";
import { FinanceModule } from "@/components/paterhaus/FinanceModule";
import { ComplianceModule } from "@/components/paterhaus/ComplianceModule";
import { TeamVendorsModule } from "@/components/paterhaus/TeamVendorsModule";
import { NotificationsModule } from "@/components/paterhaus/NotificationsModule";
import { SettingsModule } from "@/components/paterhaus/SettingsModule";

export type PaterhausSection =
  | "overview"
  | "properties"
  | "pipeline"
  | "operations"
  | "calendar"
  | "stays"
  | "conversations"
  | "finance"
  | "compliance"
  | "team"
  | "notifications"
  | "settings";

const navItems: Array<{ id: PaterhausSection; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Portfolio Overview", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Home },
  { id: "pipeline", label: "Owner Pipeline", icon: Workflow },
  { id: "operations", label: "Operations Board", icon: ClipboardList },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "stays", label: "Guests & Stays", icon: UsersRound },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "finance", label: "Finance & Owner Reports", icon: FileBarChart },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "team", label: "Team & Vendors", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];
const sectionValues: string[] = navItems.map((item) => item.id);
const isPaterhausSection = (value: string): value is PaterhausSection => sectionValues.includes(value);

const descriptions: Record<PaterhausSection, string> = {
  overview: "Executive operations dashboard for the Dubai portfolio.",
  properties: "Property records, readiness and operational detail.",
  pipeline: "Owner acquisition and onboarding pipeline.",
  operations: "Turnovers, maintenance, tasks and vendor SLAs.",
  calendar: "Property-centric reservations and operational events.",
  stays: "Guest lifecycle, reservations and stay details.",
  conversations: "Unified owner, guest, vendor and team inbox.",
  finance: "Owner statements, payouts and property-level P&L.",
  compliance: "Operational documentation and renewal tracking.",
  team: "Internal team and vendor capacity.",
  notifications: "Actionable operational alerts and approvals.",
  settings: "Workspace profile, rules and demo integrations.",
};

const WorkspaceSidebar = ({
  activeSection,
  collapsed,
  onSectionChange,
  onCollapse,
}: {
  activeSection: PaterhausSection;
  collapsed: boolean;
  onSectionChange: (section: PaterhausSection) => void;
  onCollapse: () => void;
}) => {
  const { notifications, tasks } = usePaterhausWorkspace();
  const unread = notifications.filter((notification) => !notification.read).length;
  const urgent = tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length;
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 280 }}
      transition={{ duration: 0.22 }}
      className="sticky top-0 flex h-screen flex-shrink-0 flex-col border-r border-border bg-sidebar"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">
          PH
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold tracking-tight text-foreground">Paterhaus</p>
            <p className="text-xs text-muted-foreground">Property Management</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const badge = item.id === "notifications" ? unread : item.id === "operations" ? urgent : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[11px] text-primary">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

const WorkspaceHeader = ({ section, onLogout }: { section: PaterhausSection; onLogout: () => void }) => (
  <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {navItems.find((item) => item.id === section)?.label}
      </h1>
      <p className="text-xs text-muted-foreground">{descriptions[section]}</p>
    </div>
    <div className="flex items-center gap-4">
      <div className="hidden items-center gap-2 text-right sm:flex">
        <div>
          <p className="text-sm font-medium text-foreground">Amelia Hart</p>
          <p className="text-xs text-muted-foreground">Operations Director</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          AH
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  </header>
);

const PaterhausWorkspace = ({ onLogout }: { onLogout: () => void }) => {
  const [activeSection, setActiveSection] = useState<PaterhausSection>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState<string | undefined>();
  const [targetTaskId, setTargetTaskId] = useState<string | undefined>();
  const [targetConversationId, setTargetConversationId] = useState<string | undefined>();
  const openProperty = (propertyId: string) => {
    setTargetPropertyId(propertyId);
    setActiveSection("properties");
  };
  const renderSection = () => {
    if (activeSection === "overview")
      return (
        <PortfolioOverview
          onNavigate={(section, propertyId) => {
            if (isPaterhausSection(section)) setActiveSection(section);
            setTargetPropertyId(propertyId);
          }}
        />
      );
    if (activeSection === "properties") return <PropertiesModule initialPropertyId={targetPropertyId} />;
    if (activeSection === "pipeline") return <OwnerPipelineModule />;
    if (activeSection === "operations") {
      return <OperationsBoardModule onPropertySelect={openProperty} initialTaskId={targetTaskId} />;
    }
    if (activeSection === "calendar") return <CalendarModule onPropertySelect={openProperty} />;
    if (activeSection === "stays") return <GuestsStaysModule onPropertySelect={openProperty} />;
    if (activeSection === "conversations") {
      return <ConversationsModule onPropertySelect={openProperty} initialConversationId={targetConversationId} />;
    }
    if (activeSection === "finance") return <FinanceModule />;
    if (activeSection === "compliance") return <ComplianceModule />;
    if (activeSection === "team") return <TeamVendorsModule />;
    if (activeSection === "notifications") {
      return (
        <NotificationsModule
          onPropertySelect={openProperty}
          onConversationSelect={(conversationId) => {
            setTargetConversationId(conversationId);
            setActiveSection("conversations");
          }}
          onTaskSelect={(taskId) => {
            setTargetTaskId(taskId);
            setActiveSection("operations");
          }}
        />
      );
    }
    if (activeSection === "settings") return <SettingsModule />;
    return null;
  };
  return (
    <div className="paterhaus dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <WorkspaceSidebar
          activeSection={activeSection}
          collapsed={collapsed}
          onSectionChange={setActiveSection}
          onCollapse={() => setCollapsed((value) => !value)}
        />
        <div className="min-w-0 flex-1">
          <WorkspaceHeader section={activeSection} onLogout={onLogout} />
          <main className="p-6 lg:p-8">{renderSection()}</main>
        </div>
      </div>
    </div>
  );
};

const PaterhausCRM = ({ onLogout }: { onLogout: () => void }) => (
  <PaterhausWorkspaceProvider>
    <PaterhausWorkspace onLogout={onLogout} />
  </PaterhausWorkspaceProvider>
);

export default PaterhausCRM;
