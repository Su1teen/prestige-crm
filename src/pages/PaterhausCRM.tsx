import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import {
  canCreateManualPaterhausLead,
  isFocusedPaterhausWorkspaceEmail,
} from "@/lib/paterhausConversationsApi";
import { ProductionOverview } from "@/components/paterhaus/ProductionOverview";
import { ProductionPropertiesModule, ProductionContractorsModule, ProductionGuestsStaysModule } from "@/components/paterhaus/ProductionOperationsRecords";
import { OwnerPipelineModule } from "@/components/paterhaus/OwnerPipelineModule";
import { ProductionMarketingModule } from "@/components/paterhaus/ProductionMarketingModule";
import { ProductionProjectsModule } from "@/components/paterhaus/ProductionProjectsModule";
import { CalendarModule } from "@/components/paterhaus/CalendarModule";
import { ConversationsModule } from "@/components/paterhaus/ConversationsModule";
import { ProductionFilesModule } from "@/components/paterhaus/ProductionFilesModule";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { CreateLeadProvider, useCreateLead } from "@/contexts/CreateLeadContext";

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
  | "finance"
  | "compliance"
  | "team"
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

const ADMIN_SECTIONS: ReadonlySet<PaterhausSection> = new Set([
  "overview", "pipeline", "marketing", "conversations", "operations", "properties", "team", "calendar", "files",
]);

/**
 * Focused workspace (r_tszi@paterhaus.com): exactly Owner Pipeline, Marketing,
 * Conversations, Files and Calendar. Portfolio is never rendered for this profile.
 */
const FOCUSED_SECTIONS: ReadonlySet<PaterhausSection> = new Set([
  "pipeline",
  "marketing",
  "conversations",
  "files",
  "calendar",
]);

/** Navigation profile: derived from the role, narrowed further for specific accounts. */
type NavProfile = UserRole | "focused";

const getNavProfile = (role: UserRole, email: string | null | undefined): NavProfile =>
  isFocusedPaterhausWorkspaceEmail(email) ? "focused" : role;

const defaultSectionFor = (profile: NavProfile): PaterhausSection =>
  profile === "focused" || profile === "marketing" ? "pipeline" : "overview";

const isSectionAllowed = (section: PaterhausSection, profile: NavProfile): boolean => {
  if (profile === "focused" || profile === "marketing") return FOCUSED_SECTIONS.has(section);
  return ADMIN_SECTIONS.has(section);
};

/** Full nav groups for Admin. Marketing gets a filtered subset. */
const adminNavGroups: NavGroup[] = [
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
    ],
  },
  {
    id: "operations",
    label: "nav.operations",
    items: [
      { id: "operations", label: "nav.operations_board", icon: BriefcaseBusiness },
      { id: "properties", label: "nav.properties", icon: Home },
      { id: "team", label: "nav.team_vendors", icon: Wrench },
      { id: "calendar", label: "nav.calendar", icon: CalendarDays },
      { id: "files", label: "nav.files_documents", icon: FolderOpen },
    ],
  },
];

/** Focused navigation: exactly five sections, no Portfolio or admin modules. */
const focusedNavGroups: NavGroup[] = [
  {
    id: "sales",
    label: "nav.sales_marketing",
    items: [
      { id: "pipeline", label: "nav.owner_pipeline", icon: UsersRound },
      { id: "marketing", label: "nav.marketing", icon: Megaphone },
      { id: "conversations", label: "nav.conversations", icon: MessageSquare },
    ],
  },
  {
    id: "operations",
    label: "nav.operations",
    items: [
      { id: "files", label: "nav.files_documents", icon: FolderOpen },
      { id: "calendar", label: "nav.calendar", icon: CalendarDays },
    ],
  },
];

const getNavGroups = (profile: NavProfile): NavGroup[] => {
  return profile === "focused" || profile === "marketing" ? focusedNavGroups : adminNavGroups;
};

const allNavItems = adminNavGroups.flatMap((group) => group.items);

