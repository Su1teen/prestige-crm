import { useEffect, useState } from "react";
import {
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { WhatsAppBotModule } from "@/components/paterhaus/WhatsAppBotModule";
import { FinanceModule } from "@/components/paterhaus/FinanceModule";
import { ComplianceModule } from "@/components/paterhaus/ComplianceModule";
import { TeamVendorsModule } from "@/components/paterhaus/TeamVendorsModule";
import { NotificationsModule } from "@/components/paterhaus/NotificationsModule";
import { SettingsModule } from "@/components/paterhaus/SettingsModule";
import { FilesHubModule } from "@/components/paterhaus/FilesHubModule";
import { KnowledgeBaseModule } from "@/components/paterhaus/KnowledgeBaseModule";
import { OpsCopilot } from "@/components/paterhaus/OpsCopilot";
import { Card } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export type PaterhausSection =
  | "overview"
  | "properties"
  | "pipeline"
  | "marketing"
  | "operations"
  | "calendar"
  | "files"
  | "stays"
  | "conversations"
  | "whatsapp"
  | "finance"
  | "compliance"
  | "team"
  | "copilot"
  | "knowledge"
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
    label: "nav.overview",
    items: [{ id: "overview", label: "nav.portfolio", icon: LayoutDashboard }],
  },
  {
    id: "sales",
    label: "nav.sales_marketing",
    items: [
      { id: "pipeline", label: "nav.owner_pipeline", icon: UsersRound },
      { id: "marketing", label: "nav.marketing", icon: Megaphone },
      { id: "conversations", label: "nav.conversations", icon: MessageSquare },
      { id: "whatsapp", label: "nav.whatsapp_bot", icon: MessageCircle },
    ],
  },
  {
    id: "operations",
    label: "nav.operations",
    items: [
      { id: "properties", label: "nav.properties", icon: Home },
      { id: "operations", label: "nav.operations_board", icon: BriefcaseBusiness },
      { id: "calendar", label: "nav.calendar", icon: CalendarDays },
      { id: "files", label: "nav.files_documents", icon: FolderOpen },
      { id: "team", label: "nav.team_vendors", icon: Wrench },
    ],
  },
  {
    id: "intelligence",
    label: "nav.intelligence",
    items: [
      { id: "copilot", label: "nav.ops_copilot", icon: Sparkles },
      { id: "knowledge", label: "nav.knowledge_base", icon: BookOpenText },
    ],
  },
  {
    id: "system",
    label: "nav.system",
    items: [
      { id: "notifications", label: "nav.notifications", icon: Bell },
      { id: "settings", label: "nav.settings", icon: Settings },
    ],
  },
  {
    id: "more",
    label: "nav.more",
    items: [
      { id: "stays", label: "nav.guests_stays", icon: UsersRound },
      { id: "finance", label: "nav.finance", icon: CircleDollarSign },
      { id: "compliance", label: "nav.compliance", icon: ShieldCheck },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

const sectionIds: string[] = allNavItems.map((item) => item.id);
const isPaterhausSection = (value: string): value is PaterhausSection => sectionIds.includes(value);

const groupForSection = (section: PaterhausSection): NavGroup =>
  navGroups.find((group) => group.items.some((item) => item.id === section)) ?? navGroups[0];

const sectionLabelKey: Partial<Record<PaterhausSection, string>> = Object.fromEntries(
  allNavItems.map((item) => [item.id, item.label]),
);

const descriptionKeys: Record<string, string> = {
  overview: "group.overview",
  sales: "group.sales",
  operations: "group.operations",
  intelligence: "group.intelligence",
  system: "group.system",
  more: "group.more",
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
  const { t } = useLanguage();
  const [openGroups, setOpenGroups] = useState<string[]>(
    navGroups.filter((group) => group.id !== "more").map((group) => group.id),
  );
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
              {t(group.label)}
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
                      <span className="min-w-0 flex-1 leading-5">{t(item.label)}</span>
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
  const { t } = useLanguage();
  const urgent = tasks.filter((task) => task.priority === "Urgent" && task.status !== "Completed").length;
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 hidden h-screen flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</div>
        {!collapsed && <div className="min-w-0"><p className="font-semibold text-foreground">Paterhaus</p><p className="truncate text-xs text-muted-foreground">{t("ops.property_management")}</p></div>}
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
                  title={t(item.label)}
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
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>{t("nav.collapse")}</span></>}
        </button>
      </div>
    </motion.aside>
  );
};

