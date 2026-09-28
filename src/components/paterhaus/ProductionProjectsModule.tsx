import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { contractorsApi, leadsApi, projectsApi, propertiesApi, type ProjectRecord } from "@/lib/paterhausApi";
import { EmptyState, SectionHeader } from "./shared";

const directions = ["SNAGGING", "STAGING", "PROPERTY_MANAGEMENT"];
const statuses = ["DRAFT", "CONFIRMED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];
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
        <div><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{project.serviceDirections.join(" + ")} · {project.status}</p>
          <p className="text-sm">Agreed {money(project.money.agreed, project.money.currency)} · Paid {money(project.money.paid, project.money.currency)} · Outstanding {money(project.money.outstanding, project.money.currency)}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setSelectedId(project.id)}>Open</Button><Button variant="outline" onClick={() => edit(project)}>Edit</Button>
          <Button variant="outline" onClick={() => operation.mutate(() => projectsApi.archive(project.id, !archived))}>{archived ? "Restore" : "Archive"}</Button>
          <Button variant="destructive" onClick={() => setDeleteTarget(project)}>Delete</Button></div></Card>)}</div> :
      <EmptyState title="No projects" description="Create a project once a service has been agreed." />}
    {selected && <Card className="space-y-4 p-5"><h3 className="text-lg font-semibold">{selected.name}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[["Quoted", selected.money.quoted], ["Agreed", selected.money.agreed], ["Paid", selected.money.paid], ["Outstanding", selected.money.outstanding]].map(([label, amount]) =>
        <div key={label}><p className="text-muted-foreground">{label}</p><p className="font-semibold">{money(amount, selected.money.currency)}</p></div>)}</div>
      <div className="space-y-2"><h4 className="font-medium">Milestones</h4>{selected.milestones.map((item) => <label className="flex items-center gap-2" key={item.id}>
        <input type="checkbox" checked={Boolean(item.completedAt)} onChange={() => operation.mutate(() => projectsApi.completeMilestone(selected.id, item.id, item.completedAt ? null : new Date().toISOString()))} />{item.title}</label>)}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!milestone.trim()) return;
          operation.mutate(() => projectsApi.milestone(selected.id, { title: milestone.trim(), sortOrder: selected.milestones.length }), { onSuccess: () => setMilestone("") }); }}>
          <Input aria-label="Milestone title" value={milestone} onChange={(event) => setMilestone(event.target.value)} placeholder="Next milestone" /><Button type="submit">Add</Button></form></div>
      <div className="space-y-2"><h4 className="font-medium">Payments</h4>{selected.payments.map((item) => <p key={item.id} className="text-sm">{item.type} · {money(item.amount, selected.money.currency)} · {item.status}</p>)}
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!Number.isFinite(Number(paymentAmount)) || Number(paymentAmount) <= 0) { setError("Enter a positive payment amount."); return; }
          operation.mutate(() => projectsApi.payment(selected.id, { amount: Number(paymentAmount), currency: selected.money.currency, type: paymentType, status: "PAID", paidAt: new Date().toISOString() }), { onSuccess: () => setPaymentAmount("") }); }}>
          <Input aria-label="Payment amount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="Amount" />
          <select aria-label="Payment type" value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>{["PREPAYMENT", "PARTIAL", "FINAL", "REFUND", "OTHER"].map((value) => <option key={value}>{value}</option>)}</select>
          <Button type="submit">Record</Button></form></div>
      <div className="space-y-2"><h4 className="font-medium">Contractors</h4>{selected.contractors.map((item) => <p key={item.id} className="text-sm">{item.contractor.name}</p>)}
        <div className="flex gap-2"><select aria-label="Assign contractor" value={contractorId} onChange={(event) => setContractorId(event.target.value)}><option value="">Select supplier</option>
          {(contractors.data?.items ?? []).filter((item) => !selected.contractors.some((assigned) => assigned.contractorId === item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <Button disabled={!contractorId} onClick={() => operation.mutate(() => projectsApi.assign(selected.id, contractorId), { onSuccess: () => setContractorId("") })}>Assign</Button></div></div>
    </Card>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit" : "New"} project</DialogTitle><DialogDescription>Amounts are optional; use a blank field when not yet agreed.</DialogDescription></DialogHeader>
      <form className="space-y-3" onSubmit={submit}>
        <Input aria-label="Project name" required placeholder="Project name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <fieldset><legend>Services</legend><div className="flex flex-wrap gap-3">{directions.map((value) => <label key={value} className="flex items-center gap-1"><input type="checkbox" checked={form.serviceDirections.includes(value)} onChange={() => setForm({ ...form, serviceDirections: form.serviceDirections.includes(value) ? form.serviceDirections.filter((item) => item !== value) : [...form.serviceDirections, value] })} />{value}</label>)}</div></fieldset>
        <select aria-label="Project status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Project property" value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })}><option value="">No property yet</option>{(properties.data?.items ?? []).map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
        <select aria-label="Project client" value={form.ownerLeadId} onChange={(event) => setForm({ ...form, ownerLeadId: event.target.value })}><option value="">No linked client yet</option>{(leads.data?.data ?? []).map((lead) => <option key={lead.id} value={lead.id}>{lead.name || lead.phone || lead.id}</option>)}</select>
        <Input aria-label="Quoted amount" type="number" min="0" step="0.01" placeholder="Quoted amount (optional)" value={form.quotedAmount} onChange={(event) => setForm({ ...form, quotedAmount: event.target.value })} />
        <Input aria-label="Agreed amount" type="number" min="0" step="0.01" placeholder="Agreed amount (optional)" value={form.agreedAmount} onChange={(event) => setForm({ ...form, agreedAmount: event.target.value })} />
        <Input aria-label="Project currency" maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
        <Input aria-label="Expected completion" type="date" value={form.expectedCompletionDate} onChange={(event) => setForm({ ...form, expectedCompletionDate: event.target.value })} />
        <Input aria-label="Project comment" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
        <DialogFooter><Button type="submit" disabled={save.isPending}>Save project</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={(value) => { if (!value) setDeleteTarget(null); }}><DialogContent><DialogHeader><DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
      <DialogDescription>Projects with payments must be archived to preserve financial history.</DialogDescription></DialogHeader>
      <DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}>Delete</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
};