const sectionIds: string[] = allNavItems.map((item) => item.id);
const isPaterhausSection = (value: string): value is PaterhausSection => sectionIds.includes(value);

const groupForSection = (section: PaterhausSection, profile: NavProfile): NavGroup => {
  const groups = getNavGroups(profile);
  return groups.find((group) => group.items.some((item) => item.id === section)) ?? groups[0];
};

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

/** User identity per role. */
const getUserIdentity = (role: NavProfile, email: string) => {
  if (role === "marketing" || role === "focused") {
    return { name: "Paterhaus Marketing", roleLabel: "Marketing", initials: "PM", email };
  }
  return { name: "Ruslan Tszi", roleLabel: "Administrator", initials: "SS", email };
};

/** Workspace title per role. */
const getWorkspaceTitle = (role: NavProfile): string =>
  role === "marketing" || role === "focused" ? "Paterhaus Marketing" : "Paterhaus";

const GroupedNav = ({
  section,
  onSectionChange,
  urgent,
  role,
}: {
  section: PaterhausSection;
  onSectionChange: (section: PaterhausSection) => void;
  urgent: number;
  role: NavProfile;
}) => {
  const navGroups = getNavGroups(role);
  const activeGroup = groupForSection(section, role);
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
  role,
}: {
  section: PaterhausSection;
  collapsed: boolean;
  onSectionChange: (section: PaterhausSection) => void;
  onCollapse: () => void;
  role: NavProfile;
}) => {
  const { t } = useLanguage();
  const navGroups = getNavGroups(role);
  const visibleItems = navGroups.flatMap((group) => group.items);
  const urgent = 0;
  const workspaceTitle = getWorkspaceTitle(role);
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 hidden h-dvh flex-shrink-0 flex-col border-r border-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</div>
        {!collapsed && <div className="min-w-0"><p className="font-semibold text-foreground">{workspaceTitle}</p><p className="truncate text-xs text-muted-foreground">Operations · Snagging · Staging</p></div>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? (
          <nav className="space-y-1" aria-label="Primary navigation">
            {visibleItems.map((item) => {
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
          <GroupedNav section={section} onSectionChange={onSectionChange} urgent={urgent} role={role} />
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

const PaterhausWorkspaceInner = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useAuth();
  const userRole: UserRole = user?.role ?? "admin";
  const role = getNavProfile(userRole, user?.email);
  const canCreateLiveLead = canCreateManualPaterhausLead(user?.email);
  const [activeSection, setActiveSection] = useState<PaterhausSection>(() => defaultSectionFor(role));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t } = useLanguage();
  const { openCreateLead } = useCreateLead();
  const urgent = 0;
  const activeGroup = groupForSection(activeSection, role);
  const userIdentity = getUserIdentity(role, user?.email ?? "");
  const openProperty = (_propertyId: string) => { if (isSectionAllowed("properties", role)) setActiveSection("properties"); };
  const changeSection = (section: PaterhausSection) => {
    if (!isSectionAllowed(section, role)) return;
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const [targetChatId, setTargetChatId] = useState<string | null>(null);

  // Listen for cross-component navigation events (e.g., "Go to chat" from Pipeline)
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ chatId?: string; number?: string; name?: string }>;
      if (isSectionAllowed("conversations", role)) {
        setActiveSection("conversations");
        if (customEvent.detail?.chatId || customEvent.detail?.number) {
          setTargetChatId(customEvent.detail.chatId ?? customEvent.detail.number ?? null);
        }
      }
    };
    window.addEventListener("paterhaus:open-chat", handleOpenChat);
    return () => window.removeEventListener("paterhaus:open-chat", handleOpenChat);
  }, [role]);

  const quickCreate = (target: PaterhausSection, message: string) => {
    if (!isSectionAllowed(target, role)) return;
    if (target === "pipeline" && canCreateLiveLead) {
      // Live accounts reuse the shared Create Lead modal from anywhere in the workspace.
      openCreateLead();
      return;
    }
    setActiveSection(target);
    toast.info(message);
  };

  const renderSection = () => {
    if (!isSectionAllowed(activeSection, role)) return <OwnerPipelineModule />;
    if (activeSection === "overview") return <ProductionOverview />;
    if (activeSection === "properties") return <ProductionPropertiesModule />;
    if (activeSection === "pipeline") return <OwnerPipelineModule />;
    if (activeSection === "marketing") return <ProductionMarketingModule />;
    if (activeSection === "operations") return <ProductionProjectsModule />;
    if (activeSection === "calendar") return <CalendarModule onPropertySelect={openProperty} />;
    if (activeSection === "files") return <ProductionFilesModule email={user?.email ?? ""} admin={role === "admin"} />;
    if (activeSection === "stays") return <ProductionGuestsStaysModule />;
    if (activeSection === "conversations") return <ConversationsModule onPropertySelect={openProperty} initialConversationId={targetChatId ?? undefined} targetChatId={targetChatId} />;
    if (activeSection === "team") return <ProductionContractorsModule />;
    return <ProductionOverview />;
  };

  return (
    <div className="paterhaus h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-w-0">
        <WorkspaceSidebar section={activeSection} collapsed={collapsed} onSectionChange={setActiveSection} onCollapse={() => setCollapsed((value) => !value)} role={role} />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex-none border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 lg:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label={t("shell.openNav")} onClick={() => setMobileNavOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0"><h1 className="truncate text-lg font-semibold text-foreground">{sectionLabelKey[activeSection] ? t(sectionLabelKey[activeSection]!) : "Paterhaus"}</h1><p className="hidden text-xs text-muted-foreground sm:block">{t(descriptionKeys[activeGroup.id])}</p></div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <LanguageSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="sm">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t("shell.create")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="paterhaus border-border bg-background">
                    <DropdownMenuItem onClick={() => quickCreate("pipeline", t("create.newLeadHint"))}>{t("create.newLead")}</DropdownMenuItem>
                    {isSectionAllowed("operations", role) && <DropdownMenuItem onClick={() => quickCreate("operations", "Open projects")}>New project</DropdownMenuItem>}
                    {isSectionAllowed("files", role) && <DropdownMenuItem onClick={() => quickCreate("files", "Open files")}>{t("create.uploadFile")}</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="hidden items-center gap-2 text-right lg:flex"><div><p className="text-sm font-medium text-foreground">{userIdentity.name}</p><p className="text-xs text-muted-foreground">{userIdentity.roleLabel}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{userIdentity.initials}</div></div>
                <Button type="button" variant="outline" size="sm" onClick={onLogout}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("shell.logOut")}</span></Button>
              </div>
            </div>
          </header>
          <main className={activeSection === "conversations" ? "min-h-0 min-w-0 flex-1 overflow-hidden p-3 lg:p-4" : "min-h-0 min-w-0 flex-1 overflow-y-auto p-4 lg:p-6"}>{renderSection()}</main>
        </div>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="paterhaus w-[280px] overflow-y-auto border-border bg-sidebar p-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-sm font-semibold text-primary">PH</span>
              Paterhaus
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <GroupedNav section={activeSection} onSectionChange={changeSection} urgent={urgent} role={role} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const PaterhausWorkspace = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useAuth();
  const userRole: UserRole = user?.role ?? "admin";
  const role = getNavProfile(userRole, user?.email);
  const canCreateLiveLead = canCreateManualPaterhausLead(user?.email);
  return (
    <CreateLeadProvider email={user?.email ?? ""} canCreateLead={canCreateLiveLead}>
      <PaterhausWorkspaceInner onLogout={onLogout} />
    </CreateLeadProvider>
  );
};

const PaterhausCRM = ({ onLogout }: { onLogout: () => void }) => <PaterhausWorkspace onLogout={onLogout} />;

export default PaterhausCRM;
