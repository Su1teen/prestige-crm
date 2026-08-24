import { useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  UsersRound,
  Wrench,
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
import { MarketingModule } from "@/components/paterhaus/MarketingModule";
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
  | "marketing"
  | "operations"
  | "calendar"
  | "stays"
  | "conversations"
  | "finance"
  | "compliance"
  | "team"
  | "notifications"
  | "settings";

interface NavItem {
  id: PaterhausSection;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ id: "overview", label: "Portfolio", icon: LayoutDashboard }],
  },
  {
    id: "sales",
    label: "Sales & Marketing",
    items: [
      { id: "pipeline", label: "Owner Pipeline", icon: UsersRound },
      { id: "marketing", label: "Marketing", icon: Megaphone },
      { id: "conversations", label: "Conversations", icon: MessageSquare },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "properties", label: "Properties", icon: Home },
      { id: "operations", label: "Operations Board", icon: BriefcaseBusiness },
      { id: "calendar", label: "Calendar", icon: CalendarDays },
      { id: "team", label: "Team & Vendors", icon: Wrench },
      { id: "compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [{ id: "finance", label: "Finance", icon: CircleDollarSign }],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

const sectionIds: string[] = [...allNavItems.map((item) => item.id), "stays"];
const isPaterhausSection = (value: string): value is PaterhausSection => sectionIds.includes(value);

const groupForSection = (section: PaterhausSection): NavGroup =>
  navGroups.find((group) => group.items.some((item) => item.id === section)) ?? navGroups[0];

const sectionLabels: Partial<Record<PaterhausSection, string>> = Object.fromEntries(
  allNavItems.map((item) => [item.id, item.label]),
);

const descriptions: Record<string, string> = {
  overview: "Portfolio performance and operational priorities.",
  sales: "Owner acquisition, campaigns and conversations.",
  operations: "Properties, tasks, turnovers and vendor coordination.",
  finance: "Owner reporting, payouts and financial KPIs.",
  system: "Notifications and workspace settings.",
};

const GroupedNav = ({
  section,
  onSectionChange,
  urgent,
}: {
  section: PaterhausSection;
  onSectionChange: (section: PaterhausSection) => void;
  urgent: number;
}) => {
  const activeGroup = groupForSection(section);
  const [openGroups, setOpenGroups] = useState<string[]>(navGroups.map((group) => group.id));
  const toggleGroup = (groupId: string) =>
    setOpenGroups((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  return (
    <nav className="space-y-2" aria-label="Primary navigation">
      {navGroups.map((group) => {
        const isOpen = openGroups.includes(group.id) || activeGroup.id === group.id;
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
              aria-expanded={isOpen}
            >
              {group.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
            </button>
            {isOpen && (
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  const badge = item.id === "operations" ? urgent : 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSectionChange(item.id)}
                      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />}
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0 flex-1 leading-5">{item.label}</span>
                      {badge > 0 && <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[11px] text-primary">{badge}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
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
  const urgent = tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length;
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</div>
        {!collapsed && <div className="min-w-0"><p className="font-semibold text-foreground">Paterhaus</p><p className="truncate text-xs text-muted-foreground">Property Management</p></div>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? (
          <nav className="space-y-1" aria-label="Primary navigation">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  title={item.label}
                  className={`relative flex w-full items-center justify-center rounded-xl px-3 py-2.5 transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"}`}
                >
                  {active && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />}
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </nav>
        ) : (
          <GroupedNav section={section} onSectionChange={onSectionChange} urgent={urgent} />
        )}
      </div>
      <div className="border-t border-border p-3">
        <button type="button" onClick={onCollapse} className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/70">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse sidebar</span></>}
        </button>
      </div>
    </motion.aside>
  );
};

const PaterhausWorkspace = ({ onLogout }: { onLogout: () => void }) => {
  const [activeSection, setActiveSection] = useState<PaterhausSection>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState<string>();
  const [targetTaskId, setTargetTaskId] = useState<string>();
  const [targetConversationId, setTargetConversationId] = useState<string>();
  const { notifications, tasks } = usePaterhausWorkspace();
  const unread = notifications.filter((notification) => !notification.read).length;
  const urgent = tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length;
  const activeGroup = groupForSection(activeSection);
  const openProperty = (propertyId: string) => { setTargetPropertyId(propertyId); setActiveSection("properties"); setNotificationsOpen(false); };
  const openConversation = (conversationId: string) => { setTargetConversationId(conversationId); setActiveSection("conversations"); setNotificationsOpen(false); };
  const openTask = (taskId: string) => { setTargetTaskId(taskId); setActiveSection("operations"); setNotificationsOpen(false); };
  const changeSection = (section: PaterhausSection) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const renderSection = () => {
    if (activeSection === "overview") return <PortfolioOverview onNavigate={(section, propertyId) => {
      if (isPaterhausSection(section)) setActiveSection(section);
      setTargetPropertyId(propertyId);
    }} />;
    if (activeSection === "properties") return <PropertiesModule initialPropertyId={targetPropertyId} />;
    if (activeSection === "pipeline") return <OwnerPipelineModule />;
    if (activeSection === "marketing") return <MarketingModule />;
    if (activeSection === "operations") return <OperationsBoardModule onPropertySelect={openProperty} initialTaskId={targetTaskId} />;
    if (activeSection === "calendar") return <CalendarModule onPropertySelect={openProperty} />;
    if (activeSection === "stays") return <GuestsStaysModule onPropertySelect={openProperty} />;
    if (activeSection === "conversations") return <ConversationsModule onPropertySelect={openProperty} initialConversationId={targetConversationId} />;
    if (activeSection === "finance") return <FinanceModule />;
    if (activeSection === "compliance") return <ComplianceModule />;
    if (activeSection === "team") return <TeamVendorsModule />;
    if (activeSection === "notifications") return <NotificationsModule onPropertySelect={openProperty} onConversationSelect={openConversation} onTaskSelect={openTask} />;
    return <SettingsModule />;
  };

  return (
    <div className="paterhaus dark min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen min-w-0">
        <WorkspaceSidebar section={activeSection} collapsed={collapsed} onSectionChange={setActiveSection} onCollapse={() => setCollapsed((value) => !value)} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 lg:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu" onClick={() => setMobileNavOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0"><h1 className="truncate text-lg font-semibold text-foreground">{sectionLabels[activeSection] ?? "Paterhaus"}</h1><p className="hidden text-xs text-muted-foreground sm:block">{descriptions[activeGroup.id]}</p></div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`} onClick={() => setNotificationsOpen(true)}>
                  <Bell className="h-4 w-4" />
                  {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{unread}</span>}
                </Button>
                <div className="hidden items-center gap-2 text-right lg:flex"><div><p className="text-sm font-medium text-foreground">{CURRENT_PATERHAUS_USER.name}</p><p className="text-xs text-muted-foreground">{CURRENT_PATERHAUS_USER.role}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{CURRENT_PATERHAUS_USER.initials}</div></div>
                <Button type="button" variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></Button>
              </div>
            </div>
          </header>
          <main className={activeSection === "conversations" ? "min-w-0 p-3 lg:p-4" : "min-w-0 p-4 lg:p-6"}>{renderSection()}</main>
        </div>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="dark w-[280px] overflow-y-auto border-border bg-sidebar p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</span>
              Paterhaus
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GroupedNav section={activeSection} onSectionChange={changeSection} urgent={urgent} />
          </div>
        </SheetContent>
      </Sheet>
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
