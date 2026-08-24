import { useCallback, useMemo, useState } from "react";
import { Download, FileImage, FileText, FileUp, Search, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
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
import { usePaterhausWorkspace } from "@/contexts/PaterhausWorkspaceContext";
import {
  fileCategoryLabels,
  fileEntityLabels,
  fileSourceLabels,
  missingDocuments,
  type DemoFile,
  type FileCategory,
  type FileEntityType,
  type FileSource,
} from "@/data/paterhaus/files";
import { EmptyState, KpiCard, MetricIcon, SectionHeader, StatusPill } from "./shared";

const reviewLabels: Record<DemoFile["reviewStatus"], string> = {
  reviewed: "Reviewed",
  needs_review: "Needs review",
  missing_context: "Missing context",
};

const formatSize = (sizeKb: number) => (sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);

const FileIcon = ({ file }: { file: DemoFile }) =>
  file.type === "image" ? (
    <FileImage className="h-4 w-4 text-pink-300" />
  ) : (
    <FileText className="h-4 w-4 text-primary" />
  );

export const FilesHubModule = ({ onOpenProperty }: { onOpenProperty?: (propertyId: string) => void }) => {
  const workspace = usePaterhausWorkspace();
  const { files } = workspace;
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<"all" | FileEntityType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | FileCategory>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | FileSource>("all");
  const [reviewFilter, setReviewFilter] = useState<"all" | DemoFile["reviewStatus"]>("all");
  const [importantOnly, setImportantOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = files.find((file) => file.id === selectedId) ?? null;

  const linkedLabel = useCallback((file: DemoFile): string => {
    if (file.leadId) {
      const lead = workspace.opportunities.find((item) => item.id === file.leadId);
      if (lead) return lead.ownerName;
    }
    if (file.ownerId) {
      const owner = workspace.owners.find((item) => item.id === file.ownerId);
      if (owner) return owner.name;
    }
    if (file.guestId) {
      const guest = workspace.guests.find((item) => item.id === file.guestId);
      if (guest) return guest.name;
    }
    if (file.vendorId) {
      const vendor = workspace.vendors.find((item) => item.id === file.vendorId);
      if (vendor) return vendor.name;
    }
    if (file.propertyId) {
      const property = workspace.properties.find((item) => item.id === file.propertyId);
      if (property) return property.name;
    }
    return "General";
  }, [workspace.opportunities, workspace.owners, workspace.guests, workspace.vendors, workspace.properties]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return files
      .filter((file) => entityFilter === "all" || file.entityType === entityFilter)
      .filter((file) => categoryFilter === "all" || file.category === categoryFilter)
      .filter((file) => sourceFilter === "all" || file.source === sourceFilter)
      .filter((file) => reviewFilter === "all" || file.reviewStatus === reviewFilter)
      .filter((file) => !importantOnly || file.isImportant)
      .filter((file) => `${file.name} ${linkedLabel(file)}`.toLowerCase().includes(normalized));
  }, [files, query, entityFilter, categoryFilter, sourceFilter, reviewFilter, importantOnly, linkedLabel]);

  const kpis = [
    { label: "Total Files", value: `${files.length}`, detail: "Across leads, owners, guests and properties", icon: <MetricIcon kind="flat" /> },
    { label: "Needs Review", value: `${files.filter((file) => file.reviewStatus !== "reviewed").length}`, detail: "Awaiting a team check", tone: "warning" as const, icon: <MetricIcon kind="clock" /> },
    { label: "Important Documents", value: `${files.filter((file) => file.isImportant).length}`, detail: "Flagged as critical", tone: "info" as const, icon: <MetricIcon kind="up" /> },
    { label: "Files from WhatsApp", value: `${files.filter((file) => file.source === "whatsapp").length}`, detail: "Received in chat threads", icon: <MetricIcon kind="check" /> },
    { label: "Missing Documents", value: `${missingDocuments.length}`, detail: "Required but not on file", tone: "critical" as const, icon: <MetricIcon kind="alert" /> },
  ];

  const uploadDemoFile = () => {
    workspace.addFile({
      name: `Uploaded_Document_${files.length + 1}.pdf`,
      type: "document",
      sizeKb: 640,
      category: "other",
      source: "manual_upload",
      entityType: "general",
      description: "Demo upload from the Files Hub.",
    });
    toast.success("Demo file uploaded to the hub.");
  };

  const uploadNewVersion = (file: DemoFile) => {
    workspace.addFile({
      name: file.name.replace(/(\.[a-z]+)$/i, "_v2$1"),
      type: file.type,
      sizeKb: file.sizeKb,
      category: file.category,
      source: "manual_upload",
      entityType: file.entityType,
      leadId: file.leadId,
      ownerId: file.ownerId,
      guestId: file.guestId,
      propertyId: file.propertyId,
      vendorId: file.vendorId,
      taskId: file.taskId,
      description: `New version of ${file.name}.`,
    });
    toast.success("New version added as a separate demo record.");
  };

  const filterSelectClass = "h-9 rounded-md border border-input bg-background px-2 text-xs";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Document control"
        title="Files & Documents"
        description="All documents linked to leads, owners, guests, properties and operations."
        action={
          <Button onClick={uploadDemoFile}>
            <FileUp className="h-4 w-4" />
            Upload file
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} detail={kpi.detail} tone={kpi.tone} icon={kpi.icon} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="border-border/80 bg-card/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search files or linked entities"
                className="pl-9"
              />
            </div>
            <select aria-label="Entity" value={entityFilter} onChange={(event) => setEntityFilter(event.target.value as typeof entityFilter)} className={filterSelectClass}>
              <option value="all">All entities</option>
              {(Object.keys(fileEntityLabels) as FileEntityType[]).map((entity) => (
                <option key={entity} value={entity}>{fileEntityLabels[entity]}</option>
              ))}
            </select>
            <select aria-label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)} className={filterSelectClass}>
              <option value="all">All categories</option>
              {(Object.keys(fileCategoryLabels) as FileCategory[]).map((category) => (
                <option key={category} value={category}>{fileCategoryLabels[category]}</option>
              ))}
            </select>
            <select aria-label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)} className={filterSelectClass}>
              <option value="all">All sources</option>
              {(Object.keys(fileSourceLabels) as FileSource[]).map((source) => (
                <option key={source} value={source}>{fileSourceLabels[source]}</option>
              ))}
            </select>
            <select aria-label="Review status" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as typeof reviewFilter)} className={filterSelectClass}>
              <option value="all">All statuses</option>
              <option value="reviewed">Reviewed</option>
              <option value="needs_review">Needs review</option>
              <option value="missing_context">Missing context</option>
            </select>
            <Button
              type="button"
              size="sm"
              variant={importantOnly ? "secondary" : "ghost"}
              onClick={() => setImportantOnly((current) => !current)}
            >
              <Star className="h-4 w-4" />
              Important only
            </Button>
          </div>
          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No files match" description="Adjust the search or filters to see documents." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">File</th>
                    <th className="px-3 py-2 font-medium">Linked to</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">Category</th>
                    <th className="hidden px-3 py-2 font-medium lg:table-cell">Source</th>
                    <th className="hidden px-3 py-2 font-medium lg:table-cell">Uploaded</th>
                    <th className="px-3 py-2 font-medium">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((file) => (
                    <tr
                      key={file.id}
                      onClick={() => setSelectedId(file.id)}
                      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40"
                    >
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <FileIcon file={file} />
                          <span className="max-w-[220px] truncate">{file.name}</span>
                          {file.isImportant && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-foreground">
                        <span className="block max-w-[160px] truncate">{linkedLabel(file)}</span>
                        <span className="text-[11px] text-muted-foreground">{fileEntityLabels[file.entityType]}</span>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <StatusPill status={fileCategoryLabels[file.category]} />
                      </td>
                      <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">{fileSourceLabels[file.source]}</td>
                      <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                        {file.uploadedAt}
                        <span className="block text-[11px]">{file.uploadedBy}</span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={reviewLabels[file.reviewStatus]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="h-fit border-border/80 bg-card/70 p-4">
          <h3 className="font-medium text-foreground">Missing / Required Documents</h3>
          <p className="mt-1 text-xs text-muted-foreground">Documents the workspace expects but has not received yet.</p>
          <ul className="mt-3 space-y-2">
            {missingDocuments.map((item) => (
              <li key={item.id} className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5">
                <p className="text-sm font-medium text-foreground">{item.entityLabel}</p>
                <p className="text-xs text-muted-foreground">{item.documentLabel}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="dark max-h-[85vh] overflow-y-auto border-border bg-background">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileIcon file={selected} />
                  <span className="break-all">{selected.name}</span>
                </DialogTitle>
                <DialogDescription>
                  {fileCategoryLabels[selected.category]} · {fileSourceLabels[selected.source]} · {formatSize(selected.sizeKb)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20">
                {selected.type === "image" ? (
                  <FileImage className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded by</p>
                  <p className="text-foreground">{selected.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded date</p>
                  <p className="text-foreground">{selected.uploadedAt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Linked entity</p>
                  <p className="text-foreground">{linkedLabel(selected)} ({fileEntityLabels[selected.entityType]})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Review status</p>
                  <StatusPill status={reviewLabels[selected.reviewStatus]} />
                </div>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm text-foreground">{selected.description}</p>
                </div>
              )}
              {selected.aiSummary && (
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">AI summary</p>
                  <p className="mt-1 text-sm leading-6 text-foreground">{selected.aiSummary}</p>
                </div>
              )}
              <DialogFooter className="flex-wrap gap-2">
                {selected.reviewStatus !== "reviewed" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      workspace.updateFile(selected.id, { reviewStatus: "reviewed" });
                      toast.success("File marked as reviewed.");
                    }}
                  >
                    Mark as reviewed
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    workspace.updateFile(selected.id, { isImportant: !selected.isImportant });
                    toast.success(selected.isImportant ? "Removed the important flag." : "File marked as important.");
                  }}
                >
                  {selected.isImportant ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  {selected.isImportant ? "Unmark important" : "Mark as important"}
                </Button>
                {selected.propertyId && onOpenProperty && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedId(null);
                      onOpenProperty(selected.propertyId as string);
                    }}
                  >
                    Open linked property
                  </Button>
                )}
                <Button variant="outline" onClick={() => toast.info(`${selected.name} would download in a full deployment.`)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button onClick={() => uploadNewVersion(selected)}>
                  <FileUp className="h-4 w-4" />
                  Upload new version
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
