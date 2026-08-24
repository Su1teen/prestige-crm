import { useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePaterhausWorkspace, PaterhausWorkspaceProvider } from "@/contexts/PaterhausWorkspaceContext";
import { CURRENT_PATERHAUS_USER } from "@/data/paterhaus";
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
  | "settings";

type PrimaryNavId = "overview" | "properties" | "leads" | "inbox" | "operations" | "finance" | "people";

const primaryNav: Array<{ id: PrimaryNavId; label: string; icon: LucideIcon; target: PaterhausSection }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, target: "overview" },
  { id: "properties", label: "Properties", icon: Home, target: "properties" },
  { id: "leads", label: "Leads & Owners", icon: UsersRound, target: "pipeline" },
  { id: "inbox", label: "Inbox", icon: MessageSquare, target: "conversations" },
  { id: "operations", label: "Operations", icon: BriefcaseBusiness, target: "operations" },
  { id: "finance", label: "Finance & Compliance", icon: CircleDollarSign, target: "finance" },
  { id: "people", label: "People & Settings", icon: Settings, target: "team" },
];

const groupedSections: Record<PrimaryNavId, Array<{ id: PaterhausSection; label: string }>> = {
  overview: [{ id: "overview", label: "Overview" }],
  properties: [{ id: "properties", label: "Properties" }],
  leads: [{ id: "pipeline", label: "Owner Pipeline" }],
  inbox: [{ id: "conversations", label: "Shared Inbox" }],
  operations: [
    { id: "operations", label: "Operations Board" },
    { id: "calendar", label: "Calendar" },
    { id: "stays", label: "Guests & Stays" },
  ],
  finance: [
    { id: "finance", label: "Finance" },
    { id: "compliance", label: "Compliance" },
  ],
  people: [
    { id: "team", label: "Team & Vendors" },
    { id: "settings", label: "Settings" },
  ],
};

const primaryForSection = (section: PaterhausSection): PrimaryNavId => {
  if (section === "pipeline") return "leads";
  if (section === "conversations") return "inbox";
  if (["operations", "calendar", "stays"].includes(section)) return "operations";
  if (["finance", "compliance"].includes(section)) return "finance";
  if (["team", "settings"].includes(section)) return "people";
  return section as "overview" | "properties";
};

const descriptions: Record<PrimaryNavId, string> = {
  overview: "Portfolio performance and operational priorities.",
  properties: "Property records, readiness, stays and activity.",
  leads: "Owner acquisition and onboarding workflows.",
  inbox: "Owner, guest, vendor and internal conversations.",
  operations: "Tasks, turnovers, stays and vendor coordination.",
  finance: "Owner reporting, payouts and compliance.",
  people: "Internal team, service partners and workspace settings.",
};

const WorkspaceSidebar = ({
  section,
  collapsed,
  onSectionChange,
  onCollapse,
}: {
  section: PaterhausSection;
  collapsed: boolean;
  onSectionChange: (section: PaterhausSection) => void;
  onCollapse: () => void;
}) => {
  const { tasks } = usePaterhausWorkspace();
  const activePrimary = primaryForSection(section);
  const urgent = tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length;
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 244 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</div>
        {!collapsed && <div className="min-w-0"><p className="font-semibold text-foreground">Paterhaus</p><p className="truncate text-xs text-muted-foreground">Property Management</p></div>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const active = activePrimary === item.id;
          const badge = item.id === "operations" ? urgent : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.target)}
              title={collapsed ? item.label : undefined}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />}
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="min-w-0 flex-1 leading-5">{item.label}</span>}
              {!collapsed && badge > 0 && <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[11px] text-primary">{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <button type="button" onClick={onCollapse} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/70">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </motion.aside>
  );
};

const MobileNavigation = ({ section, onSectionChange }: { section: PaterhausSection; onSectionChange: (section: PaterhausSection) => void }) => {
  const activePrimary = primaryForSection(section);
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden" aria-label="Primary navigation">
      {primaryNav.map((item) => (
        <Button key={item.id} type="button" size="sm" variant={activePrimary === item.id ? "default" : "ghost"} className="flex-shrink-0" onClick={() => onSectionChange(item.target)}>
          {item.label}
        </Button>
      ))}
    </nav>
  );
};

