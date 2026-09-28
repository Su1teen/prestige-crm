import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, MessageCircle, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { leadsApi, opportunitiesApi, usersApi, type ProductionLead } from "@/lib/paterhausApi";
import { cn } from "@/lib/utils";
import {
  DirectionPill, EmptyState, Field, SectionHeader, directionLabel, leadStageLabel,
  moneyLabel, nextActionLabel, projectStatusLabel, selectClass,
} from "./shared";
import { LiveOwnerPipelineModule } from "./LiveOwnerPipelineModule";
import { useAuth } from "@/contexts/AuthContext";

type Form = { name: string; phone: string; email: string; direction: string; propertyArea: string; propertyType: string;
  stage: string; priority: string; nextActionType: string; nextActionText: string; nextActionAt: string;
  quotedAmount: string; agreedAmount: string; currency: string; note: string; assignedUserId: string; lostReason: string };
const blank = (): Form => ({ name: "", phone: "", email: "", direction: "SNAGGING", propertyArea: "", propertyType: "",
  stage: "new", priority: "Medium", nextActionType: "FOLLOW_UP", nextActionText: "", nextActionAt: "",
  quotedAmount: "", agreedAmount: "", currency: "AED", note: "", assignedUserId: "", lostReason: "" });
const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const directions = ["PROPERTY_MANAGEMENT", "SNAGGING", "STAGING"];
const priorities = ["Low", "Medium", "High", "Urgent"];
const nextActions = ["FOLLOW_UP", "CALL", "SEND_PROPOSAL", "NEGOTIATE", "SITE_VISIT", "WAITING_CLIENT", "WAITING_PAYMENT", "PAYMENT_RECEIVED", "CREATE_PROJECT", "OTHER"];
const dubaiInput = (iso: string) => new Date(new Date(iso).getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);
const dubaiDate = (iso: string) => new Date(iso).toLocaleDateString("en-AE", { timeZone: "Asia/Dubai", month: "short", day: "numeric" });
const isOverdue = (lead: ProductionLead) => Boolean(lead.nextActionAt) && new Date(lead.nextActionAt as string) < new Date() && lead.stage !== "won" && lead.stage !== "lost";
const contractorNames = (lead: ProductionLead) =>
  (lead.projects ?? []).flatMap((project) => project.contractors.map((item) => item.contractor.name));

