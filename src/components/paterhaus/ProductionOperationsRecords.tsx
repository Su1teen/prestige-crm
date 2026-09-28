import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { contractorsApi, guestsApi, propertiesApi, staysApi, type ContractorRecord, type GuestRecord, type PropertyRecord, type StayRecord } from "@/lib/paterhausApi";
import { EmptyState, Field, SectionHeader, directionLabel, selectClass } from "./shared";

export const ProductionPropertiesModule = () => {
  const client = useQueryClient();
  const [editing, setEditing] = useState<PropertyRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [archived, setArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["paterhaus", "properties", archived], queryFn: () => propertiesApi.list(archived) });
  const save = useMutation({ mutationFn: () => editing ? propertiesApi.update(editing.id, { name, address, area, type }) : propertiesApi.create({ name, address, area, type }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["paterhaus"] }); setOpen(false); }, onError: (cause) => setError(cause.message) });
  const remove = useMutation({ mutationFn: propertiesApi.delete, onSuccess: async () => { await client.invalidateQueries({ queryKey: ["paterhaus"] }); setDeleteId(null); }, onError: (cause) => { setDeleteId(null); setError(cause.message); } });
  const archive = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => propertiesApi.archive(id, value),
    onSuccess: () => client.invalidateQueries({ queryKey: ["paterhaus"] }), onError: (cause) => setError(cause.message) });
  const edit = (item?: PropertyRecord) => { setEditing(item ?? null); setName(item?.name ?? ""); setAddress(item?.address ?? ""); setArea(item?.area ?? ""); setType(item?.type ?? ""); setOpen(true); };
  return <div className="space-y-4"><SectionHeader eyebrow="Physical real estate" title="Properties" description="One property can be linked to several service projects."
    action={<Button onClick={() => edit()}>Add property</Button>} />
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} />Archived properties</label>
    {query.isPending ? <p role="status">Loading properties…</p> : query.isError ? <p role="alert">Could not load properties. <Button onClick={() => void query.refetch()}>Retry</Button></p> :
      query.data?.items.length ? <div className="space-y-2">{query.data.items.map((item) => <Card key={item.id} className="flex items-center justify-between p-4"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.type || "—"} · {item.area || "—"} · {item.address || "—"}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => edit(item)}>Edit</Button><Button variant="outline" onClick={() => archive.mutate({ id: item.id, value: !item.archivedAt })}>{item.archivedAt ? "Unarchive" : "Archive"}</Button><Button variant="destructive" onClick={() => setDeleteId(item.id)}>Delete</Button></div></Card>)}</div> :
      <EmptyState title={archived ? "No archived properties" : "No properties"} description={archived ? "Archived properties appear here." : "Add a property when its details become available."} />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} property</DialogTitle><DialogDescription>Only a name is required.</DialogDescription></DialogHeader><form onSubmit={(event: FormEvent) => { event.preventDefault(); save.mutate(); }} className="space-y-4">
      <Field label="Property name"><Input required placeholder="e.g. Marina Gate 2, Apt 1204" value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Address"><Input placeholder="Street, building" value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
      <Field label="Area / community"><Input placeholder="Dubai Marina, Downtown…" value={area} onChange={(event) => setArea(event.target.value)} /></Field>
      <Field label="Type"><Input placeholder="Apartment / villa / townhouse" value={type} onChange={(event) => setType(event.target.value)} /></Field>
      <DialogFooter><Button type="submit" disabled={save.isPending}>Save property</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={Boolean(deleteId)} onOpenChange={(value) => { if (!value) setDeleteId(null); }}><DialogContent><DialogHeader><DialogTitle>Delete property?</DialogTitle><DialogDescription>Properties linked to projects or stays cannot be deleted.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && remove.mutate(deleteId)}>Delete</Button></DialogFooter></DialogContent></Dialog>
  </div>;
};

