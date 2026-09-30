import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateLead } from "@/contexts/CreateLeadContext";
import {
  fetchLiveLeadClassifications,
  LEAD_PROPERTY_TYPES,
  type LiveLeadClassification,
} from "@/lib/paterhausConversationsApi";

interface LiveOwnerPipelineModuleProps {
  email: string;
}

/** `leadType` is the PROPERTY type; legacy identity values are shown as "Other". */
const PROPERTY_TYPE_LABELS: Record<string, string> = Object.fromEntries([
  ["flat", "Квартира"],
  ["apartment", "Квартира"],
  ["villa", "Вилла"],
  ["townhouse", "Таунхаус"],
  ["studio", "Студия"],
  ["owner", "Другое"],
  ["guest", "Другое"],
  ["partner", "Другое"],
  ["unknown", "Другое"],
]);

const STAGE_LABELS: Record<string, string> = {
  new: "Новый",
  talking: "В диалоге",
  qualified: "Квалифицирован",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Подписан",
  lost: "Отказ",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

const WORK_TYPE_LABELS: Record<string, string> = {
  staging: "Staging",
  snagging: "Snagging",
  property_management: "Управление недв.",
  "property management": "Управление недв.",
};

const PRIORITY_TONES: Record<string, string> = {
  low: "border-slate-500/40 text-slate-300",
  medium: "border-sky-500/40 text-sky-300",
  high: "border-amber-500/40 text-amber-300",
  urgent: "border-destructive/50 text-destructive",
};

/** Keeps unknown backend values visible instead of hiding them behind a fallback. */
const label = (dictionary: Record<string, string>, value: string | null, empty = "—"): string => {
  if (!value?.trim()) return empty;
  return dictionary[value.trim().toLowerCase()] ?? value;
};

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Urgent > High > Medium > Low, then most recently updated first (mirrors the backend order). */
export const sortLeadClassifications = (
  items: readonly LiveLeadClassification[],
): LiveLeadClassification[] =>
  [...items].sort((a, b) => {
    const rank =
      (PRIORITY_RANK[(a.priority ?? "").trim().toLowerCase()] ?? 4) -
      (PRIORITY_RANK[(b.priority ?? "").trim().toLowerCase()] ?? 4);
    if (rank !== 0) return rank;
    const updated = Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? "");
    if (!Number.isNaN(updated) && updated !== 0) return updated;
    return b.id - a.id;
  });

export const formatDubaiTimestamp = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const LiveOwnerPipelineModule = ({ email }: LiveOwnerPipelineModuleProps) => {
  const [items, setItems] = useState<LiveLeadClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { canCreateLead, openCreateLead, leadCreatedTick } = useCreateLead();
  const requestActive = useRef(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (requestActive.current) return;
      requestActive.current = true;
      const currentRequest = ++requestId.current;
      try {
        const response = await fetchLiveLeadClassifications(email, signal);
        if (currentRequest !== requestId.current) return;
        setItems(sortLeadClassifications(response.items));
        setError(null);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (currentRequest === requestId.current) {
          setError("Live lead classifications are temporarily unavailable.");
        }
      } finally {
        if (currentRequest === requestId.current) {
          requestActive.current = false;
          setLoading(false);
        }
      }
    },
    [email],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(controller.signal);
    }, 30_000);

    return () => {
      controller.abort();
      window.clearInterval(poll);
      requestId.current += 1;
      requestActive.current = false;
    };
  }, [load]);

  /**
   * Refresh Owner Pipeline data immediately after a lead is created from either
   * entry point (global Create action or this module). Skips the initial tick (0)
   * so the first mount load above is not duplicated.
   */
  useEffect(() => {
    if (leadCreatedTick === 0) return;
    void load();
  }, [leadCreatedTick, load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      `${item.displayName} ${item.number ?? ""} ${item.email ?? ""} ${item.summary ?? ""} ${
        item.leadType ?? ""
      } ${item.stage ?? ""} ${item.workType ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [items, query]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Актуальные AI-классификации
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Воронка обращений</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск лидов…"
              className="w-56 pl-9"
            />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Обновить
          </Button>
          {canCreateLead && (
            <Button type="button" size="sm" onClick={openCreateLead}>
              <Plus className="h-4 w-4" /> Создать лид
            </Button>
          )}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error && items.length === 0 ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive"
        >
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Повторить
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "Пока нет лидов"
            : "Нет лидов, соответствующих поиску"}
        </div>
      ) : (
        <div className="space-y-3">
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {filtered.map((item) => (
            <Card
              key={item.id}
              data-testid={`live-classification-${item.id}`}
              className="border-border bg-card/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{item.displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.number ?? item.chatId ?? "Без номера"}
                    <span className="mx-1.5">·</span>
                    <span data-testid={`live-classification-${item.id}-email`}>
                      {item.email ?? "Не указан"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" title="Тип объекта">
                    {label(PROPERTY_TYPE_LABELS, item.leadType, "Другое")}
                  </Badge>
                  <Badge variant="outline">{label(STAGE_LABELS, item.stage)}</Badge>
                  <Badge
                    variant="outline"
                    className={PRIORITY_TONES[(item.priority ?? "").trim().toLowerCase()] ?? ""}
                  >
                    {label(PRIORITY_LABELS, item.priority)}
                  </Badge>
                  <Badge variant="outline" title="Услуга">
                    {label(WORK_TYPE_LABELS, item.workType, "Не указана")}
                  </Badge>
                </div>
              </div>

              {item.summary && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground">
                <span>Создано: {formatDubaiTimestamp(item.createdAt)}</span>
                <span>Обновлено: {formatDubaiTimestamp(item.updatedAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