const PaterhausWorkspace = ({ onLogout }: { onLogout: () => void }) => {
  const [activeSection, setActiveSection] = useState<PaterhausSection>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState<string>();
  const [targetTaskId, setTargetTaskId] = useState<string>();
  const [targetConversationId, setTargetConversationId] = useState<string>();
  const { notifications } = usePaterhausWorkspace();
  const unread = notifications.filter((notification) => !notification.read).length;
  const activePrimary = primaryForSection(activeSection);
  const sectionTabs = groupedSections[activePrimary];
  const openProperty = (propertyId: string) => { setTargetPropertyId(propertyId); setActiveSection("properties"); setNotificationsOpen(false); };
  const openConversation = (conversationId: string) => { setTargetConversationId(conversationId); setActiveSection("conversations"); setNotificationsOpen(false); };
  const openTask = (taskId: string) => { setTargetTaskId(taskId); setActiveSection("operations"); setNotificationsOpen(false); };

  const renderSection = () => {
    if (activeSection === "overview") return <PortfolioOverview onNavigate={(section, propertyId) => {
      const destination = primaryNav.find((item) => item.target === section)?.target ?? Object.values(groupedSections).flat().find((item) => item.id === section)?.id;
      if (destination) setActiveSection(destination);
      setTargetPropertyId(propertyId);
    }} />;
    if (activeSection === "properties") return <PropertiesModule initialPropertyId={targetPropertyId} />;
    if (activeSection === "pipeline") return <OwnerPipelineModule />;
    if (activeSection === "operations") return <OperationsBoardModule onPropertySelect={openProperty} initialTaskId={targetTaskId} />;
    if (activeSection === "calendar") return <CalendarModule onPropertySelect={openProperty} />;
    if (activeSection === "stays") return <GuestsStaysModule onPropertySelect={openProperty} />;
    if (activeSection === "conversations") return <ConversationsModule onPropertySelect={openProperty} initialConversationId={targetConversationId} />;
    if (activeSection === "finance") return <FinanceModule />;
    if (activeSection === "compliance") return <ComplianceModule />;
    if (activeSection === "team") return <TeamVendorsModule />;
    return <SettingsModule />;
  };

  return (
    <div className="paterhaus dark min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen min-w-0">
        <WorkspaceSidebar section={activeSection} collapsed={collapsed} onSectionChange={setActiveSection} onCollapse={() => setCollapsed((value) => !value)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 lg:px-6">
              <div className="min-w-0"><h1 className="truncate text-lg font-semibold text-foreground">{primaryNav.find((item) => item.id === activePrimary)?.label}</h1><p className="hidden text-xs text-muted-foreground sm:block">{descriptions[activePrimary]}</p></div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`} onClick={() => setNotificationsOpen(true)}>
                  <Bell className="h-4 w-4" />
                  {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{unread}</span>}
                </Button>
                <div className="hidden items-center gap-2 text-right lg:flex"><div><p className="text-sm font-medium text-foreground">{CURRENT_PATERHAUS_USER.name}</p><p className="text-xs text-muted-foreground">{CURRENT_PATERHAUS_USER.role}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{CURRENT_PATERHAUS_USER.initials}</div></div>
                <Button type="button" variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></Button>
              </div>
            </div>
            {sectionTabs.length > 1 && <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:px-6">{sectionTabs.map((tab) => <Button key={tab.id} type="button" size="sm" variant={activeSection === tab.id ? "secondary" : "ghost"} className="flex-shrink-0" onClick={() => setActiveSection(tab.id)}>{tab.label}</Button>)}</div>}
          </header>
          <MobileNavigation section={activeSection} onSectionChange={setActiveSection} />
          <main className={activeSection === "conversations" ? "min-w-0 p-3 lg:p-4" : "min-w-0 p-4 lg:p-6"}>{renderSection()}</main>
        </div>
      </div>
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-xl">
          <SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader>
          <div className="mt-5"><NotificationsModule onPropertySelect={openProperty} onConversationSelect={openConversation} onTaskSelect={openTask} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const PaterhausCRM = ({ onLogout }: { onLogout: () => void }) => <PaterhausWorkspaceProvider><PaterhausWorkspace onLogout={onLogout} /></PaterhausWorkspaceProvider>;

export default PaterhausCRM;