export const ProductionContractorsModule = () => {
  const client = useQueryClient();
  const [editing, setEditing] = useState<ContractorRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [inactive, setInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["paterhaus", "contractors", inactive], queryFn: () => contractorsApi.list(inactive) });
  const refresh = () => client.invalidateQueries({ queryKey: ["paterhaus"] });
  const save = useMutation({ mutationFn: () => editing ? contractorsApi.update(editing.id, { name, contactPerson, phone, email: email || null, notes, serviceTypes }) : contractorsApi.create({ name, contactPerson, phone, email: email || null, notes, serviceTypes }),
    onSuccess: async () => { await refresh(); setOpen(false); }, onError: (cause) => setError(cause.message) });
  const disable = useMutation({ mutationFn: (item: ContractorRecord) => contractorsApi.update(item.id, { active: !item.active }),
    onSuccess: refresh, onError: (cause) => setError(cause.message) });
  const edit = (item?: ContractorRecord) => { setEditing(item ?? null); setName(item?.name ?? ""); setContactPerson(item?.contactPerson ?? ""); setPhone(item?.phone ?? ""); setEmail(item?.email ?? ""); setNotes(item?.notes ?? ""); setServiceTypes(item?.serviceTypes ?? []); setError(null); setOpen(true); };
  return <div className="space-y-4"><SectionHeader eyebrow="Admin operations" title="Contractors" description="Assign one or more suppliers to each project."
    action={<Button onClick={() => edit()}>Add contractor</Button>} />
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inactive} onChange={(event) => setInactive(event.target.checked)} />Inactive contractors</label>
    {query.isPending ? <p role="status">Loading contractors…</p> : query.isError ? <p role="alert">Could not load contractors. <Button onClick={() => void query.refetch()}>Retry</Button></p> : query.data?.items.length ?
      <div className="space-y-2">{query.data.items.map((item) => <Card key={item.id} className="flex items-center justify-between p-4"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.serviceTypes.map(directionLabel).join(" + ") || "—"} · {item.contactPerson || "—"} · {item.phone || "—"}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => edit(item)}>Edit</Button><Button variant="outline" onClick={() => disable.mutate(item)}>{item.active ? "Deactivate" : "Reactivate"}</Button></div></Card>)}</div> :
      <EmptyState title="No contractors" description="Add Snagging or Staging suppliers to assign them to projects." />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} contractor</DialogTitle><DialogDescription>Choose all applicable service directions.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={(event: FormEvent) => { event.preventDefault(); if (!serviceTypes.length) { setError("Choose at least one service."); return; } save.mutate(); }}>
        <Field label="Contractor name"><Input required placeholder="e.g. FixIt Technical Services" value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <fieldset><legend className="text-xs font-medium text-muted-foreground">Services they cover</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">{["SNAGGING", "STAGING"].map((value) => <button type="button" key={value} onClick={() => setServiceTypes(serviceTypes.includes(value) ? serviceTypes.filter((item) => item !== value) : [...serviceTypes, value])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${serviceTypes.includes(value) ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}>{directionLabel(value)}</button>)}</div></fieldset>
        <Field label="Contact person"><Input placeholder="Name" value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} /></Field>
        <Field label="Phone"><Input placeholder="+971…" value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
        <Field label="Email"><Input type="email" placeholder="contact@…" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
        <Field label="Notes"><Input placeholder="Rates, responsiveness, references…" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <DialogFooter><Button type="submit" disabled={save.isPending}>Save contractor</Button></DialogFooter>
      </form></DialogContent></Dialog>
  </div>;
};

