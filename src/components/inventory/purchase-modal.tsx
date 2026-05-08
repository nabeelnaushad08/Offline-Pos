"use client";

import { useState } from "react";
import { Plus, Trash2, ShoppingBag, Loader2, Search } from "lucide-react";
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
import type {
  InventoryProduct,
  InventorySupplier,
  InventoryPurchase,
  PurchaseFormValues,
  PurchaseFormItem,
  ReceivePurchaseItem,
} from "@/types/inventory";

interface PurchaseModalProps {
  purchase: InventoryPurchase | null;
  suppliers: InventorySupplier[];
  products: InventoryProduct[];
  userId: string;
  onClose: () => void;
  onCreate: (data: PurchaseFormValues) => Promise<void>;
  onReceive: (purchaseId: string, items: ReceivePurchaseItem[], userId: string) => Promise<void>;
}

const PURCHASE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-muted-foreground/20",
  ORDERED: "bg-primary/10 text-primary border-primary/20",
  PARTIAL: "bg-warning/10 text-warning border-warning/20",
  RECEIVED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

export function PurchaseModal({
  purchase, suppliers, products, userId, onClose, onCreate, onReceive,
}: PurchaseModalProps) {
  const isView = purchase !== null;

  // Create mode state
  const [supplierId, setSupplierId] = useState(purchase?.supplierId ?? "");
  const [expectedDate, setExpectedDate] = useState(
    purchase?.expectedDate ? purchase.expectedDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(purchase?.notes ?? "");
  const [items, setItems] = useState<PurchaseFormItem[]>(
    purchase?.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productSku: i.productSku,
      quantityOrdered: i.quantityOrdered,
      unitCost: i.unitCost,
    })) ?? []
  );
  const [productSearch, setProductSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receive mode state
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>(
    Object.fromEntries(purchase?.items.map((i) => [i.id, String(i.quantityOrdered)]) ?? [])
  );
  const [showReceive, setShowReceive] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.status === "ACTIVE" &&
    !items.some((i) => i.productId === p.id) &&
    (!productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 8);

  const addItem = (product: InventoryProduct) => {
    setItems((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, productSku: product.sku, quantityOrdered: 1, unitCost: product.costPrice },
    ]);
    setProductSearch("");
  };

  const updateItem = (idx: number, field: "quantityOrdered" | "unitCost", value: string) => {
    setItems((prev) => prev.map((item, i) =>
      i === idx ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0);

  const handleCreate = async () => {
    if (!supplierId) { setError("Please select a supplier"); return; }
    if (items.length === 0) { setError("Add at least one item"); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate({ supplierId, expectedDate, notes, items });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!purchase) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const receiveItems: ReceivePurchaseItem[] = purchase.items.map((item) => ({
        purchaseItemId: item.id,
        productId: item.productId,
        quantityReceived: parseFloat(receivedQtys[item.id] ?? "0") || 0,
        unitCost: item.unitCost,
      }));
      await onReceive(purchase.id, receiveItems, userId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to receive purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <DialogTitle>
              {isView ? purchase.purchaseNumber : "New Purchase Order"}
            </DialogTitle>
            {isView && (
              <span className={cn(
                "ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                PURCHASE_STATUS_COLORS[purchase.status]
              )}>
                {purchase.status}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 max-h-[75vh] overflow-y-auto space-y-4">
          {isView && !showReceive ? (
            // View mode
            <>
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Supplier</p>
                  <p className="text-sm font-semibold">{purchase.supplierName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Created By</p>
                  <p className="text-sm font-semibold">{purchase.createdByName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expected</p>
                  <p className="text-sm font-semibold">{purchase.expectedDate ? new Date(purchase.expectedDate).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Received</p>
                  <p className="text-sm font-semibold">{purchase.receivedDate ? new Date(purchase.receivedDate).toLocaleDateString() : "—"}</p>
                </div>
                {purchase.notes && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm">{purchase.notes}</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Product</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Ordered</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Received</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Unit Cost</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/30">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{item.productSku}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center">{item.quantityOrdered}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={cn(
                            "font-semibold",
                            item.quantityReceived >= item.quantityOrdered ? "text-success" :
                            item.quantityReceived > 0 ? "text-warning" : "text-muted-foreground"
                          )}>
                            {item.quantityReceived}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">${item.unitCost.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">${item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">TOTAL</td>
                      <td className="px-3 py-2.5 text-right font-bold">${purchase.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {(purchase.status === "ORDERED" || purchase.status === "PARTIAL" || purchase.status === "DRAFT") && (
                <Button onClick={() => setShowReceive(true)} className="w-full gap-2">
                  Mark Items as Received
                </Button>
              )}
            </>
          ) : isView && showReceive ? (
            // Receive mode
            <>
              <p className="text-sm text-muted-foreground">Enter the quantities actually received for each item:</p>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Product</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Ordered</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items.map((item) => (
                      <tr key={item.id} className="border-b border-border/30">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{item.productSku}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{item.quantityOrdered}</td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="number"
                            min="0"
                            max={item.quantityOrdered}
                            value={receivedQtys[item.id] ?? ""}
                            onChange={(e) => setReceivedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="h-8 w-24 mx-auto text-center text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowReceive(false)} disabled={isSubmitting}>Back</Button>
                <Button className="flex-1" onClick={handleReceive} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Receipt"}
                </Button>
              </div>
            </>
          ) : (
            // Create mode
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Supplier <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className={cn(selectClass, !supplierId && error ? "border-destructive" : "")}
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Expected Date</Label>
                  <Input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Product search */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Add Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                {productSearch.trim() && filteredProducts.length > 0 && (
                  <div className="mt-1 rounded-xl border border-border/50 bg-popover shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addItem(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">{p.sku}</span>
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground">${p.costPrice.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items table */}
              {items.length > 0 && (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Product</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Qty</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Unit Cost</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Total</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/30">
                          <td className="px-3 py-2">
                            <p className="font-medium text-xs">{item.productName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{item.productSku}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantityOrdered}
                              onChange={(e) => updateItem(idx, "quantityOrdered", e.target.value)}
                              className="h-7 w-20 mx-auto text-center text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                              className="h-7 w-24 mx-auto text-center text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-xs">
                            ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeItem(idx)}
                              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 mx-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20">
                        <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">SUBTOTAL</td>
                        <td className="px-3 py-2 text-right font-bold">${subtotal.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border/50">
                  <Plus className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No items added yet</p>
                  <p className="text-xs text-muted-foreground/60">Search for products above</p>
                </div>
              )}

              {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button className="flex-1" onClick={handleCreate} disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Purchase Order"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
