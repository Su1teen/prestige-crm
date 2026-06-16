import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  contracts,
  filterDealsByPeriod,
  formatTenge,
  getReachedStageCount,
  initialChats,
  initialDeals,
  periods,
  revenueSeries,
  stageLabels,
  stageOrder,
  steppeClients,
  steppeNotifications,
  type PeriodKey,
  type SteppeChat,
  type SteppeClient,
  type SteppeDeal,
  type SteppeNotification,
} from "@/data/steppeData";

interface SteppeHotelCRMProps {
  onLogout: () => void;
}

type SteppeSection = "dashboard" | "pipeline" | "clients" | "dialogs" | "notifications" | "contracts" | "settings";
type TeamSortKey = "name" | "deals" | "conversion" | "averageCheck" | "responseMinutes";
type ClientSortKey = "company" | "contact" | "contractStatus" | "lastContact";

const navItems: Array<{ id: SteppeSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "pipeline", label: "Воронка продаж", icon: SlidersHorizontal },
  { id: "clients", label: "Клиенты", icon: Users },
  { id: "dialogs", label: "Диалоги", icon: MessageSquare },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "contracts", label: "Договоры", icon: FileText },
  { id: "settings", label: "Настройки", icon: Settings },
];

const urgencyStyles: Record<string, string> = {
  Горячий: "text-red-300 before:bg-red-400",
  Тёплый: "text-amber-300 before:bg-amber-400",
  Холодный: "text-slate-400 before:bg-slate-500",
};

const sourceColors = ["#818cf8", "#38bdf8", "#34d399", "#fbbf24", "#f87171"];

const getSectionTitle = (section: SteppeSection) => navItems.find((item) => item.id === section)?.label ?? "Дашборд";

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getContractText = (client: SteppeClient) => {
  if (client.contractStatus === "Истекает") {
    return `Истекает через ${client.contractDaysLeft} дней`;
  }

  if (client.contractStatus === "Истёк") {
    return `Истёк ${Math.abs(client.contractDaysLeft)} дней назад`;
  }

  return client.contractStatus;
};

const MetricCard = ({ label, value, delta }: { label: string; value: string; delta: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    <p className="mt-2 text-sm text-emerald-300">{delta}</p>
  </div>
);

const SteppeSidebar = ({
  activeSection,
  collapsed,
  activeAiDialogs,
  unreadNotifications,
  onSectionChange,
  onCollapse,
}: {
  activeSection: SteppeSection;
  collapsed: boolean;
  activeAiDialogs: number;
  unreadNotifications: number;
  onSectionChange: (section: SteppeSection) => void;
  onCollapse: () => void;
}) => (
  <motion.aside
    animate={{ width: collapsed ? 76 : 278 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    className="sticky top-0 flex h-screen flex-col border-r border-border bg-card"
  >
    <div className="flex h-16 items-center gap-3 border-b border-border px-5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border text-sm font-semibold text-primary">
        SH
      </div>
      {!collapsed && (
        <div>
          <p className="font-semibold tracking-tight text-foreground">Steppe HM</p>
          <p className="text-xs text-muted-foreground">Hotel CRM</p>
        </div>
      )}
    </div>

    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        const badge = item.id === "dialogs" ? activeAiDialogs : item.id === "notifications" ? unreadNotifications : 0;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {isActive && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-primary" />}
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && badge > 0 && (
              <span className="ml-auto rounded-full border border-primary/30 px-2 py-0.5 text-xs text-primary">{badge}</span>
            )}
          </button>
        );
      })}
    </nav>

    <div className="border-t border-border p-3">
      <button
        type="button"
        onClick={onCollapse}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Свернуть</span></>}
      </button>
    </div>
  </motion.aside>
);

const Header = ({ activeSection, onLogout }: { activeSection: SteppeSection; onLogout: () => void }) => (
  <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-8 backdrop-blur">
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{getSectionTitle(activeSection)}</h1>
      <p className="text-sm text-muted-foreground">Ruslan Tszi · Директор по маркетингу</p>
    </div>
    <Button variant="outline" size="sm" onClick={onLogout}>
      <LogOut className="h-4 w-4" />
      Выйти
    </Button>
  </header>
);