export const ProductionGuestsStaysModule = () => {
  const client = useQueryClient();
  const guests = useQuery({ queryKey: ["paterhaus", "guests"], queryFn: guestsApi.list });
  const stays = useQuery({ queryKey: ["paterhaus", "stays"], queryFn: staysApi.list });
  const properties = useQuery({ queryKey: ["paterhaus", "properties"], queryFn: () => propertiesApi.list() });
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [guestId, setGuestId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<GuestRecord | null>(null);
  const [editingStay, setEditingStay] = useState<StayRecord | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [stayOpen, setStayOpen] = useState(false);
  const refresh = () => client.invalidateQueries({ queryKey: ["paterhaus"] });
  const guestSave = useMutation({ mutationFn: () => editingGuest ? guestsApi.update(editingGuest.id, { name: guestName, phone: guestPhone }) : guestsApi.create({ name: guestName, phone: guestPhone }),
    onSuccess: async () => { await refresh(); setGuestOpen(false); }, onError: (cause) => setError(cause.message) });
  const staySave = useMutation({ mutationFn: () => editingStay ? staysApi.update(editingStay.id, { propertyId, guestId, checkIn, checkOut }) : staysApi.create({ propertyId, guestId, checkIn, checkOut, guestCount: 1 }),
    onSuccess: async () => { await refresh(); setStayOpen(false); }, onError: (cause) => setError(cause.message) });
  const openGuest = (item?: GuestRecord) => { setEditingGuest(item ?? null); setGuestName(item?.name ?? ""); setGuestPhone(item?.phone ?? ""); setGuestOpen(true); };
  const openStay = (item?: StayRecord) => { setEditingStay(item ?? null); setPropertyId(item?.property.id ?? ""); setGuestId(item?.guest.id ?? ""); setCheckIn(item?.checkIn.slice(0, 16) ?? ""); setCheckOut(item?.checkOut.slice(0, 16) ?? ""); setStayOpen(true); };
  return <div className="space-y-5"><SectionHeader eyebrow="Property Management" title="Guests & Stays" description="Real guest and reservation records, separate from Paterhaus-wide projects."
    action={<div className="flex gap-2"><Button variant="outline" onClick={() => openGuest()}>Add guest</Button><Button onClick={() => openStay()}>Add stay</Button></div>} />
    <h3 className="font-semibold">Guests</h3>{guests.isPending ? <p role="status">Loading guests…</p> : guests.isError ? <p role="alert">Guests unavailable. <Button onClick={() => void guests.refetch()}>Retry</Button></p> : guests.data?.length ?
      guests.data.map((item) => <Card key={item.id} className="flex justify-between p-3"><div>{item.name} · {item.phone || "—"}</div><Button variant="outline" onClick={() => openGuest(item)}>Edit</Button></Card>) : <EmptyState title="No guests" description="Add a guest before recording a stay." />}
    <h3 className="font-semibold">Stays</h3>{stays.isPending ? <p role="status">Loading stays…</p> : stays.isError ? <p role="alert">Stays unavailable. <Button onClick={() => void stays.refetch()}>Retry</Button></p> : stays.data?.length ?
      stays.data.map((item) => <Card key={item.id} className="flex justify-between p-3"><div>{item.guest.name} · {item.property.name} · {new Date(item.checkIn).toLocaleDateString("en-AE")} – {new Date(item.checkOut).toLocaleDateString("en-AE")}</div><Button variant="outline" onClick={() => openStay(item)}>Edit</Button></Card>) :
      <EmptyState title="No stays" description="Add a stay once a property and guest are recorded." />}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Dialog open={guestOpen} onOpenChange={setGuestOpen}><DialogContent><DialogHeader><DialogTitle>{editingGuest ? "Edit" : "Add"} guest</DialogTitle></DialogHeader><form onSubmit={(event: FormEvent) => { event.preventDefault(); guestSave.mutate(); }} className="space-y-4">
      <Field label="Guest name"><Input required value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Full name" /></Field>
      <Field label="Phone"><Input value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="+971…" /></Field>
      <DialogFooter><Button type="submit">Save guest</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={stayOpen} onOpenChange={setStayOpen}><DialogContent><DialogHeader><DialogTitle>{editingStay ? "Edit" : "Add"} stay</DialogTitle><DialogDescription>Check-out must be after check-in.</DialogDescription></DialogHeader><form onSubmit={(event: FormEvent) => { event.preventDefault(); if (checkOut <= checkIn) { setError("Check-out must follow check-in."); return; } staySave.mutate(); }} className="space-y-4">
      <Field label="Property"><select required className={selectClass} value={propertyId} onChange={(event) => setPropertyId(event.target.value)}><option value="">Select property…</option>{(properties.data?.items ?? []).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      <Field label="Guest"><select required className={selectClass} value={guestId} onChange={(event) => setGuestId(event.target.value)}><option value="">Select guest…</option>{(guests.data ?? []).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Check-in"><Input required type="datetime-local" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></Field>
        <Field label="Check-out"><Input required type="datetime-local" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></Field>
      </div>
      <DialogFooter><Button type="submit">Save stay</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>;
};
