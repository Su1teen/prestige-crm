import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpenText,
  CheckCircle2,
  FileCode,
  FileImage,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
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
  knowledgeFormatLabels,
  knowledgeSyncLabels,
  knowledgeTypeLabels,
  knowledgeUsedFor,
  type KnowledgeCategory,
  type KnowledgeFormat,
  type KnowledgeItem,
  type KnowledgeSyncStatus,
} from "@/data/paterhaus/knowledgeBase";
import { EmptyState, KpiCard, MetricIcon, SectionHeader, StatusPill } from "./shared";

const emptyForm: NewKnowledgeItemInput = {
  title: "",
  category: "general",
  type: "guide",
  summary: "",
  content: "",
  format: "markdown",
  tags: [],
};

const formatFromFileName = (fileName: string): KnowledgeFormat => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".txt")) return "text";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return "image";
  return "file";
};

const FormatIcon = ({ format }: { format: KnowledgeFormat }) =>
  format === "image" ? (
    <FileImage className="h-4 w-4 flex-shrink-0 text-pink-300" />
  ) : format === "markdown" || format === "text" ? (
    <FileCode className="h-4 w-4 flex-shrink-0 text-primary" />
  ) : (
    <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
  );

const syncStatusClass = (status: KnowledgeSyncStatus): string =>
  status === "synced"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : status === "processing"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-red-500/40 bg-red-500/10 text-red-300";

/** Minimal, safe markdown renderer for .md knowledge previews. */
const renderInline = (text: string, keyBase: string): ReactNode => {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b-${i}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`${keyBase}-c-${i}`} className="rounded bg-secondary px-1 py-0.5 font-mono text-[12px] text-foreground">
          {match[3]}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
    i += 1;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const MarkdownPreview = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let list: ReactNode[] | null = null;
  let codeBuffer: string[] | null = null;
  let key = 0;

  const flushList = () => {
    if (list) {
      const items = list;
      blocks.push(
        <ul key={`ul-${key}`} className="my-1 list-inside list-disc space-y-1 text-sm leading-6 text-foreground">
          {items}
        </ul>,
      );
      list = null;
    }
  };
  const flushCode = () => {
    if (codeBuffer) {
      const code = codeBuffer.join("\n");
      blocks.push(
        <pre key={`pre-${key}`} className="my-2 overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-5 text-foreground">
          <code>{code}</code>
        </pre>,
      );
      codeBuffer = null;
      key += 1;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (codeBuffer) {
        flushCode();
      } else {
        flushList();
        codeBuffer = [];
      }
      continue;
    }
    if (codeBuffer) {
      codeBuffer.push(line);
      continue;
    }
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2], `h-${key}`);
      const className =
        level <= 1
          ? "mt-3 text-base font-semibold text-foreground"
          : level === 2
            ? "mt-3 text-sm font-semibold text-foreground"
            : "mt-2 text-sm font-medium text-foreground";
      blocks.push(
        level <= 3 ? (
          <p key={`h-${key}`} className={className}>
            {text}
          </p>
        ) : (
          <p key={`h-${key}`} className="mt-2 text-sm font-medium text-foreground">
            {text}
          </p>
        ),
      );
      key += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const itemText = renderInline(line.replace(/^\s*[-*]\s+/, ""), `li-${key}`);
      list = list ?? [];
      list.push(
        <li key={`li-${key}`} className="text-sm leading-6 text-foreground">
          {itemText}
        </li>,
      );
      key += 1;
      continue;
    }
    flushList();
    if (line.trim() === "") {
      blocks.push(<div key={`br-${key}`} className="h-2" />);
      key += 1;
      continue;
    }
    blocks.push(
      <p key={`p-${key}`} className="text-sm leading-6 text-foreground">
        {renderInline(line, `p-${key}`)}
      </p>,
    );
    key += 1;
  }
  flushList();
  flushCode();
  return <div className="space-y-0.5">{blocks}</div>;
};

