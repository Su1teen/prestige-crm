import { useCallback, useEffect, useState } from "react";
import {
  Download,
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLiveAttachmentDownloadUrl,
  fetchLiveFiles,
  LiveConversationsError,
  type LiveAttachmentKind,
  type LiveFile,
} from "@/lib/paterhausConversationsApi";
import { downloadSignedAttachment } from "@/lib/paterhausAttachmentDownload";

interface LiveFilesHubModuleProps {
  email: string;
}

const filters: Array<{ label: string; value: "all" | LiveAttachmentKind }> = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "Word", value: "word" },
  { label: "Images", value: "image" },
  { label: "Spreadsheet", value: "spreadsheet" },
  { label: "Audio", value: "audio" },
  { label: "Other", value: "other" },
];

const typeLabel: Record<LiveAttachmentKind, string> = {
  image: "Image",
  audio: "Audio",
  pdf: "PDF",
  word: "Word document",
  spreadsheet: "Spreadsheet",
  text: "Text document",
  other: "Other",
};

const TypeIcon = ({ kind }: { kind: LiveAttachmentKind }) => {
  const className = "h-5 w-5";
  if (kind === "image") return <FileImage className={className} />;
  if (kind === "audio") return <FileAudio className={className} />;
  if (kind === "spreadsheet") return <FileSpreadsheet className={className} />;
  if (kind === "pdf" || kind === "word" || kind === "text") {
    return <FileText className={className} />;
  }
  return <File className={className} />;
};

const formatSize = (size: number | null): string => {
  if (size === null) return "Size unavailable";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatReceived = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const hasTechnicalSummary = (summary: string): boolean => {
  const normalized = summary.trim().toLowerCase();
  return [
    "<?xml",
    "<w:document",
    "xmlns:",
    "schemas.microsoft.com",
    "wordprocessingml",
    '{"data":"<?xml',
  ].some((marker) => normalized.includes(marker));
};

const displaySummary = (summary: string | null): string =>
  !summary || hasTechnicalSummary(summary) ? "No summary available" : summary;

const downloadError = (error: unknown): string => {
  if (error instanceof LiveConversationsError) {
    if (error.status === 401 || error.status === 403) return "You are not authorized to download this file.";
    if (error.status === 404) return "This attachment is no longer available.";
    if (error.status === 503) return "File storage is temporarily unavailable. Please try again.";
  }
  return "The download link could not be created. Please try again.";
};

export const LiveFilesHubModule = ({ email }: LiveFilesHubModuleProps) => {
  const [files, setFiles] = useState<LiveFile[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | LiveAttachmentKind>("all");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(
    async (cursor: string | null, append: boolean, signal?: AbortSignal) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const response = await fetchLiveFiles(
          email,
          {
            limit: 50,
            cursor,
            search: query,
            kind: kind === "all" ? undefined : kind,
          },
          signal,
        );
        setFiles((current) => (append ? [...current, ...response.items] : response.items));
        setNextCursor(response.nextCursor);
        setError(null);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError("Live files are temporarily unavailable.");
        if (!append) setFiles([]);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [email, kind, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void load(null, false, controller.signal), 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load, reloadKey]);

  const download = async (file: LiveFile) => {
    if (downloadingId) return;
    setDownloadingId(file.id);
    try {
      const { url } = await createLiveAttachmentDownloadUrl(email, file.id);
      downloadSignedAttachment(url);
    } catch (requestError) {
      toast.error(downloadError(requestError));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="live-files-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            WhatsApp repository
          </p>
          <h2 id="live-files-title" className="mt-1 text-xl font-semibold text-foreground">
            Files
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Documents and media received from Paterhaus contacts.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:grid-cols-[minmax(0,1fr)_190px]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files, contacts, phone or summary"
            aria-label="Search files"
            className="pl-9"
          />
        </div>
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as typeof kind)}
          aria-label="Filter file type"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          {filters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading files…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-card p-6 text-center">
          <File className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadKey((value) => value + 1)}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      ) : files.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <File className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No files found</p>
          <p className="text-sm text-muted-foreground">
            {query || kind !== "all" ? "Try a different search or file type." : "Incoming WhatsApp attachments will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="hidden grid-cols-[minmax(220px,1.5fr)_130px_minmax(130px,0.8fr)_minmax(150px,0.9fr)_150px_minmax(220px,1.2fr)_90px] gap-3 border-b border-border bg-secondary/45 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
              <span>File</span><span>Type</span><span>From</span><span>Contact / phone</span><span>Received</span><span>Summary</span><span>Download</span>
            </div>
            <div className="divide-y divide-border">
              {files.map((file) => (
                <article key={file.id} className="grid min-w-0 gap-3 px-4 py-4 lg:grid-cols-[minmax(220px,1.5fr)_130px_minmax(130px,0.8fr)_minmax(150px,0.9fr)_150px_minmax(220px,1.2fr)_90px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary"><TypeIcon kind={file.kind} /></span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{file.fileName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(file.sizeBytes)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground"><span className="mr-2 text-xs text-muted-foreground lg:hidden">Type</span>{typeLabel[file.kind]}</p>
                  <p className="break-words text-sm text-foreground [overflow-wrap:anywhere]"><span className="mr-2 text-xs text-muted-foreground lg:hidden">From</span>{file.senderName ?? "Unknown contact"}</p>
                  <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]"><span className="mr-2 text-xs lg:hidden">Contact</span>{file.number ?? file.chatId}</p>
                  <time className="text-xs text-muted-foreground">{formatReceived(file.createdAt)}</time>
                  <p className="break-words text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{displaySummary(file.summary)}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void download(file)} disabled={downloadingId === file.id}>
                    {downloadingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    <span className="lg:sr-only">Download {file.fileName}</span>
                  </Button>
                </article>
              ))}
            </div>
          </div>
          {nextCursor && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={() => void load(nextCursor, true)} disabled={loadingMore}>
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Load more
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
