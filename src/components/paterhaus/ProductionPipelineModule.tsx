import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { leadsApi, opportunitiesApi, usersApi, type ProductionLead } from "@/lib/paterhausApi";
import { EmptyState, SectionHeader } from "./shared";
import { LiveOwnerPipelineModule } from "./LiveOwnerPipelineModule";
import { useAuth } from "@/contexts/AuthContext";

type Form = { name: string; phone: string; email: string; direction: string; propertyArea: string; propertyType: string;
  stage: string; priority: string; nextActionType: string; nextActionText: string; nextActionAt: string;
  quotedAmount: string; agreedAmount: string; currency: string; note: string; assignedUserId: string; lostReason: string };
const blank = (): Form => ({ name: "", phone: "", email: "", direction: "SNAGGING", propertyArea: "", propertyType: "",
  stage: "new", priority: "Medium", nextActionType: "FOLLOW_UP", nextActionText: "", nextActionAt: "",
  quotedAmount: "", agreedAmount: "", currency: "AED", note: "", assignedUserId: "", lostReason: "" });
const nextActions = ["FOLLOW_UP", "CALL", "SEND_PROPOSAL", "NEGOTIATE", "SITE_VISIT", "WAITING_CLIENT", "WAITING_PAYMENT", "PAYMENT_RECEIVED", "CREATE_PROJECT", "OTHER"];
const money = (amount: string | null, currency: string) => amount === null ? "—" : `${currency} ${Number(amount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;
const dubaiInput = (iso: string) => new Date(new Date(iso).getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16);

export const ProductionPipelineModule = () => {
  const { user } = useAuth();
  const client = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState<ProductionLead | null>(null);
  const [remove, setRemove] = useState<ProductionLead | null>(null);
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
  const archiveMutation = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => leadsApi.archive(id, value),
    onSuccess: refresh, onError: (cause) => setError(cause.message) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: async () => { await refresh(); setRemove(null); }, onError: (cause) => { setRemove(null); setError(cause.message); } });
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
  return <div className="space-y-5" data-testid="production-pipeline">
    <SectionHeader eyebrow="Shared CRM · AI classifications linked by chat ID" title="Owner Pipeline"
      description="One canonical lead per conversation. Quoted and agreed amounts stay blank until known."
      action={<Button onClick={() => edit()}>Add opportunity</Button>} />
    <div className="flex flex-wrap items-center gap-3"><Input className="max-w-xs" aria-label="Search opportunities" placeholder="Search owner, phone, area" value={search} onChange={(event) => setSearch(event.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} />Archived</label>
      <Button variant="outline" onClick={() => void (archived ? archive.refetch() : active.refetch())}>Refresh</Button></div>
    {active.data?.integrationStatus === "unavailable" && !archived && <p role="alert">AI classifications are temporarily unavailable; saved CRM opportunities remain visible.</p>}
    {(archived ? archive.isPending : active.isPending) ? <p role="status">Loading opportunities…</p> :
      (archived ? archive.isError : active.isError) ? <p role="alert">Could not load opportunities. <Button onClick={() => void (archived ? archive.refetch() : active.refetch())}>Retry</Button></p> :
      visible.length ? <div className="space-y-2">{visible.map((lead) => <Card key={lead.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div><p className="font-medium">{lead.name || lead.phone || "Unnamed owner"} <span className="text-xs text-muted-foreground">{lead.direction} · {lead.stage}</span></p>
          <p className="text-sm">{lead.agreedAmount != null ? `Agreed ${money(lead.agreedAmount, lead.currency)}` : lead.quotedAmount != null ? `Quoted ${money(lead.quotedAmount, lead.currency)}` : "Amount —"}</p>
          <p className="text-sm text-primary">Next: {lead.nextActionText || lead.nextActionType || "—"}{lead.nextActionAt ? ` · ${new Date(lead.nextActionAt).toLocaleDateString("en-AE", { timeZone: "Asia/Dubai", month: "short", day: "numeric" })}` : ""}</p>
          <p className="text-xs text-muted-foreground">{lead.phone || "—"} · {lead.propertyArea || "—"}{lead.externalChatId ? " · WhatsApp linked" : ""} · {lead.assignedUser ? `Assigned ${lead.assignedUser.name}` : "Unassigned"}</p>
          {lead.stage === "lost" && lead.lostReason && <p className="text-xs text-destructive">Lost: {lead.lostReason}</p>}</div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => edit(lead)}>Edit</Button>
          <Button variant="outline" onClick={() => archiveMutation.mutate({ id: lead.id, value: !archived })}>{archived ? "Restore" : "Archive"}</Button>
          <Button variant="destructive" onClick={() => setRemove(lead)}>Delete</Button></div>
      </Card>)}</div> : <EmptyState title="No opportunities" description="Create one here or capture a lead from WhatsApp." />}
    <Button variant="ghost" onClick={() => setShowAiSource(!showAiSource)}>{showAiSource ? "Hide" : "Show"} AI classification source</Button>
    {showAiSource && <LiveOwnerPipelineModule email={user?.email ?? ""} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit" : "New"} opportunity</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid gap-3">
        <Input aria-label="Owner name" required placeholder="Owner name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input aria-label="Phone" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <Input aria-label="Email" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <select aria-label="Service direction" value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value })}>{["PROPERTY_MANAGEMENT", "SNAGGING", "STAGING"].map((value) => <option key={value}>{value}</option>)}</select>
        <Input aria-label="Property type" placeholder="Property type" value={form.propertyType} onChange={(event) => setForm({ ...form, propertyType: event.target.value })} />
        <Input aria-label="Property area" placeholder="Property area" value={form.propertyArea} onChange={(event) => setForm({ ...form, propertyArea: event.target.value })} />
        <select aria-label="Stage" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>{["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map((value) => <option key={value}>{value}</option>)}</select>
        {form.stage === "lost" && <Input aria-label="Lost reason" placeholder="Lost reason" value={form.lostReason} onChange={(event) => setForm({ ...form, lostReason: event.target.value })} />}
        <select aria-label="Assignee" value={form.assignedUserId} onChange={(event) => setForm({ ...form, assignedUserId: event.target.value })}><option value="">Unassigned</option>{(users.data?.items ?? []).map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select>
        <select aria-label="Priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{["Low", "Medium", "High", "Urgent"].map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Next action" value={form.nextActionType} onChange={(event) => setForm({ ...form, nextActionType: event.target.value })}>{nextActions.map((value) => <option key={value}>{value}</option>)}</select>
        <Input aria-label="Next action detail" placeholder="Next action detail" value={form.nextActionText} onChange={(event) => setForm({ ...form, nextActionText: event.target.value })} />
        <Input aria-label="Follow-up time" type="datetime-local" value={form.nextActionAt} onChange={(event) => setForm({ ...form, nextActionAt: event.target.value })} />
        <div className="flex gap-2"><Input aria-label="Quoted amount" type="number" min="0" step="0.01" placeholder="Quoted (optional)" value={form.quotedAmount} onChange={(event) => setForm({ ...form, quotedAmount: event.target.value })} />
          <Input aria-label="Agreed amount" type="number" min="0" step="0.01" placeholder="Agreed (optional)" value={form.agreedAmount} onChange={(event) => setForm({ ...form, agreedAmount: event.target.value })} /></div>
        <Input aria-label="Currency" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
        <Input aria-label="Notes" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <DialogFooter><Button disabled={mutation.isPending} type="submit">Save opportunity</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={Boolean(remove)} onOpenChange={(value) => { if (!value) setRemove(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {remove?.name}?</DialogTitle>
      <DialogDescription>Historical leads must be archived instead.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" onClick={() => setRemove(null)}>Cancel</Button>
        <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => remove && deleteMutation.mutate(remove.id)}>Delete</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
};
