import { ArrowUpRight, CircleAlert, CircleCheck, Clock3, Minus, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const statusClass = (status: string): string => {
  const lower = status.toLowerCase();
  if (
    lower.includes("critical") ||
    lower.includes("urgent") ||
    lower.includes("overdue") ||
    lower.includes("blocked") ||
    lower.includes("expired")
  )
    return "border-red-500/30 bg-red-500/10 text-red-300";
  if (
    lower.includes("due") ||
    lower.includes("risk") ||
    lower.includes("waiting") ||
    lower.includes("required") ||
    lower.includes("pending") ||
    lower.includes("attention")
  )
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (
    lower.includes("progress") ||
    lower.includes("scheduled") ||
    lower.includes("arriving") ||
    lower.includes("assigned")
  )
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (
    lower.includes("ready") ||
    lower.includes("complete") ||
    lower.includes("paid") ||
    lower.includes("live") ||
    lower.includes("resolved")
  )
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  return "border-border bg-secondary/50 text-muted-foreground";
};

export const StatusPill = ({ status, className }: { status: string; className?: string }) => (
  <Badge variant="outline" className={cn("font-medium", statusClass(status), className)}>
    {status}
  </Badge>
);

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export const KpiCard = ({
  label,
  value,
  detail,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warning" | "critical" | "info";
  icon?: ReactNode;
}) => {
  const toneClass =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "critical"
          ? "text-red-300"
          : tone === "info"
            ? "text-blue-300"
            : "text-primary";
  return (
    <Card className="border-border/80 bg-card/80 p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className={cn("rounded-lg bg-secondary/80 p-1.5", toneClass)}>{icon}</span>}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className={cn("mt-1 text-xs", toneClass)}>{detail}</p>
    </Card>
  );
};

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
    <p className="font-medium text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

export const FeedRow = ({
  title,
  description,
  meta,
  status,
  onClick,
}: {
  title: string;
  description: string;
  meta: string;
  status?: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-secondary/30"
  >
    <span className="mt-1 rounded-full bg-primary/15 p-1.5 text-primary">
      <ArrowUpRight className="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {status && <StatusPill status={status} />}
      </span>
      <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      <span className="mt-1 block text-[11px] text-muted-foreground/80">{meta}</span>
    </span>
  </button>
);

export const MetricIcon = ({ kind }: { kind: "up" | "clock" | "alert" | "check" | "flat" }) => {
  if (kind === "up") return <TrendingUp className="h-4 w-4" />;
  if (kind === "clock") return <Clock3 className="h-4 w-4" />;
  if (kind === "alert") return <CircleAlert className="h-4 w-4" />;
  if (kind === "check") return <CircleCheck className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

/** Labeled form field — the wrapping label associates the caption with the control inside. */
export const Field = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <Label className={cn("block space-y-1.5", className)}>
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    {children}
  </Label>
);

/** Styled native select — keeps change events and label association working. */
export const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const DIRECTION_LABELS: Record<string, string> = {
  PROPERTY_MANAGEMENT: "Управление недв.",
  SNAGGING: "Snagging",
  STAGING: "Staging",
  UNCLASSIFIED: "Требует проверки",
};

const LEAD_STAGE_LABELS: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  qualified: "Квалифицирован",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Подписан",
  lost: "Не реализовано",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Черновик",
  CONFIRMED: "Подтверждён",
  IN_PROGRESS: "В работе",
  ON_HOLD: "На паузе",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  PREPAYMENT: "Предоплата",
  PARTIAL: "Частичная",
  FINAL: "Финальная",
  REFUND: "Возврат",
  OTHER: "Другое",
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  FOLLOW_UP: "Follow-up",
  CALL: "Звонок",
  SEND_PROPOSAL: "Отправить КП",
  NEGOTIATE: "Переговоры",
  SITE_VISIT: "Выезд на объект",
  WAITING_CLIENT: "Ждём клиента",
  WAITING_PAYMENT: "Ждём оплату",
  PAYMENT_RECEIVED: "Оплата получена",
  CREATE_PROJECT: "Создать проект",
  OTHER: "Другое",
};

const PRIORITY_LABELS: Record<string, string> = {
  Low: "Низкий",
  Medium: "Средний",
  High: "Высокий",
  Urgent: "Срочный",
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

const pretty = (value: string) =>
  value.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export const directionLabel = (value: string) => DIRECTION_LABELS[value] ?? pretty(value);
export const leadStageLabel = (value: string) => LEAD_STAGE_LABELS[value] ?? pretty(value);
export const projectStatusLabel = (value: string) => PROJECT_STATUS_LABELS[value] ?? pretty(value);
export const paymentTypeLabel = (value: string) => PAYMENT_TYPE_LABELS[value] ?? pretty(value);
export const nextActionLabel = (value: string) => NEXT_ACTION_LABELS[value] ?? pretty(value);
export const priorityLabel = (value: string) => PRIORITY_LABELS[value] ?? value;

/** Direction pill with a consistent per-direction tint. */
export const DirectionPill = ({ direction }: { direction: string }) => {
  const tone =
    direction === "SNAGGING"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
      : direction === "STAGING"
        ? "border-violet-500/30 bg-violet-500/10 text-violet-700"
        : direction === "PROPERTY_MANAGEMENT"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700";
  return <Badge variant="outline" className={cn("font-medium", tone)}>{directionLabel(direction)}</Badge>;
};

/** Money display: unset amounts render as a muted zero so they don't draw attention. */
export const moneyLabel = (amount: string | null, currency: string) =>
  amount == null
    ? <span className="text-muted-foreground/70">{currency} 0</span>
    : <>{currency} {Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}</>;
