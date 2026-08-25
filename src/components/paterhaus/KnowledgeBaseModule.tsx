import { useMemo, useState } from "react";
import { BookOpenText, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePaterhausWorkspace, type NewKnowledgeItemInput } from "@/contexts/PaterhausWorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  knowledgeCategoryLabels,
  knowledgeTypeLabels,
  knowledgeUsedFor,
  type KnowledgeCategory,
  type KnowledgeItem,
} from "@/data/paterhaus/knowledgeBase";
import { EmptyState, KpiCard, MetricIcon, SectionHeader, StatusPill } from "./shared";

const emptyForm: NewKnowledgeItemInput = {
  title: "",
  category: "general",
  type: "guide",
  summary: "",
  tags: [],
};

export const KnowledgeBaseModule = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const { knowledgeItems } = workspace;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | KnowledgeCategory>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | KnowledgeItem["status"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [copilotDemo, setCopilotDemo] = useState(false);
  const selected = knowledgeItems.find((item) => item.id === selectedId) ?? null;

  const allTags = useMemo(
    () => Array.from(new Set(knowledgeItems.flatMap((item) => item.tags))).sort(),
    [knowledgeItems],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return knowledgeItems
      .filter((item) => categoryFilter === "all" || item.category === categoryFilter)
      .filter((item) => tagFilter === "all" || item.tags.includes(tagFilter))
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalized));
  }, [knowledgeItems, query, categoryFilter, tagFilter, statusFilter]);

  const linkedEntityLabel = (item: KnowledgeItem): string | null => {
    if (item.linkedPropertyId) {
      const property = workspace.properties.find((entry) => entry.id === item.linkedPropertyId);
      if (property) return property.name;
    }
    if (item.linkedOwnerId) {
      const owner = workspace.owners.find((entry) => entry.id === item.linkedOwnerId);
      if (owner) return owner.name;
    }
    if (item.linkedVendorId) {
      const vendor = workspace.vendors.find((entry) => entry.id === item.linkedVendorId);
      if (vendor) return vendor.name;
    }
    return null;
  };

  const submitKnowledge = () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    workspace.addKnowledgeItem({
      ...form,
      title: form.title.trim(),
      summary: form.summary.trim(),
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setShowAdd(false);
    setForm(emptyForm);
    setTagsInput("");
    toast.success(t("knowledge.itemAdded"));
  };

  const filterSelectClass = "h-9 rounded-md border border-input bg-background px-2 text-xs";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Intelligence"
        title="Knowledge Base"
        description="Central operating knowledge used by the team and the Ops Copilot to answer questions and draft responses."
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Add knowledge
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Active knowledge items"
          value={`${knowledgeItems.filter((item) => item.status === "active").length}`}
          detail="Available to the Ops Copilot"
          icon={<MetricIcon kind="check" />}
        />
        <KpiCard
          label="SOPs"
          value={`${knowledgeItems.filter((item) => item.type === "sop").length}`}
          detail="Standard operating procedures"
          tone="info"
          icon={<MetricIcon kind="flat" />}
        />
        <KpiCard
          label="Property-specific records"
          value={`${knowledgeItems.filter((item) => item.linkedPropertyId || item.linkedOwnerId).length}`}
          detail="Linked to properties or owners"
          icon={<MetricIcon kind="up" />}
        />
        <KpiCard
          label="Needs review"
          value={`${knowledgeItems.filter((item) => item.status === "needs_review").length}`}
          detail="Flagged for a content refresh"
          tone="warning"
          icon={<MetricIcon kind="alert" />}
        />
      </div>
      <Card className="border-border/80 bg-card/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search knowledge items"
              className="pl-9"
            />
          </div>
          <select aria-label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)} className={filterSelectClass}>
            <option value="all">All categories</option>
            {(Object.keys(knowledgeCategoryLabels) as KnowledgeCategory[]).map((category) => (
              <option key={category} value={category}>{knowledgeCategoryLabels[category]}</option>
            ))}
          </select>
          <select aria-label="Tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className={filterSelectClass}>
            <option value="all">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <select aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className={filterSelectClass}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="needs_review">Needs review</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No knowledge items match" description="Adjust the search or filters to see records." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const linked = linkedEntityLabel(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setCopilotDemo(false);
                  }}
                  className="rounded-xl border border-border/70 bg-background/40 p-4 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="font-medium leading-5 text-foreground">{item.title}</span>
                    </span>
                    {item.status === "needs_review" && <StatusPill status="Needs review" />}
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{item.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="border-primary/30 text-[11px] text-primary">
                      {knowledgeTypeLabels[item.type]}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      {knowledgeCategoryLabels[item.category]}
                    </Badge>
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px] text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    Updated {item.lastUpdated} · {item.updatedBy}
                    {linked ? ` · ${linked}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </Card>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="dark max-h-[85vh] overflow-y-auto border-border bg-background">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {knowledgeCategoryLabels[selected.category]} · {knowledgeTypeLabels[selected.type]} · Updated {selected.lastUpdated} by {selected.updatedBy}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Key instructions</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{selected.summary}</p>
              </div>
              {linkedEntityLabel(selected) && (
                <div className="rounded-xl border border-border/70 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Linked entity</p>
                  <p className="mt-1 text-sm text-foreground">{linkedEntityLabel(selected)}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[11px] text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Used by AI for</p>
                <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                  {knowledgeUsedFor.map((use) => (
                    <li key={use}>{use}</li>
                  ))}
                </ul>
              </div>
              {copilotDemo && (
                <div className="rounded-xl border border-primary/25 bg-background/60 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ops Copilot
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">Q: How should the team apply "{selected.title}"?</p>
                  <p className="mt-1 text-sm leading-6 text-foreground">
                    {selected.summary} Follow this record as the source of truth; if the situation is not covered, escalate per the escalation matrix and flag the item for review.
                  </p>
                </div>
              )}
              <DialogFooter className="flex-wrap gap-2">
                {selected.status === "needs_review" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      workspace.updateKnowledgeItem(selected.id, { status: "active" });
                      toast.success("Knowledge item marked as reviewed and active.");
                    }}
                  >
                    Mark reviewed
                  </Button>
                )}
                <Button onClick={() => setCopilotDemo(true)}>
                  <Sparkles className="h-4 w-4" />
                  Ask Ops Copilot about this
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="dark max-h-[85vh] overflow-y-auto border-border bg-background">
          <DialogHeader>
            <DialogTitle>{t("knowledge.addTitle")}</DialogTitle>
            <DialogDescription>{t("knowledge.addDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder={t("knowledge.titlePlaceholder")}
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                aria-label={t("knowledge.categoryLabel")}
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as KnowledgeCategory }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {(Object.keys(knowledgeCategoryLabels) as KnowledgeCategory[]).map((category) => (
                  <option key={category} value={category}>{knowledgeCategoryLabels[category]}</option>
                ))}
              </select>
              <select
                aria-label={t("knowledge.typeLabel")}
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as KnowledgeItem["type"] }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {(Object.keys(knowledgeTypeLabels) as KnowledgeItem["type"][]).map((type) => (
                  <option key={type} value={type}>{knowledgeTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <textarea
              aria-label={t("knowledge.summaryLabel")}
              placeholder={t("knowledge.summaryPlaceholder")}
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              className="min-h-24 rounded-md border border-input bg-background p-3 text-sm"
            />
            <Input
              placeholder={t("knowledge.tagsPlaceholder")}
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
            <select
              aria-label={t("knowledge.linkedPropertyLabel")}
              value={form.linkedPropertyId ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, linkedPropertyId: event.target.value || undefined }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("knowledge.noLinkedProperty")}</option>
              {workspace.properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {t("knowledge.cancel")}
            </Button>
            <Button onClick={submitKnowledge} disabled={!form.title.trim() || !form.summary.trim()}>
              {t("knowledge.addItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