const GlobalSearch = ({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: PaterhausSection, propertyId?: string) => void;
}) => {
  const workspace = usePaterhausWorkspace();
  const go = (section: PaterhausSection, propertyId?: string) => {
    onOpenChange(false);
    onNavigate(section, propertyId);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark overflow-hidden border-border bg-background p-0">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command className="bg-background">
          <CommandInput placeholder="Search owners, leads, properties, guests, files, tasks, knowledge…" />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Owners & Leads">
              {workspace.opportunities.slice(0, 6).map((lead) => (
                <CommandItem key={lead.id} value={`lead ${lead.ownerName} ${lead.prospectProperty}`} onSelect={() => go("pipeline")}>
                  <UsersRound className="h-4 w-4" /> {lead.ownerName} · {lead.stage}
                </CommandItem>
              ))}
              {workspace.owners.slice(0, 4).map((owner) => (
                <CommandItem key={owner.id} value={`owner ${owner.name}`} onSelect={() => go("pipeline")}>
                  <UsersRound className="h-4 w-4" /> {owner.name} · Owner
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Properties">
              {workspace.properties.map((property) => (
                <CommandItem key={property.id} value={`property ${property.name} ${property.area}`} onSelect={() => go("properties", property.id)}>
                  <Home className="h-4 w-4" /> {property.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Guests">
              {workspace.guests.slice(0, 5).map((guest) => (
                <CommandItem key={guest.id} value={`guest ${guest.name}`} onSelect={() => go("stays")}>
                  <UsersRound className="h-4 w-4" /> {guest.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Files">
              {workspace.files.slice(0, 6).map((file) => (
                <CommandItem key={file.id} value={`file ${file.name}`} onSelect={() => go("files")}>
                  <FolderOpen className="h-4 w-4" /> {file.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Tasks">
              {workspace.tasks.filter((task) => task.status !== "Completed").slice(0, 6).map((task) => (
                <CommandItem key={task.id} value={`task ${task.title}`} onSelect={() => go("operations")}>
                  <BriefcaseBusiness className="h-4 w-4" /> {task.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Knowledge">
              {workspace.knowledgeItems.slice(0, 6).map((item) => (
                <CommandItem key={item.id} value={`knowledge ${item.title} ${item.tags.join(" ")}`} onSelect={() => go("knowledge")}>
                  <BookOpenText className="h-4 w-4" /> {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CopilotSection = ({ onOpenProperty }: { onOpenProperty: (propertyId: string) => void }) => (
  <div className="space-y-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Intelligence</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Ops Copilot</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Ask operational questions across properties, stays, tasks and owners. Answers are grounded in the workspace data and the Knowledge Base.
      </p>
    </div>
    <Card className="border-primary/25 bg-primary/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Open the Copilot panel</p>
          <p className="mt-1 text-sm text-muted-foreground">Summaries, drafts and follow-up actions for the current portfolio context.</p>
        </div>
        <OpsCopilot onOpenProperty={onOpenProperty} />
      </div>
    </Card>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {[
        { title: "Operational summaries", text: "Today's risks, readiness gaps and overdue work in one answer." },
        { title: "Owner & guest drafts", text: "Maintenance approvals, weekly updates and incident responses drafted for review." },
        { title: "Grounded in knowledge", text: "SOPs, property profiles and vendor rules from the Knowledge Base shape every reply." },
      ].map((item) => (
        <Card key={item.title} className="border-border/80 bg-card/70 p-4">
          <p className="font-medium text-foreground">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
        </Card>
      ))}
    </div>
  </div>
);

const PaterhausWorkspace = ({ onLogout }: { onLogout: () => void }) => {
  const [activeSection, setActiveSection] = useState<PaterhausSection>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState<string>();
  const [targetTaskId, setTargetTaskId] = useState<string>();
  const [targetConversationId, setTargetConversationId] = useState<string>();
  const { notifications, tasks } = usePaterhausWorkspace();
  const { t } = useLanguage();
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

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const quickCreate = (target: PaterhausSection, message: string) => {
    setActiveSection(target);
    toast.info(message);
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
    if (activeSection === "files") return <FilesHubModule onOpenProperty={openProperty} />;
    if (activeSection === "knowledge") return <KnowledgeBaseModule />;
    if (activeSection === "copilot") return <CopilotSection onOpenProperty={openProperty} />;
    if (activeSection === "stays") return <GuestsStaysModule onPropertySelect={openProperty} />;
    if (activeSection === "conversations") return <ConversationsModule onPropertySelect={openProperty} initialConversationId={targetConversationId} />;
    if (activeSection === "whatsapp") return <WhatsAppBotModule />;
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
                <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label={t("shell.openNav")} onClick={() => setMobileNavOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0"><h1 className="truncate text-lg font-semibold text-foreground">{sectionLabelKey[activeSection] ? t(sectionLabelKey[activeSection]!) : "Paterhaus"}</h1><p className="hidden text-xs text-muted-foreground sm:block">{t(descriptionKeys[activeGroup.id])}</p></div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="hidden rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground lg:inline">{t("shell.demoWorkspace")}</span>
                <LanguageSwitcher />
                <Button type="button" variant="outline" size="sm" className="hidden gap-2 text-muted-foreground sm:flex" onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                  <span className="hidden md:inline">{t("shell.search")}</span>
                  <kbd className="hidden rounded border border-border bg-secondary/60 px-1.5 text-[10px] md:inline">⌘K</kbd>
                </Button>
                <Button type="button" variant="ghost" size="icon" className="sm:hidden" aria-label={t("shell.search")} onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("shell.create")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark border-border bg-background">
                    <DropdownMenuItem onClick={() => quickCreate("pipeline", "Use “New Lead” in the Owner Pipeline to add a lead.")}>{t("create.newLead")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => quickCreate("operations", "Use “New task” on the Operations Board to create a task.")}>{t("create.newTask")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => quickCreate("files", "Use “Upload file” in Files & Documents to add a document.")}>{t("create.uploadFile")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => quickCreate("knowledge", "Use “Add knowledge” to record a new knowledge item.")}>{t("create.addKnowledge")}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => quickCreate("pipeline", "Open a lead and add an internal note to log owner context.")}>{t("create.logOwnerNote")}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button type="button" variant="ghost" size="icon" className="relative" aria-label={t("shell.notificationsUnread", { count: unread })} onClick={() => setNotificationsOpen(true)}>
                  <Bell className="h-4 w-4" />
                  {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">{unread}</span>}
                </Button>
                <div className="hidden items-center gap-2 text-right lg:flex"><div><p className="text-sm font-medium text-foreground">{CURRENT_PATERHAUS_USER.name}</p><p className="text-xs text-muted-foreground">{CURRENT_PATERHAUS_USER.role}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{CURRENT_PATERHAUS_USER.initials}</div></div>
                <Button type="button" variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("shell.logOut")}</span></Button>
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
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={(section, propertyId) => {
          if (propertyId) setTargetPropertyId(propertyId);
          setActiveSection(section);
        }}
      />
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="dark w-full overflow-y-auto border-border bg-background sm:max-w-xl">
          <SheetHeader><SheetTitle>{t("nav.notifications")}</SheetTitle></SheetHeader>
          <div className="mt-5"><NotificationsModule onPropertySelect={openProperty} onConversationSelect={openConversation} onTaskSelect={openTask} /></div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const PaterhausCRM = ({ onLogout }: { onLogout: () => void }) => <PaterhausWorkspaceProvider><PaterhausWorkspace onLogout={onLogout} /></PaterhausWorkspaceProvider>;

export default PaterhausCRM;