export const ProductionPipelineModule = () => {
  const { user } = useAuth();
  const client = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<ProductionLead | null>(null);
  const [remove, setRemove] = useState<ProductionLead | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAiSource, setShowAiSource] = useState(false);
  const active = useQuery({ queryKey: ["paterhaus", "opportunities"], queryFn: opportunitiesApi.list, enabled: !archived });
  const archive = useQuery({ queryKey: ["paterhaus", "opportunities-archived"], queryFn: () => leadsApi.list(1, true), enabled: archived });
  const users = useQuery({ queryKey: ["paterhaus", "users"], queryFn: usersApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: ["paterhaus"] });
  const mutation = useMutation({ mutationFn: async (input: Form) => {
    const body = { ...input, name: input.name.trim(), email: input.email || undefined, phone: input.phone || undefined,
      propertyArea: input.propertyArea || undefined, propertyType: input.propertyType || undefined,
      nextActionText: input.nextActionText || null, nextActionAt: input.nextActionAt ? new Date(`${input.nextActionAt}:00+04:00`).toISOString() : null,
      quotedAmount: input.quotedAmount === "" ? null : Number(input.quotedAmount),
      agreedAmount: input.agreedAmount === "" ? null : Number(input.agreedAmount), note: input.note || null,
      assignedUserId: input.assignedUserId || null, lostReason: input.stage === "lost" ? input.lostReason || null : null };
    if (editing) return leadsApi.update(editing.id, body);
    return leadsApi.create({ ...body, source: "MANUAL",
      quotedAmount: body.quotedAmount ?? undefined, agreedAmount: body.agreedAmount ?? undefined,
      nextActionAt: body.nextActionAt ?? undefined, nextActionText: body.nextActionText ?? undefined, note: body.note ?? undefined,
      assignedUserId: body.assignedUserId ?? undefined, lostReason: body.lostReason ?? undefined });
  }, onSuccess: async () => { await refresh(); setOpen(false); }, onError: (cause) => setError(cause.message) });
  const patch = useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => leadsApi.update(id, body),
    onSuccess: refresh, onError: (cause) => setError(cause.message) });
  const archiveMutation = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => leadsApi.archive(id, value),
    onSuccess: async () => { await refresh(); setDetailId(null); }, onError: (cause) => setError(cause.message) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: async () => { await refresh(); setRemove(null); setDetailId(null); }, onError: (cause) => { setRemove(null); setError(cause.message); } });
  const edit = (lead?: ProductionLead) => {
    setEditing(lead ?? null); setError(null);
    setForm(lead ? { name: lead.name ?? "", phone: lead.phone ?? "", email: lead.email ?? "", direction: lead.direction,
      propertyArea: lead.propertyArea ?? "", propertyType: lead.propertyType ?? "", stage: lead.stage,
      priority: lead.priority ?? "Medium", nextActionType: lead.nextActionType ?? "FOLLOW_UP",
      nextActionText: lead.nextActionText ?? "", nextActionAt: lead.nextActionAt ? dubaiInput(lead.nextActionAt) : "",
      quotedAmount: lead.quotedAmount ?? "", agreedAmount: lead.agreedAmount ?? "", currency: lead.currency, note: lead.note ?? "",
      assignedUserId: lead.assignedUser?.id ?? "", lostReason: lead.lostReason ?? "" } : blank());
    setOpen(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    for (const amount of [form.quotedAmount, form.agreedAmount]) {
      if (amount !== "" && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) {
        setError("Amounts must be non-negative or left blank when unknown."); return;
      }
    }
    mutation.mutate(form);
  };
  const items = (archived ? archive.data?.data : active.data?.items) ?? [];
  const visible = items.filter((lead) => `${lead.name} ${lead.phone} ${lead.propertyArea}`.toLowerCase().includes(search.toLowerCase()));
  const detail = items.find((lead) => lead.id === detailId) ?? null;
  const byStage = (stage: string) => visible.filter((lead) => lead.stage === stage);

  const cardContent = (lead: ProductionLead) => <>
    <div className="flex items-start justify-between gap-2">
      <p className="truncate font-medium leading-5">{lead.name || lead.phone || "Unnamed owner"}</p>
      {lead.externalChatId && <MessageCircle aria-label="WhatsApp linked" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />}
    </div>
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <DirectionPill direction={lead.direction} />
      {lead.priority && lead.priority !== "Medium" && <Badge variant="outline" className="font-normal">{lead.priority}</Badge>}
      {lead.stage === "lost" && lead.lostReason && <Badge variant="destructive" className="font-normal">Lost</Badge>}
    </div>
    {lead.note && <p className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground">{lead.note}</p>}
    <p className="mt-2 text-sm font-medium">{lead.agreedAmount != null ? moneyLabel(lead.agreedAmount, lead.currency)
      : lead.quotedAmount != null ? <span className="font-normal text-muted-foreground">Quote {moneyLabel(lead.quotedAmount, lead.currency)}</span>
      : moneyLabel(null, lead.currency)}</p>
    <p className={cn("mt-1 text-xs", isOverdue(lead) ? "font-medium text-destructive" : "text-muted-foreground")}>
      {lead.nextActionText || nextActionLabel(lead.nextActionType ?? "") || "No next action"}
      {lead.nextActionAt ? ` · ${dubaiDate(lead.nextActionAt)}` : ""}{isOverdue(lead) ? " · overdue" : ""}</p>
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
      {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{lead.assignedUser ? `Assigned ${lead.assignedUser.name}` : "Unassigned"}</span>
    </div>
    {contractorNames(lead).length > 0 && <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Briefcase className="h-3 w-3" />{(lead.projects ?? []).map((project) => project.name).join(", ")} · {contractorNames(lead).join(", ")}</p>}
  </>;

  return <div className="space-y-5" data-testid="production-pipeline">
    <SectionHeader eyebrow="Shared CRM · AI classifications linked by chat ID" title="Owner Pipeline"
      description="One canonical lead per conversation, grouped by stage. Open a card for the summary, follow-up and assignee."
      action={<Button onClick={() => edit()}>Add opportunity</Button>} />
    <div className="flex flex-wrap items-center gap-3">
      <Input className="max-w-xs" aria-label="Search opportunities" placeholder="Search owner, phone, area" value={search} onChange={(event) => setSearch(event.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(event) => { setArchived(event.target.checked); setDetailId(null); }} />Archived</label>
      <Button variant="outline" onClick={() => void (archived ? archive.refetch() : active.refetch())}>Refresh</Button>
    </div>
    {active.data?.integrationStatus === "unavailable" && !archived && <p role="alert">AI classifications are temporarily unavailable; saved CRM opportunities remain visible.</p>}
    {(archived ? archive.isPending : active.isPending) ? <p role="status">Loading opportunities…</p> :
      (archived ? archive.isError : active.isError) ? <p role="alert">Could not load opportunities. <Button onClick={() => void (archived ? archive.refetch() : active.refetch())}>Retry</Button></p> :
      !visible.length ? <EmptyState title="No opportunities" description="Create one here or capture a lead from WhatsApp." /> :
      archived ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((lead) => <button key={lead.id} type="button" onClick={() => setDetailId(lead.id)}
          className="rounded-lg border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow">{cardContent(lead)}</button>)}
      </div> :
      <div className="flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage) => <section key={stage} className="flex w-[290px] shrink-0 flex-col gap-2 rounded-xl border bg-muted/30 p-3">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{leadStageLabel(stage)}</h3>
            <Badge variant="secondary" className="text-xs">{byStage(stage).length}</Badge>
          </header>
          {byStage(stage).map((lead) => <button key={lead.id} type="button" onClick={() => setDetailId(lead.id)}
            className="rounded-lg border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow">{cardContent(lead)}</button>)}
          {!byStage(stage).length && <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground/70">Empty</p>}
        </section>)}
      </div>}
    <Button variant="ghost" onClick={() => setShowAiSource(!showAiSource)}>{showAiSource ? "Hide" : "Show"} AI classification source</Button>
    {showAiSource && <LiveOwnerPipelineModule email={user?.email ?? ""} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}

    <Sheet open={Boolean(detail)} onOpenChange={(value) => { if (!value) setDetailId(null); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {detail && <>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">{detail.name || detail.phone || "Unnamed owner"}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <DirectionPill direction={detail.direction} />
              {detail.externalChatId && <span className="inline-flex items-center gap-1 text-emerald-600"><MessageCircle className="h-3.5 w-3.5" />WhatsApp linked</span>}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-5 text-sm">
            <div className="rounded-lg border bg-secondary/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</p>
              <p className="mt-1 whitespace-pre-line leading-5">{detail.note?.trim() || "No summary yet — capture one in Edit."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stage">
                <select aria-label="Stage" className={selectClass} value={detail.stage}
                  onChange={(event) => patch.mutate({ id: detail.id, body: { stage: event.target.value } })}>
                  {stages.map((value) => <option key={value} value={value}>{leadStageLabel(value)}</option>)}
                </select>
              </Field>
              <Field label="Assigned to">
                <select aria-label="Assignee" className={selectClass} value={detail.assignedUser?.id ?? ""}
                  onChange={(event) => patch.mutate({ id: detail.id, body: { assignedUserId: event.target.value || null } })}>
                  <option value="">Unassigned</option>
                  {(users.data?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="mt-0.5">{detail.phone || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="mt-0.5 break-all">{detail.email || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Quoted</p><p className="mt-0.5 font-medium">{moneyLabel(detail.quotedAmount, detail.currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Agreed</p><p className="mt-0.5 font-medium">{moneyLabel(detail.agreedAmount, detail.currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Property</p><p className="mt-0.5">{[detail.propertyType, detail.propertyArea].filter(Boolean).join(" · ") || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Priority</p><p className="mt-0.5">{detail.priority || "Medium"}</p></div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Next step</p>
              <p className={cn("mt-1", isOverdue(detail) && "font-medium text-destructive")}>
                {detail.nextActionText || nextActionLabel(detail.nextActionType ?? "") || "Nothing planned"}
                {detail.nextActionAt ? ` · ${dubaiDate(detail.nextActionAt)}` : ""}{isOverdue(detail) ? " · overdue" : ""}</p>
            </div>
            {detail.stage === "lost" && detail.lostReason && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-destructive">Lost reason</p>
              <p className="mt-1">{detail.lostReason}</p>
            </div>}
            {(detail.projects ?? []).map((project) => <div key={project.id} className="rounded-lg border p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Linked project</p>
              <p className="mt-1 font-medium">{project.name} · {projectStatusLabel(project.status)}</p>
              <p className="mt-0.5 text-muted-foreground">Contractors: {project.contractors.length ? project.contractors.map((item) => item.contractor.name).join(", ") : "none yet"}</p>
            </div>)}
            <p className="text-xs text-muted-foreground">Source {detail.source} · Created {dubaiDate(detail.createdAt)}</p>
          </div>
          <SheetFooter className="mt-6 gap-2">
            <Button onClick={() => edit(detail)}>Edit</Button>
            <Button variant="outline" onClick={() => archiveMutation.mutate({ id: detail.id, value: !archived })}>{archived ? "Restore" : "Archive"}</Button>
            <Button variant="destructive" onClick={() => setRemove(detail)}>Delete</Button>
          </SheetFooter>
        </>}
      </SheetContent>
    </Sheet>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} opportunity</DialogTitle>
          <DialogDescription>Contact, classification, follow-up and amounts. Leave amounts blank until known.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Owner name" className="sm:col-span-2"><Input required placeholder="Owner name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="Phone"><Input placeholder="+971…" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label="Email"><Input type="email" placeholder="owner@…" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label="Service direction">
            <select aria-label="Service direction" className={selectClass} value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>
              {directions.map((value) => <option key={value} value={value}>{directionLabel(value)}</option>)}
            </select>
          </Field>
          <Field label="Stage">
            <select aria-label="Stage" className={selectClass} value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
              {stages.map((value) => <option key={value} value={value}>{leadStageLabel(value)}</option>)}
            </select>
          </Field>
          {form.stage === "lost" && <Field label="Lost reason" className="sm:col-span-2">
            <Input placeholder="Why was the deal lost?" value={form.lostReason} onChange={(event) => setForm({ ...form, lostReason: event.target.value })} /></Field>}
          <Field label="Property type"><Input placeholder="Apartment, villa…" value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })} /></Field>
          <Field label="Property area"><Input placeholder="Marina, Downtown…" value={form.propertyArea} onChange={(event) => setForm({ ...form, propertyArea: event.target.value })} /></Field>
          <Field label="Assigned to">
            <select aria-label="Assignee" className={selectClass} value={form.assignedUserId} onChange={(event) => setForm({ ...form, assignedUserId: event.target.value })}>
              <option value="">Unassigned</option>
              {(users.data?.items ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select aria-label="Priority" className={selectClass} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {priorities.map((value) => <option key={value}>{value}</option>)}
            </select>
          </Field>
          <Field label="Next action">
            <select aria-label="Next action" className={selectClass} value={form.nextActionType} onChange={(event) => setForm({ ...form, nextActionType: event.target.value })}>
              {nextActions.map((value) => <option key={value} value={value}>{nextActionLabel(value)}</option>)}
            </select>
          </Field>
          <Field label="Follow-up at (Dubai)"><Input type="datetime-local" value={form.nextActionAt} onChange={(event) => setForm({ ...form, nextActionAt: event.target.value })} /></Field>
          <Field label="Next action detail" className="sm:col-span-2"><Input placeholder="What exactly needs to happen next" value={form.nextActionText} onChange={(event) => setForm({ ...form, nextActionText: event.target.value })} /></Field>
          <Field label="Quoted amount"><Input type="number" min="0" step="0.01" placeholder="0" value={form.quotedAmount} onChange={(event) => setForm({ ...form, quotedAmount: event.target.value })} /></Field>
          <Field label="Agreed amount"><Input type="number" min="0" step="0.01" placeholder="0" value={form.agreedAmount} onChange={(event) => setForm({ ...form, agreedAmount: event.target.value })} /></Field>
          <Field label="Currency"><Input maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></Field>
          <Field label="Summary / notes" className="sm:col-span-2">
            <Textarea rows={3} placeholder="Conversation summary, requirements, context…" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></Field>
          <DialogFooter className="sm:col-span-2"><Button disabled={mutation.isPending} type="submit">Save opportunity</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(remove)} onOpenChange={(value) => { if (!value) setRemove(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Delete {remove?.name || remove?.phone}?</DialogTitle>
        <DialogDescription>Historical leads must be archived instead.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setRemove(null)}>Cancel</Button>
          <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => remove && deleteMutation.mutate(remove.id)}>Delete</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
};
