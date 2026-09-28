import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { internalDocumentsApi, type InternalDocument } from "@/lib/paterhausApi";
import { LiveFilesHubModule } from "./LiveFilesHubModule";
import { EmptyState, SectionHeader } from "./shared";

const supportedTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
export const ProductionFilesModule = ({ email, admin }: { email: string; admin: boolean }) => {
  const [tab, setTab] = useState<"client" | "internal">("client");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Price lists");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState<InternalDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const client = useQueryClient();
  const files = useQuery({ queryKey: ["paterhaus", "internal-documents"], queryFn: internalDocumentsApi.list, enabled: admin && tab === "internal" });
  const upload = useMutation({ mutationFn: () => internalDocumentsApi.upload(file!, title.trim(), category, description),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["paterhaus", "internal-documents"] }); setStatus("Document uploaded."); setFile(null); setTitle(""); setDescription(""); },
    onError: (cause) => setError(cause.message) });
  const remove = useMutation({ mutationFn: internalDocumentsApi.delete,
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["paterhaus", "internal-documents"] }); setConfirm(null); setStatus("Document deleted."); },
    onError: (cause) => setError(cause.message) });
  const download = async (id: string) => {
    setError(null);
    try { const { url } = await internalDocumentsApi.downloadUrl(id); window.open(url, "_blank", "noopener,noreferrer"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not download document."); }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!file || !supportedTypes.includes(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) {
      setError("Choose a PDF, image, text, DOCX or XLSX under 10 MB."); return;
    }
    upload.mutate();
  };
  return <div className="space-y-5" data-testid="production-files">
    <SectionHeader eyebrow="Private files" title="Files" description="Client media comes from WAHA. Internal documents are admin-only and kept in the private Bucket." />
    {admin && <div className="flex gap-2"><Button variant={tab === "client" ? "default" : "outline"} onClick={() => setTab("client")}>Client files</Button>
      <Button variant={tab === "internal" ? "default" : "outline"} onClick={() => setTab("internal")}>Internal files</Button></div>}
    {tab === "client" || !admin ? <LiveFilesHubModule email={email} /> : <>
      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-2" onSubmit={submit}>
        <Input required aria-label="Document title" placeholder="Document title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <select aria-label="Document category" value={category} onChange={(event) => setCategory(event.target.value)}>{["Price lists", "Proposal templates", "Supplier prices", "Service documents", "Internal reference", "Other"].map((value) => <option key={value}>{value}</option>)}</select>
        <Input aria-label="Document description" placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} />
        <Input required aria-label="Internal document file" type="file" accept={supportedTypes.join(",")} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button type="submit" disabled={upload.isPending}>{upload.isPending ? "Uploading…" : "Upload internal document"}</Button>
      </form>
      {files.isPending ? <p role="status">Loading internal files…</p> : files.isError ? <p role="alert">Could not load internal files. <Button onClick={() => void files.refetch()}>Retry</Button></p> :
        files.data?.items.length ? <div className="space-y-2">{files.data.items.map((item) => <Card key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
          <div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">Internal · {item.category} · {item.originalFileName} · {Math.ceil(item.sizeBytes / 1024)} KB</p></div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => void download(item.id)}>Download</Button><Button variant="destructive" onClick={() => setConfirm(item)}>Delete</Button></div>
        </Card>)}</div> : <EmptyState title="No internal documents" description="Upload a price list or a proposal template." />}
    </>}
    {status && <p role="status">{status}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open) setConfirm(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {confirm?.title}?</DialogTitle>
      <DialogDescription>This removes the private Bucket object and its metadata.</DialogDescription></DialogHeader><DialogFooter>
      <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => confirm && remove.mutate(confirm.id)}>Delete</Button>
      </DialogFooter></DialogContent></Dialog>
  </div>;
};
