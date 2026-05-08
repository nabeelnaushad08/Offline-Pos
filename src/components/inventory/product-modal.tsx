"use client";

import { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
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
import type { InventoryProduct, InventoryCategory, InventorySupplier, ProductFormValues } from "@/types/inventory";

interface ProductModalProps {
  product: InventoryProduct | null;
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  onClose: () => void;
  onSave: (data: ProductFormValues) => Promise<void>;
}

const UNITS = ["pcs", "kg", "ltr", "btl", "box", "pack", "bag", "can", "ream", "set"];

const EMPTY_FORM: ProductFormValues = {
  name: "", sku: "", barcode: "", description: "",
  categoryId: "", supplierId: "", costPrice: "", sellingPrice: "",
  taxRate: "0", unit: "pcs", stockQuantity: "0",
  minStockLevel: "0", maxStockLevel: "", isTrackStock: true, status: "ACTIVE",
};

function toForm(p: InventoryProduct): ProductFormValues {
  return {
    name: p.name, sku: p.sku, barcode: p.barcode ?? "", description: p.description ?? "",
    categoryId: p.categoryId, supplierId: p.supplierId ?? "", costPrice: String(p.costPrice),
    sellingPrice: String(p.sellingPrice), taxRate: String(p.taxRate), unit: p.unit,
    stockQuantity: String(p.stockQuantity), minStockLevel: String(p.minStockLevel),
    maxStockLevel: p.maxStockLevel != null ? String(p.maxStockLevel) : "",
    isTrackStock: p.isTrackStock, status: p.status,
  };
}

type Tab = "basic" | "pricing";

export function ProductModal({ product, categories, suppliers, onClose, onSave }: ProductModalProps) {
  const [form, setForm] = useState<ProductFormValues>(product ? toForm(product) : EMPTY_FORM);
  const [tab, setTab] = useState<Tab>("basic");
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setForm(product ? toForm(product) : EMPTY_FORM);
    setErrors({});
    setTab("basic");
    setSubmitError(null);
  }, [product]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ProductFormValues, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (!form.categoryId) e.categoryId = "Category is required";
    if (!form.sellingPrice || parseFloat(form.sellingPrice) < 0) e.sellingPrice = "Valid selling price required";
    if (form.costPrice && parseFloat(form.costPrice) < 0) e.costPrice = "Cost price cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "h-9 text-sm";
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <DialogTitle>{product ? `Edit: ${product.name}` : "Add Product"}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b border-border/50 px-5">
          <div className="flex gap-1">
            {(["basic", "pricing"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "basic" ? "Basic Info" : "Pricing & Stock"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 max-h-[65vh] overflow-y-auto">
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Mineral Water 500ml"
                    className={cn(inputClass, errors.name && "border-destructive")}
                  />
                  {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    SKU <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value.toUpperCase())}
                    placeholder="e.g. WTR-500"
                    className={cn(inputClass, errors.sku && "border-destructive")}
                  />
                  {errors.sku && <p className="text-[11px] text-destructive mt-1">{errors.sku}</p>}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Barcode</Label>
                  <Input
                    value={form.barcode}
                    onChange={(e) => set("barcode", e.target.value)}
                    placeholder="Scan or type barcode"
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                    className={cn(selectClass, errors.categoryId && "border-destructive")}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-[11px] text-destructive mt-1">{errors.categoryId}</p>}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Supplier</Label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => set("supplierId", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">No supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
                  <select
                    value={form.unit}
                    onChange={(e) => set("unit", e.target.value)}
                    className={selectClass}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}
                    className={selectClass}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Optional product description..."
                    rows={2}
                    className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Cost Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => set("costPrice", e.target.value)}
                    placeholder="0.00"
                    className={cn(inputClass, errors.costPrice && "border-destructive")}
                  />
                  {errors.costPrice && <p className="text-[11px] text-destructive mt-1">{errors.costPrice}</p>}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Selling Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => set("sellingPrice", e.target.value)}
                    placeholder="0.00"
                    className={cn(inputClass, errors.sellingPrice && "border-destructive")}
                  />
                  {errors.sellingPrice && <p className="text-[11px] text-destructive mt-1">{errors.sellingPrice}</p>}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.taxRate}
                    onChange={(e) => set("taxRate", e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Margin indicator */}
              {form.costPrice && form.sellingPrice && (
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Margin</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">
                      {parseFloat(form.sellingPrice) > 0
                        ? (((parseFloat(form.sellingPrice) - parseFloat(form.costPrice)) / parseFloat(form.sellingPrice)) * 100).toFixed(1)
                        : "0"}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Profit: ${(parseFloat(form.sellingPrice) - parseFloat(form.costPrice)).toFixed(2)} per unit
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-border/40 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Inventory
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {!product && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Opening Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={form.stockQuantity}
                        onChange={(e) => set("stockQuantity", e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Min Stock Level</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={form.minStockLevel}
                      onChange={(e) => set("minStockLevel", e.target.value)}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Max Stock Level</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={form.maxStockLevel}
                      onChange={(e) => set("maxStockLevel", e.target.value)}
                      placeholder="No limit"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isTrackStock}
                    onClick={() => set("isTrackStock", !form.isTrackStock)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2",
                      form.isTrackStock ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform",
                        form.isTrackStock ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                  <Label className="text-sm text-foreground cursor-pointer" onClick={() => set("isTrackStock", !form.isTrackStock)}>
                    Track stock quantity
                  </Label>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : product ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
