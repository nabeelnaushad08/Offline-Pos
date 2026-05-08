"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Tag, Loader2, FolderOpen } from "lucide-react";
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
import type { InventoryCategory, InventoryProduct, CategoryFormValues } from "@/types/inventory";

interface CategoryTabProps {
  categories: InventoryCategory[];
  products: InventoryProduct[];
  onCreate: (data: CategoryFormValues) => Promise<void>;
  onUpdate: (id: string, data: CategoryFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY: CategoryFormValues = { name: "", description: "", parentId: "", sortOrder: "0" };

function toForm(c: InventoryCategory): CategoryFormValues {
  return {
    name: c.name,
    description: c.description ?? "",
    parentId: c.parentId ?? "",
    sortOrder: String(c.sortOrder),
  };
}

export function CategoryTab({ categories, products, onCreate, onUpdate, onDelete }: CategoryTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryCategory | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<CategoryFormValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true); };
  const openEdit = (c: InventoryCategory) => { setEditing(c); setForm(toForm(c)); setErrors({}); setShowModal(true); };

  const set = <K extends keyof CategoryFormValues>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<CategoryFormValues> = {};
    if (!form.name.trim()) e.name = "Name is required";
    setErrors(e);
    return !e.name;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editing) await onUpdate(editing.id, form);
      else await onCreate(form);
      setShowModal(false);
    } catch {
      // silently fail — parent handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const productCount = products.filter((p) => p.categoryId === id).length;
    if (productCount > 0) {
      alert(`Cannot delete category with ${productCount} product${productCount !== 1 ? "s" : ""}. Reassign products first.`);
      return;
    }
    await onDelete(id);
    setDeleteConfirm(null);
  };

  const filtered = categories.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = "h-9 text-sm";
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="h-9 max-w-xs"
        />
        <Button size="sm" onClick={openCreate} className="gap-1.5 h-9 ml-auto">
          <Plus className="h-3.5 w-3.5" />
          Add Category
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No categories found</p>
                </td>
              </tr>
            ) : (
              filtered.map((category) => {
                const count = products.filter((p) => p.categoryId === category.id).length;
                return (
                  <tr key={category.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Tag className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{category.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {category.description ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-xs font-semibold",
                        count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground">{category.sortOrder}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(category)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {deleteConfirm === category.id ? (
                          <div className="flex items-center gap-1 bg-destructive/10 rounded-md px-2 py-1">
                            <span className="text-[10px] text-destructive font-medium">Sure?</span>
                            <button onClick={() => handleDelete(category.id)} className="text-[10px] text-destructive font-bold hover:underline">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-muted-foreground hover:underline">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(category.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Dialog open onOpenChange={(o) => !o && setShowModal(false)}>
          <DialogContent className="max-w-md w-full p-0">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Food & Beverage"
                  className={cn(inputClass, errors.name && "border-destructive")}
                />
                {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Optional description"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Parent Category</Label>
                  <select
                    value={form.parentId}
                    onChange={(e) => set("parentId", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">None (top-level)</option>
                    {categories.filter((c) => c.id !== editing?.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Sort Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={(e) => set("sortOrder", e.target.value)}
                    className={inputClass}
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
