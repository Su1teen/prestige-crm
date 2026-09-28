import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contractorsApi, leadsApi, projectsApi, propertiesApi, type ProjectRecord } from "@/lib/paterhausApi";
import { EmptyState, Field, SectionHeader, StatusPill, directionLabel, paymentTypeLabel, projectStatusLabel, selectClass } from "./shared";

const directions = ["SNAGGING", "STAGING", "PROPERTY_MANAGEMENT"];
const statuses = ["DRAFT", "CONFIRMED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];
const paymentTypes = ["PREPAYMENT", "PARTIAL", "FINAL", "REFUND", "OTHER"];
type Form = { name: string; propertyId: string; ownerLeadId: string; serviceDirections: string[]; status: string;
  quotedAmount: string; agreedAmount: string; currency: string; startDate: string; expectedCompletionDate: string; comment: string };
const blank = (): Form => ({ name: "", propertyId: "", ownerLeadId: "", serviceDirections: ["SNAGGING"], status: "DRAFT",
  quotedAmount: "", agreedAmount: "", currency: "AED", startDate: "", expectedCompletionDate: "", comment: "" });
const money = (value: string | null, currency: string) => value == null ? "—" : `${currency} ${Number(value).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;

export const ProductionProjectsModule = () => {
  const client = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRecord | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("PREPAYMENT");
  const [contractorId, setContractorId] = useState("");
  const projects = useQuery({ queryKey: ["paterhaus", "projects", archived], queryFn: () => projectsApi.list(archived) });
  const properties = useQuery({ queryKey: ["paterhaus", "properties"], queryFn: () => propertiesApi.list() });
  const contractors = useQuery({ queryKey: ["paterhaus", "contractors"], queryFn: () => contractorsApi.list() });
  const leads = useQuery({ queryKey: ["paterhaus", "leads-select"], queryFn: () => leadsApi.list() });
  const selected = projects.data?.items.find((project) => project.id === selectedId) ?? null;
  const refresh = () => client.invalidateQueries({ queryKey: ["paterhaus"] });
  const save = useMutation({ mutationFn: (input: Form) => {
    const body = { ...input, propertyId: input.propertyId || null, ownerLeadId: input.ownerLeadId || null,
      startDate: input.startDate || null, expectedCompletionDate: input.expectedCompletionDate || null,
      quotedAmount: input.quotedAmount === "" ? null : Number(input.quotedAmount),
      agreedAmount: input.agreedAmount === "" ? null : Number(input.agreedAmount) };
    return editing ? projectsApi.update(editing.id, body) : projectsApi.create(body);
  }, onSuccess: async (project) => { await refresh(); setOpen(false); setSelectedId(project.id); }, onError: (cause) => setError(cause.message) });
  const operation = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: refresh, onError: (cause) => setError(cause.message) });
  const remove = useMutation({ mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: async () => { await refresh(); setDeleteTarget(null); setSelectedId(null); }, onError: (cause) => { setDeleteTarget(null); setError(cause.message); } });
  const edit = (project?: ProjectRecord) => {
    setEditing(project ?? null); setError(null);
    setForm(project ? { name: project.name, propertyId: project.propertyId ?? "", ownerLeadId: project.ownerLeadId ?? "",
      serviceDirections: project.serviceDirections, status: project.status, quotedAmount: project.money.quoted ?? "",
      agreedAmount: project.money.agreed ?? "", currency: project.money.currency,
      startDate: project.startDate?.slice(0, 10) ?? "", expectedCompletionDate: project.expectedCompletionDate?.slice(0, 10) ?? "", comment: project.comment ?? "" } : blank());
    setOpen(true);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!form.serviceDirections.length) { setError("Select at least one service."); return; }
    if ([form.quotedAmount, form.agreedAmount].some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      setError("Use non-negative amounts or leave them blank when unknown."); return;
    }
    save.mutate(form);
  };
  const items = (projects.data?.items ?? []).filter((project) => project.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5" data-testid="production-projects">
    <SectionHeader eyebrow="Admin operations · production" title="Projects / Objects in Work" description="A property can have several independent Snagging, Staging and Management projects."
      action={<Button onClick={() => edit()}>New project</Button>} />
    <div className="flex gap-3"><Input aria-label="Search projects" className="max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(event) => { setArchived(event.target.checked); setSelectedId(null); }} />Archived</label></div>
    {projects.isPending ? <p role="status">Loading projects…</p> : projects.isError ? <p role="alert">Projects could not be loaded. <Button onClick={() => void projects.refetch()}>Retry</Button></p> :
      items.length ? <div className="space-y-2">{items.map((project) => <Card key={project.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{project.name}</p><StatusPill status={projectStatusLabel(project.status)} /></div>
          <p className="mt-0.5 text-xs text-muted-foreground">{project.serviceDirections.map(directionLabel).join(" + ")}{project.property?.name ? ` · ${project.property.name}` : ""}</p>
          <p className="mt-1 text-sm">Agreed {money(project.money.agreed, project.money.currency)} · Paid {money(project.money.paid, project.money.currency)} · Outstanding {money(project.money.outstanding, project.money.currency)}</p>
          {project.contractors.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">Contractors: {project.contractors.map((item) => item.contractor.name).join(", ")}</p>}</div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setSelectedId(project.id)}>Open</Button><Button variant="outline" onClick={() => edit(project)}>Edit</Button>
          <Button variant="outline" onClick={() => operation.mutate(() => projectsApi.archive(project.id, !archived))}>{archived ? "Restore" : "Archive"}</Button>
          <Button variant="destructive" onClick={() => setDeleteTarget(project)}>Delete</Button></div></Card>)}</div> :
      <EmptyState title="No projects" description="Create a project once a service has been agreed." />}
    {selected && <Card className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="text-lg font-semibold">{selected.name}</h3>
          <p className="text-xs text-muted-foreground">{selected.serviceDirections.map(directionLabel).join(" + ")}
            {selected.property?.name ? ` · ${selected.property.name}` : ""}{selected.ownerLead?.name ? ` · Owner: ${selected.ownerLead.name}` : ""}</p></div>
        <StatusPill status={projectStatusLabel(selected.status)} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[["Quoted", selected.money.quoted], ["Agreed", selected.money.agreed], ["Paid", selected.money.paid], ["Outstanding", selected.money.outstanding]].map(([label, amount]) =>
        <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{money(amount, selected.money.currency)}</p></div>)}</div>
      <div className="space-y-2"><h4 className="text-sm font-medium">Milestones</h4>
        {selected.milestones.length === 0 && <p className="text-xs text-muted-foreground">No milestones yet.</p>}
        {selected.milestones.map((item) => <label className="flex items-center gap-2 text-sm" key={item.id}>
          <input type="checkbox" checked={Boolean(item.completedAt)} onChange={() => operation.mutate(() => projectsApi.completeMilestone(selected.id, item.id, item.completedAt ? null : new Date().toISOString()))} />
          <span className={item.completedAt ? "text-muted-foreground line-through" : ""}>{item.title}</span></label>)}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!milestone.trim()) return;
          operation.mutate(() => projectsApi.milestone(selected.id, { title: milestone.trim(), sortOrder: selected.milestones.length }), { onSuccess: () => setMilestone("") }); }}>
          <Input aria-label="Milestone title" className="max-w-xs" value={milestone} onChange={(event) => setMilestone(event.target.value)} placeholder="Next milestone" /><Button type="submit" variant="outline">Add</Button></form></div>
      <div className="space-y-2"><h4 className="text-sm font-medium">Payments</h4>
        {selected.payments.length === 0 && <p className="text-xs text-muted-foreground">No payments recorded.</p>}
        {selected.payments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>{paymentTypeLabel(item.type)}</span>
          <span className="flex items-center gap-2">{money(item.amount, selected.money.currency)}<Badge variant="outline">{item.status}</Badge></span></div>)}
        <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(Number(paymentAmount)) || Number(paymentAmount) <= 0) { setError("Enter a positive payment amount."); return; }
          operation.mutate(() => projectsApi.payment(selected.id, { amount: Number(paymentAmount), currency: selected.money.currency, type: paymentType, status: "PAID", paidAt: new Date().toISOString() }), { onSuccess: () => setPaymentAmount("") }); }}>
          <Field label={`Amount (${selected.money.currency})`}><Input aria-label="Payment amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" /></Field>
          <Field label="Payment type"><select aria-label="Payment type" className={selectClass} value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
            {paymentTypes.map((value) => <option key={value} value={value}>{paymentTypeLabel(value)}</option>)}</select></Field>
          <Button type="submit" variant="outline">Record payment</Button></form></div>
      <div className="space-y-2"><h4 className="text-sm font-medium">Contractors</h4>
        {selected.contractors.length === 0 && <p className="text-xs text-muted-foreground">No contractor assigned yet.</p>}
        {selected.contractors.map((item) => <div key={item.id} className="rounded-md border px-3 py-2 text-sm">{item.contractor.name}</div>)}
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Assign contractor"><select aria-label="Assign contractor" className={selectClass} value={contractorId} onChange={(event) => setContractorId(event.target.value)}>
            <option value="">Select contractor…</option>
            {(contractors.data?.items ?? []).filter((item) => !selected.contractors.some((assigned) => assigned.contractorId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Button variant="outline" disabled={!contractorId} onClick={() => operation.mutate(() => projectsApi.assign(selected.id, contractorId), { onSuccess: () => setContractorId("") })}>Assign</Button></div></div>
    </Card>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit" : "New"} project</DialogTitle><DialogDescription>Amounts are optional; leave them blank until agreed.</DialogDescription></DialogHeader>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Project name" className="sm:col-span-2"><Input aria-label="Project name" required placeholder="e.g. Marina apartment — full snagging" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <fieldset className="sm:col-span-2"><legend className="text-xs font-medium text-muted-foreground">Services</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">{directions.map((value) => <button type="button" key={value} onClick={() => setForm({ ...form, serviceDirections: form.serviceDirections.includes(value) ? form.serviceDirections.filter((item) => item !== value) : [...form.serviceDirections, value] })}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${form.serviceDirections.includes(value) ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}>{directionLabel(value)}</button>)}</div></fieldset>
        <Field label="Status"><select aria-label="Project status" className={selectClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          {statuses.map((value) => <option key={value} value={value}>{projectStatusLabel(value)}</option>)}</select></Field>
        <Field label="Start date"><Input aria-label="Start date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field>
        <Field label="Property"><select aria-label="Project property" className={selectClass} value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })}>
          <option value="">No property yet</option>{(properties.data?.items ?? []).map((property) => <option key={property.id} value={property.id}>{property.name}{property.area ? ` · ${property.area}` : ""}</option>)}</select></Field>
        <Field label="Client (pipeline lead)"><select aria-label="Project client" className={selectClass} value={form.ownerLeadId} onChange={(event) => setForm({ ...form, ownerLeadId: event.target.value })}>
          <option value="">No linked client yet</option>{(leads.data?.data ?? []).map((lead) => <option key={lead.id} value={lead.id}>{lead.name || lead.phone || lead.id}</option>)}</select></Field>
        <Field label="Quoted amount"><Input aria-label="Quoted amount" type="number" min="0" step="0.01" placeholder="0" value={form.quotedAmount} onChange={(event) => setForm({ ...form, quotedAmount: event.target.value })} /></Field>
        <Field label="Agreed amount"><Input aria-label="Agreed amount" type="number" min="0" step="0.01" placeholder="0" value={form.agreedAmount} onChange={(event) => setForm({ ...form, agreedAmount: event.target.value })} /></Field>
        <Field label="Currency"><Input aria-label="Project currency" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></Field>
        <Field label="Expected completion"><Input aria-label="Expected completion" type="date" value={form.expectedCompletionDate} onChange={(event) => setForm({ ...form, expectedCompletionDate: event.target.value })} /></Field>
        <Field label="Comment" className="sm:col-span-2"><Textarea aria-label="Project comment" rows={2} placeholder="Scope, access notes, owner requests…" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} /></Field>
        <DialogFooter className="sm:col-span-2"><Button type="submit" disabled={save.isPending}>Save project</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={(value) => { if (!value) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
      <DialogDescription>Projects with payments must be archived to preserve financial history.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>Delete</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
};
