"use client";

import { useState } from "react";
import { Plus, Edit2, Building2, Loader2, Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InventorySupplier, InventoryProduct, SupplierFormValues } from "@/types/inventory";

interface SupplierTabProps {
  suppliers: InventorySupplier[];
  products: InventoryProduct[];
  onCreate: (data: SupplierFormValues) => Promise<void>;
  onUpdate: (id: string, data: SupplierFormValues) => Promise<void>;
}

const EMPTY: SupplierFormValues = {
  name: "", code: "", contactName: "", email: "", phone: "",
  address: "", city: "", country: "", taxNumber: "", notes: "",
};

function toForm(s: InventorySupplier): SupplierFormValues {
  return {
    name: s.name, code: s.code, contactName: s.contactName ?? "", email: s.email ?? "",
    phone: s.phone ?? "", address: s.address ?? "", city: s.city ?? "",
    country: s.country ?? "", taxNumber: s.taxNumber ?? "", notes: s.notes ?? "",
  };
}

export function SupplierTab({ suppliers, products, onCreate, onUpdate }: SupplierTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventorySupplier | null>(null);
  const [form, setForm] = useState<SupplierFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<SupplierFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true); };
  const openEdit = (s: InventorySupplier) => { setEditing(s); setForm(toForm(s)); setErrors({}); setShowModal(true); };

  const set = <K extends keyof SupplierFormValues>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<SupplierFormValues> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.code.trim()) e.code = "Code is required";
    setErrors(e);
    return !e.name && !e.code;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editing) await onUpdate(editing.id, form);
      else await onCreate(form);
      setShowModal(false);
    } catch {
      // parent handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = suppliers.filter((s) =>
    !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "h-9 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="h-9 max-w-xs"
        />
        <Button size="sm" onClick={openCreate} className="gap-1.5 h-9 ml-auto">
          <Plus className="h-3.5 w-3.5" />
          Add Supplier
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balance</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No suppliers found</p>
                </td>
              </tr>
            ) : (
              filtered.map((supplier) => {
                const count = products.filter((p) => p.supplierId === supplier.id).length;
                return (
                  <tr key={supplier.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{supplier.name}</p>
                          {supplier.contactName && (
                            <p className="text-xs text-muted-foreground">{supplier.contactName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">{supplier.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-semibold",
                        count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-semibold tabular-nums",
                        supplier.balance > 0 ? "text-warning" : "text-muted-foreground"
                      )}>
                        ${supplier.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(supplier)}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mx-auto"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Dialog open onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent className="max-w-lg w-full p-0">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Supplier Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Fresh Foods Ltd"
                    className={cn(inputClass, errors.name && "border-destructive")}
                  />
                  {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    placeholder="e.g. FFL-001"
                    className={cn(inputClass, errors.code && "border-destructive")}
                  />
                  {errors.code && <p className="text-[11px] text-destructive mt-1">{errors.code}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Contact Person</Label>
                  <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@example.com" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555-0100" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">City</Label>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Country</Label>
                  <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" className={inputClass} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tax Number</Label>
                  <Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} placeholder="VAT/Tax number" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Add"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