const DashboardSection = ({
  deals,
  chats,
  period,
  onPeriodChange,
}: {
  deals: SteppeDeal[];
  chats: SteppeChat[];
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
}) => {
  const filteredDeals = useMemo(() => filterDealsByPeriod(deals, period), [deals, period]);
  const closedDeals = filteredDeals.filter((deal) => deal.stage === "closed");
  const incoming = filteredDeals.length;
  const conversion = incoming > 0 ? Math.round((closedDeals.length / incoming) * 100) : 0;
  const adr = Math.round(average(closedDeals.map((deal) => deal.amount)));
  const revenue = closedDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const ancillary = closedDeals.reduce((sum, deal) => sum + deal.ancillary, 0);

  const funnelData = stageOrder.map((stage, index) => {
    const count = getReachedStageCount(filteredDeals, stage);
    const previous = index === 0 ? count : getReachedStageCount(filteredDeals, stageOrder[index - 1]);

    return {
      name: stageLabels[stage],
      count,
      conversion: previous > 0 ? Math.round((count / previous) * 100) : 0,
    };
  });

  const sourceData = Array.from(new Set(filteredDeals.map((deal) => deal.source))).map((source) => {
    const sourceDeals = filteredDeals.filter((deal) => deal.source === source);
    return {
      name: source,
      value: sourceDeals.length,
      revenue: sourceDeals.reduce((sum, deal) => sum + deal.amount, 0),
    };
  });

  const teamRows = Array.from(new Set(deals.map((deal) => deal.owner))).map((owner) => {
    const ownerDeals = filteredDeals.filter((deal) => deal.owner === owner);
    const ownerClosed = ownerDeals.filter((deal) => deal.stage === "closed");
    const ownerChats = chats.filter((chat) => chat.owner === owner);
    const responseSource = [...ownerDeals.map((deal) => deal.responseMinutes), ...ownerChats.map((chat) => chat.responseMinutes)];

    return {
      name: owner,
      role: owner.startsWith("AI") ? "AI-агент" : "Менеджер продаж",
      deals: ownerDeals.length,
      conversion: ownerDeals.length > 0 ? Math.round((ownerClosed.length / ownerDeals.length) * 100) : 0,
      averageCheck: Math.round(average(ownerClosed.map((deal) => deal.amount))),
      responseMinutes: Math.round(average(responseSource)),
      status: owner.startsWith("AI") ? "Активен 24/7" : ownerDeals.length > 0 ? "В работе" : "Нет сделок",
    };
  });

  const [sortKey, setSortKey] = useState<TeamSortKey>("conversion");
  const sortedTeamRows = [...teamRows].sort((first, second) => {
    if (sortKey === "name") {
      return first.name.localeCompare(second.name, "ru");
    }

    return second[sortKey] - first[sortKey];
  });

  const aiL2 = teamRows.find((row) => row.name === "AI L2");
  const bestManager = teamRows
    .filter((row) => row.role === "Менеджер продаж")
    .sort((first, second) => second.conversion - first.conversion)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Операционный срез</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Продажи и AI-агенты</h2>
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                period === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        <MetricCard label="Входящих запросов" value={`${incoming}`} delta="+12% к прошлому периоду" />
        <MetricCard label="Конверсия в закрытие" value={`${conversion}%`} delta="+5 п.п. за счёт AI L2" />
        <MetricCard label="Средний чек (ADR)" value={formatTenge(adr)} delta="+9% к прошлой неделе" />
        <MetricCard label="Выручка" value={formatTenge(revenue)} delta="+18% к плану" />
        <MetricCard label="Ancillary revenue" value={formatTenge(ancillary)} delta="+22% от апселлов" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Воронка конверсии</h3>
            <p className="text-sm text-muted-foreground">Переходы рассчитаны из текущих сделок за выбранный период.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} interval={0} angle={-12} height={64} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip formatter={(value, name) => [value, name === "count" ? "Сделок" : "Конверсия"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="count" fill="#818cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 pt-3 text-sm text-muted-foreground md:grid-cols-3">
            {funnelData.slice(1).map((item) => (
              <p key={item.name}>
                {item.name}: <span className="text-foreground">{item.conversion}%</span>
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Источники заявок</h3>
            <p className="text-sm text-muted-foreground">Каналы связаны с карточками воронки и суммой сделок.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={58} paddingAngle={3}>
                    {sourceData.map((entry, index) => (
                      <Cell key={entry.name} fill={sourceColors[index % sourceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {sourceData.map((item, index) => (
                <div key={item.name} className="rounded-xl border border-border bg-background/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sourceColors[index % sourceColors.length] }} />
                    <p className="font-medium text-foreground">{item.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.value} заявок · {formatTenge(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Динамика выручки</h3>
            <p className="text-sm text-muted-foreground">Прямые продажи и дополнительная выручка по месяцам.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}м`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip formatter={(value) => formatTenge(Number(value))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Line type="monotone" dataKey="direct" name="Прямые продажи" stroke="#818cf8" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ancillary" name="Ancillary" stroke="#34d399" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">AI vs менеджеры</h3>
            <p className="text-sm text-muted-foreground">AI L2 сравнивается с лучшим менеджером периода.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/60 p-5">
              <p className="text-sm text-muted-foreground">AI L2</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{aiL2?.conversion ?? 0}%</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {aiL2?.deals ?? 0} сделок · средний ответ {aiL2?.responseMinutes ?? 0} мин · чек {formatTenge(aiL2?.averageCheck ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-5">
              <p className="text-sm text-muted-foreground">Лучший менеджер</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{bestManager?.conversion ?? 0}%</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {bestManager?.name ?? "Нет данных"} · {bestManager?.deals ?? 0} сделок · ответ {bestManager?.responseMinutes ?? 0} мин
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            Инсайт: AI L2 быстрее отвечает и лучше удерживает inbound-каналы, но менеджеры закрывают крупные договоры после юридического этапа.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Перформанс команды</h3>
            <p className="text-sm text-muted-foreground">Сортировка влияет на таблицу, цифры рассчитаны из сделок и диалогов.</p>
          </div>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as TeamSortKey)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="conversion">По конверсии</option>
            <option value="deals">По сделкам</option>
            <option value="averageCheck">По среднему чеку</option>
            <option value="responseMinutes">По времени ответа</option>
            <option value="name">По имени</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Сотрудник</th>
                <th className="py-3 pr-4 font-medium">Роль</th>
                <th className="py-3 pr-4 font-medium">Сделок</th>
                <th className="py-3 pr-4 font-medium">Конверсия</th>
                <th className="py-3 pr-4 font-medium">Средний чек</th>
                <th className="py-3 pr-4 font-medium">Среднее время ответа</th>
                <th className="py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeamRows.map((row) => (
                <tr key={row.name} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-medium text-foreground">{row.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.role}</td>
                  <td className="py-3 pr-4 text-foreground">{row.deals}</td>
                  <td className="py-3 pr-4 text-foreground">{row.conversion}%</td>
                  <td className="py-3 pr-4 text-foreground">{formatTenge(row.averageCheck)}</td>
                  <td className="py-3 pr-4 text-foreground">{row.responseMinutes} мин</td>
                  <td className="py-3 text-muted-foreground">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const PipelineSection = ({ deals, onTakeDeal }: { deals: SteppeDeal[]; onTakeDeal: (dealId: string) => void }) => {
  const [selectedDeal, setSelectedDeal] = useState<SteppeDeal | null>(null);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Горизонтальная Kanban-доска с суммами, срочностью и владельцами сделок.</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageOrder.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage);
          const total = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);

          return (
            <section key={stage} className="w-[320px] flex-shrink-0 rounded-2xl border border-border bg-card shadow-card">
              <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{stageLabels[stage]}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{stageDeals.length} сделок</p>
                  </div>
                  <p className="text-right text-sm font-medium text-primary">{formatTenge(total)}</p>
                </div>
              </div>
              <div className="space-y-3 p-3">
                {stageDeals.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => setSelectedDeal(deal)}
                    className="w-full rounded-xl border border-border bg-background/60 p-4 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{deal.contact}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{deal.company}</p>
                      </div>
                      <span className={`relative pl-3 text-xs before:absolute before:left-0 before:top-1.5 before:h-1.5 before:w-1.5 before:rounded-full ${urgencyStyles[deal.urgency]}`}>
                        {deal.urgency}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>{deal.source}</span>
                      <span className="text-right">{deal.owner}</span>
                      <span className="font-medium text-foreground">{formatTenge(deal.amount)}</span>
                      <span className="text-right">{deal.lastContact}</span>
                    </div>
                    {deal.owner.startsWith("AI") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={(event) => {
                          event.stopPropagation();
                          onTakeDeal(deal.id);
                        }}
                      >
                        Взять на себя
                      </Button>
                    )}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Sheet open={Boolean(selectedDeal)} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        <SheetContent className="dark w-full overflow-y-auto sm:max-w-xl">
          {selectedDeal && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedDeal.contact}</SheetTitle>
                <SheetDescription>{selectedDeal.company} · {stageLabels[selectedDeal.stage]}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Сумма сделки</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{formatTenge(selectedDeal.amount)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Ancillary: {formatTenge(selectedDeal.ancillary)} · Источник: {selectedDeal.source}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Детали</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedDeal.summary}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">История диалога</h4>
                  <div className="mt-3 space-y-2">
                    {selectedDeal.dialogue.map((entry) => (
                      <div key={entry} className="rounded-xl border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedDeal.owner.startsWith("AI") && (
                  <Button onClick={() => onTakeDeal(selectedDeal.id)} className="w-full">
                    Взять сделку на себя
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const ClientsSection = ({ deals }: { deals: SteppeDeal[] }) => {
  const [selectedClient, setSelectedClient] = useState<SteppeClient | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ClientSortKey>("company");

  const filteredClients = steppeClients
    .filter((client) => `${client.company} ${client.contact} ${client.phone}`.toLowerCase().includes(query.toLowerCase()))
    .sort((first, second) => first[sortKey].localeCompare(second[sortKey], "ru"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по клиентам" className="pl-9" />
        </div>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as ClientSortKey)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="company">Компания</option>
          <option value="contact">Контактное лицо</option>
          <option value="contractStatus">Статус договора</option>
          <option value="lastContact">Последний контакт</option>
        </select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Компания</th>
                <th className="px-4 py-3 font-medium">Контактное лицо</th>
                <th className="px-4 py-3 font-medium">Телефон</th>
                <th className="px-4 py-3 font-medium">Тип клиента</th>
                <th className="px-4 py-3 font-medium">Статус договора</th>
                <th className="px-4 py-3 font-medium">Дата последнего контакта</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{client.company}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.contact}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.type}</td>
                  <td className="px-4 py-3 text-foreground">{getContractText(client)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{client.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Sheet open={Boolean(selectedClient)} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <SheetContent className="dark w-full overflow-y-auto sm:max-w-xl">
          {selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedClient.company}</SheetTitle>
                <SheetDescription>{selectedClient.contact} · {selectedClient.type}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <section className="rounded-2xl border border-border bg-card p-4">
                  <h4 className="font-medium text-foreground">Полная информация</h4>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <p>Телефон: {selectedClient.phone}</p>
                    <p>Email: {selectedClient.email}</p>
                    <p>Договор: {getContractText(selectedClient)}</p>
                    <p>{selectedClient.notes}</p>
                  </div>
                </section>
                <section>
                  <h4 className="font-medium text-foreground">История взаимодействий</h4>
                  <div className="mt-3 space-y-2">
                    {deals
                      .filter((deal) => deal.clientId === selectedClient.id)
                      .flatMap((deal) => deal.dialogue)
                      .map((entry) => (
                        <p key={entry} className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
                          {entry}
                        </p>
                      ))}
                  </div>
                </section>
                <section>
                  <h4 className="font-medium text-foreground">Сделки</h4>
                  <div className="mt-3 space-y-2">
                    {deals
                      .filter((deal) => deal.clientId === selectedClient.id)
                      .map((deal) => (
                        <div key={deal.id} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-foreground">{stageLabels[deal.stage]}</p>
                            <p className="text-sm text-primary">{formatTenge(deal.amount)}</p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{deal.summary}</p>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DialogsSection = ({
  chats,
  onTakeChat,
  onReturnAi,
}: {
  chats: SteppeChat[];
  onTakeChat: (chatId: string) => void;
  onReturnAi: (chatId: string) => void;
}) => {
  const [selectedChatId, setSelectedChatId] = useState(chats[0]?.id ?? "");
  const [showSummary, setShowSummary] = useState(false);
  const [draft, setDraft] = useState("");
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? chats[0];

  if (!selectedChat) {
    return <p className="text-muted-foreground">Активных диалогов нет.</p>;
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-card xl:grid-cols-[320px_1fr_320px]">
      <aside className="border-r border-border">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Активные чаты</h3>
          <p className="text-sm text-muted-foreground">{chats.filter((chat) => chat.activeAi).length} ведёт AI</p>
        </div>
        <div className="divide-y divide-border">
          {chats.map((chat) => (
            <button
              key={chat.id}
              type="button"
              onClick={() => {
                setSelectedChatId(chat.id);
                setShowSummary(false);
              }}
              className={`w-full p-4 text-left transition-colors ${
                selectedChat.id === chat.id ? "bg-secondary/60" : "hover:bg-secondary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{chat.contact}</p>
                  <p className="text-xs text-muted-foreground">{chat.company}</p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">{chat.channel}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{chat.lastMessage}</p>
              <p className="mt-2 text-xs text-primary">{chat.owner}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[680px] flex-col">
        <div className="border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{selectedChat.contact}</h3>
              <p className="text-sm text-muted-foreground">{selectedChat.company}</p>
            </div>
            {selectedChat.activeAi ? (
              <Button variant="outline" size="sm" onClick={() => onTakeChat(selectedChat.id)}>
                Взять разговор
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => onReturnAi(selectedChat.id)}>
                Вернуть AI
              </Button>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            {selectedChat.activeAi
              ? `Диалог ведёт ${selectedChat.owner} · Последнее действие: ${selectedChat.lastAction}`
              : "Вы ведёте диалог · AI не отправляет сообщения"}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {selectedChat.messages.map((message) => (
            <div key={message.id} className={`flex ${message.author === "client" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                  message.author === "client"
                    ? "border-border bg-background/60 text-foreground"
                    : "border-primary/30 bg-primary/15 text-foreground"
                }`}
              >
                <p>{message.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{message.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={selectedChat.activeAi}
              placeholder={selectedChat.activeAi ? "Поле заблокировано: диалог ведёт AI" : "Напишите сообщение клиенту"}
            />
            <Button disabled={selectedChat.activeAi || draft.length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <aside className="border-l border-border p-4">
        <h3 className="font-semibold text-foreground">Аналитика чата</h3>
        <div className="mt-4 space-y-4">
          <section className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-foreground">Выжимка диалога</p>
              <Button variant="outline" size="sm" onClick={() => setShowSummary(true)}>
                Сгенерировать
              </Button>
            </div>
            {showSummary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedChat.summary}</p>}
          </section>
          <section className="rounded-xl border border-border bg-background/60 p-3">
            <p className="font-medium text-foreground">Ключевые моменты</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {selectedChat.facts.map((fact) => (
                <li key={fact}>• {fact}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-border bg-background/60 p-3">
            <p className="font-medium text-foreground">Настроение клиента</p>
            <p className="mt-2 text-sm text-primary">{selectedChat.sentiment}</p>
          </section>
          <section className="rounded-xl border border-border bg-background/60 p-3">
            <p className="font-medium text-foreground">Подсказки AI</p>
            <div className="mt-3 space-y-2">
              {selectedChat.aiHints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setDraft(hint)}
                  disabled={selectedChat.activeAi}
                  className="w-full rounded-lg border border-border p-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {hint}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

const NotificationsSection = ({ notifications }: { notifications: SteppeNotification[] }) => {
  const filters: Array<"Все" | SteppeNotification["type"]> = ["Все", "Критические", "Важные", "Информационные", "AI-события"];
  const [filter, setFilter] = useState<"Все" | SteppeNotification["type"]>("Все");
  const filtered = filter === "Все" ? notifications : notifications.filter((notification) => notification.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
              filter === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-2xl border p-4 shadow-card ${
              notification.type === "Критические" && !notification.read
                ? "border-destructive/40 bg-destructive/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <p className="font-medium text-foreground">{notification.title}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.description}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{notification.type}</p>
                <p className="mt-1">{notification.time}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const ContractsSection = () => (
  <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
    <div className="border-b border-border p-5">
      <h3 className="font-semibold text-foreground">Договоры и продления</h3>
      <p className="text-sm text-muted-foreground">Операционный список активных, истекающих и просроченных договоров.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Компания</th>
            <th className="px-4 py-3 font-medium">Ответственный</th>
            <th className="px-4 py-3 font-medium">Сумма</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Следующий шаг</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{contract.company}</td>
              <td className="px-4 py-3 text-muted-foreground">{contract.owner}</td>
              <td className="px-4 py-3 text-foreground">{formatTenge(contract.value)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {contract.status === "Истекает"
                  ? `Истекает через ${contract.expiresInDays} дней`
                  : contract.status === "Истёк"
                    ? `Истёк ${Math.abs(contract.expiresInDays)} дней назад`
                    : contract.status}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{contract.nextStep}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const SettingsSection = () => (
  <div className="grid gap-6 xl:grid-cols-2">
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold text-foreground">AI-эскалации</h3>
      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <p>• Передавать директору VIP-сделки больше 7 млн ₸ без ответа дольше 2 часов.</p>
        <p>• Передавать менеджеру диалог при раздражённом настроении клиента.</p>
        <p>• Предлагать апселл завтраков, трансфера и Deluxe, если бюджет выше 5 млн ₸.</p>
      </div>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold text-foreground">Профиль</h3>
      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <p>Пользователь: Ruslan Tszi</p>
        <p>Роль: Директор по маркетингу</p>
        <p>Доступ: операционный дашборд, AI-аналитика, все сделки и договоры</p>
      </div>
    </section>
  </div>
);

const DirectorAssistant = ({ deals, notifications }: { deals: SteppeDeal[]; notifications: SteppeNotification[] }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const closedRevenue = deals.filter((deal) => deal.stage === "closed").reduce((sum, deal) => sum + deal.amount, 0);
  const criticalUnread = notifications.filter((notification) => notification.type === "Критические" && !notification.read);
  const hotDeals = deals.filter((deal) => deal.urgency === "Горячий" && deal.stage !== "closed");
  const sourceRevenue = Array.from(new Set(deals.map((deal) => deal.source)))
    .map((source) => ({
      source,
      revenue: deals.filter((deal) => deal.source === source && deal.stage === "closed").reduce((sum, deal) => sum + deal.amount, 0),
    }))
    .sort((first, second) => second.revenue - first.revenue);

  const answerByPrompt = (prompt: string) => {
    if (prompt.includes("важного")) {
      return `Сегодня ${hotDeals.length} горячих сделок в работе. Главный риск — ${criticalUnread[0]?.title ?? "критических рисков нет"}. Закрытая выручка в базе демо: ${formatTenge(closedRevenue)}. AI L2 держит ответ 3–5 минут по VIP-чатам.`;
    }

    if (prompt.includes("проблемные")) {
      return `Проблемные сделки: АО «Казпочта» угрожает уйти к конкуренту из-за бюджета 3,8 млн ₸; Air Astana торгуется по раннему заезду; КазМунайГаз ждёт подтверждение приватного входа. Рекомендую взять Казпочту вручную и дать пакет без второго кофе-брейка.`;
    }

    if (prompt.includes("команда")) {
      return "На этой неделе AI L2 быстрее всех отвечает и закрывает inbound, Данияр ведёт самые крупные договоры, Айгерим стабильно доводит сделки до договора. Узкое место — ручные ответы по Air Astana: среднее время 22–26 минут.";
    }

    return `${sourceRevenue[0]?.source ?? "WhatsApp"} приносит больше всего закрытой выручки: ${formatTenge(sourceRevenue[0]?.revenue ?? 0)}. Самый маржинальный паттерн — WhatsApp → AI L2 → апселл Deluxe/трансфер, особенно для КазМунайГаз и Kaspi.kz.`;
  };

  const sendPrompt = (prompt: string) => {
    setMessages((current) => [...current, { role: "user", text: prompt }, { role: "assistant", text: answerByPrompt(prompt) }]);
  };

  const quickPrompts = [
    "Что важного произошло сегодня?",
    "Покажи проблемные сделки",
    "Как работает команда на этой неделе?",
    "Какой канал приносит больше всего выручки?",
  ];

  return (
    <>
      <Button className="fixed bottom-6 right-6 z-30 h-14 rounded-full px-5 shadow-elevated" onClick={() => setOpen(true)}>
        <Bot className="h-5 w-5" />
        AI-ассистент
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="dark flex w-full flex-col overflow-hidden sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>AI-ассистент директора</SheetTitle>
            <SheetDescription>Аналитика на основе mock-данных CRM.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendPrompt(prompt)}
                    className="w-full rounded-xl border border-border bg-card p-3 text-left text-sm text-foreground transition-colors hover:border-primary/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`rounded-2xl border p-3 text-sm leading-6 ${message.role === "assistant" ? "border-primary/20 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"}`}>
                    {message.text}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-2">
            {quickPrompts.map((prompt) => (
              <Button key={prompt} variant="outline" size="sm" onClick={() => sendPrompt(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const SteppeHotelCRM = ({ onLogout }: SteppeHotelCRMProps) => {
  const [activeSection, setActiveSection] = useState<SteppeSection>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [deals, setDeals] = useState(initialDeals);
  const [chats, setChats] = useState(initialChats);
  const activeAiDialogs = chats.filter((chat) => chat.activeAi).length;
  const unreadNotifications = steppeNotifications.filter((notification) => !notification.read).length;

  const takeDeal = (dealId: string) => {
    setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, owner: "Данияр Касымов" } : deal)));
  };

  const takeChat = (chatId: string) => {
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, activeAi: false, owner: "Данияр Касымов" } : chat)),
    );
  };

  const returnAi = (chatId: string) => {
    setChats((current) => current.map((chat) => (chat.id === chatId ? { ...chat, activeAi: true, owner: "AI L2" } : chat)));
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <SteppeSidebar
          activeSection={activeSection}
          collapsed={collapsed}
          activeAiDialogs={activeAiDialogs}
          unreadNotifications={unreadNotifications}
          onSectionChange={setActiveSection}
          onCollapse={() => setCollapsed((value) => !value)}
        />
        <div className="min-w-0 flex-1">
          <Header activeSection={activeSection} onLogout={onLogout} />
          <main className="p-8">
            {activeSection === "dashboard" && <DashboardSection deals={deals} chats={chats} period={period} onPeriodChange={setPeriod} />}
            {activeSection === "pipeline" && <PipelineSection deals={deals} onTakeDeal={takeDeal} />}
            {activeSection === "clients" && <ClientsSection deals={deals} />}
            {activeSection === "dialogs" && <DialogsSection chats={chats} onTakeChat={takeChat} onReturnAi={returnAi} />}
            {activeSection === "notifications" && <NotificationsSection notifications={steppeNotifications} />}
            {activeSection === "contracts" && <ContractsSection />}
            {activeSection === "settings" && <SettingsSection />}
          </main>
        </div>
      </div>
      <DirectorAssistant deals={deals} notifications={steppeNotifications} />
    </div>
  );
};

export default SteppeHotelCRM;