export const KnowledgeBaseModule = () => {
  const workspace = usePaterhausWorkspace();
  const { t } = useLanguage();
  const { knowledgeItems } = workspace;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | KnowledgeCategory>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | KnowledgeItem["status"]>("all");
  const [formatFilter, setFormatFilter] = useState<"all" | KnowledgeFormat>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tagsInput, setTagsInput] = useState("");
  const [copilotDemo, setCopilotDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      .filter((item) => formatFilter === "all" || (item.format ?? "text") === formatFilter)
      .filter((item) => `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalized));
  }, [knowledgeItems, query, categoryFilter, tagFilter, statusFilter, formatFilter]);

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
      content: form.content?.trim() || undefined,
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

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const format = formatFromFileName(file.name);
    const sizeLabel = file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    const baseInput: NewKnowledgeItemInput = {
      title: file.name,
      category: "general",
      type: "guide",
      summary: `Uploaded document "${file.name}" added to the knowledge base for the Ops Copilot.`,
      tags: ["uploaded", format === "markdown" ? "markdown" : "document"],
      format,
      fileName: file.name,
      fileSize: sizeLabel,
      syncStatus: "processing",
    };
    // For text/markdown files, read the contents so the preview is realistic.
    if (format === "markdown" || format === "text") {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === "string" ? reader.result : "";
        workspace.addKnowledgeItem({ ...baseInput, content: text, summary: text.slice(0, 160) || baseInput.summary });
        toast.success(`"${file.name}" uploaded and indexing for the AI agent.`);
      };
      reader.onerror = () => {
        workspace.addKnowledgeItem(baseInput);
        toast.success(`"${file.name}" uploaded and indexing for the AI agent.`);
      };
      reader.readAsText(file);
    } else {
      workspace.addKnowledgeItem(baseInput);
      toast.success(`"${file.name}" uploaded and indexing for the AI agent.`);
    }
    // Reset the input so the same file can be re-selected later.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filterSelectClass = "h-9 rounded-md border border-input bg-background px-2 text-xs";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Intelligence"
        title="Knowledge Base"
        description="Central operating knowledge used by the team and the Ops Copilot to answer questions and draft responses. Upload documents or write manuals — everything is indexed for the AI agent."
        action={
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" className="hidden" accept=".md,.markdown,.txt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.doc,.docx" onChange={handleUploadFile} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              Upload file
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />
              Add knowledge
            </Button>
          </div>
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
          label="Indexed documents"
          value={`${knowledgeItems.filter((item) => (item.syncStatus ?? "synced") === "synced").length}`}
          detail="Synced to the vector store"
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
          value={`${knowledgeItems.filter((item) => item.status === "needs_review" || item.syncStatus === "processing").length}`}
          detail="Flagged for a content refresh or still indexing"
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
          <select aria-label="Format" value={formatFilter} onChange={(event) => setFormatFilter(event.target.value as typeof formatFilter)} className={filterSelectClass}>
            <option value="all">All formats</option>
            {(Object.keys(knowledgeFormatLabels) as KnowledgeFormat[]).map((format) => (
              <option key={format} value={format}>{knowledgeFormatLabels[format]}</option>
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
              const format = item.format ?? "text";
              const sync = item.syncStatus ?? "synced";
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
                    <span className="flex min-w-0 items-center gap-2">
                      <FormatIcon format={format} />
                      <span className="truncate font-medium leading-5 text-foreground">{item.title}</span>
                    </span>
                    <span className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${syncStatusClass(sync)}`}>
                      {sync === "processing" ? <Loader2 className="h-3 w-3 animate-spin" /> : sync === "synced" ? <CheckCircle2 className="h-3 w-3" /> : null}
                      {knowledgeSyncLabels[sync]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{item.summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="border-primary/30 text-[11px] text-primary">
                      {knowledgeTypeLabels[item.type]}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      {knowledgeFormatLabels[format]}
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
                    {item.fileName ? ` · ${item.fileName}` : ""}
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
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <FormatIcon format={selected.format ?? "text"} />
                  {selected.title}
                </DialogTitle>
                <DialogDescription>
                  {knowledgeCategoryLabels[selected.category]} · {knowledgeTypeLabels[selected.type]} · Updated {selected.lastUpdated} by {selected.updatedBy}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${syncStatusClass(selected.syncStatus ?? "synced")}`}>
                  {selected.syncStatus === "processing" ? <Loader2 className="h-3 w-3 animate-spin" /> : selected.syncStatus === "synced" || !selected.syncStatus ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {knowledgeSyncLabels[selected.syncStatus ?? "synced"]}
                </span>
                <Badge variant="outline" className="text-[11px] text-muted-foreground">
                  {knowledgeFormatLabels[selected.format ?? "text"]}
                </Badge>
                {selected.fileName && (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                    <FileText className="mr-1 h-3 w-3" />
                    {selected.fileName}
                    {selected.fileSize ? ` · ${selected.fileSize}` : ""}
                  </Badge>
                )}
                {selected.status === "needs_review" && <StatusPill status="Needs review" />}
              </div>
              <div className="rounded-xl border border-border/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Summary</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{selected.summary}</p>
              </div>
              {selected.content && (selected.format ?? "text") === "markdown" && (
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Document preview</p>
                  <div className="mt-2 max-h-[40vh] overflow-y-auto">
                    <MarkdownPreview content={selected.content} />
                  </div>
                </div>
              )}
              {selected.content && (selected.format ?? "text") === "text" && (
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Content</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground">{selected.content}</p>
                </div>
              )}
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
                {selected.syncStatus === "processing" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      workspace.updateKnowledgeItem(selected.id, { syncStatus: "synced" });
                      toast.success("Document indexed and synced to the vector store.");
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as synced
                  </Button>
                )}
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
            <div className="grid grid-cols-2 gap-3">
              <select
                aria-label="Format"
                value={form.format ?? "markdown"}
                onChange={(event) => setForm((current) => ({ ...current, format: event.target.value as KnowledgeFormat }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {(Object.keys(knowledgeFormatLabels) as KnowledgeFormat[]).map((format) => (
                  <option key={format} value={format}>{knowledgeFormatLabels[format]}</option>
                ))}
              </select>
              <Input
                placeholder={t("knowledge.tagsPlaceholder")}
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </div>
            <textarea
              aria-label={t("knowledge.summaryLabel")}
              placeholder={t("knowledge.summaryPlaceholder")}
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              className="min-h-20 rounded-md border border-input bg-background p-3 text-sm"
            />
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">Content (markdown supported)</p>
              <textarea
                aria-label="Content"
                placeholder="Write the full manual or SOP body here. Markdown headings (#), lists (-) and **bold** are supported in the preview."
                value={form.content ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                className="min-h-40 rounded-md border border-input bg-background p-3 font-mono text-sm leading-6"
              />
            </div>
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
              <Upload className="h-4 w-4" />
              {t("knowledge.addItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
