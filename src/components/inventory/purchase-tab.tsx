"use client";

import { useState } from "react";
import { Plus, Eye, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PurchaseModal } from "./purchase-modal";
import type {
  InventoryPurchase,
  InventoryProduct,
  InventorySupplier,
  PurchaseFormValues,
  ReceivePurchaseItem,
} from "@/types/inventory";

interface PurchaseTabProps {
  purchases: InventoryPurchase[];
  products: InventoryProduct[];
  suppliers: InventorySupplier[];
  userId: string;
  onCreate: (data: PurchaseFormValues) => Promise<void>;
  onReceive: (purchaseId: string, items: ReceivePurchaseItem[], userId: string) => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted/80 text-muted-foreground border-muted-foreground/20",
  ORDERED: "bg-primary/10 text-primary border-primary/20",
  PARTIAL: "bg-warning/10 text-warning border-warning/20",
  RECEIVED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_FILTERS = ["ALL", "DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"];

export function PurchaseTab({ purchases, products, suppliers, userId, onCreate, onReceive }: PurchaseTabProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [viewPurchase, setViewPurchase] = useState<InventoryPurchase | null>(null);

  const filtered = purchases.filter((po) =>
    statusFilter === "ALL" || po.status === statusFilter
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/40">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 h-9 ml-auto">
          <Plus className="h-3.5 w-3.5" />
          New Purchase
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">PO Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No purchase orders</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Create a new purchase order to get started</p>
                </td>
              </tr>
            ) : (
              filtered.map((po) => (
                <tr
                  key={po.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setViewPurchase(po)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-semibold text-foreground">{po.purchaseNumber}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{po.supplierName}</p>
                    <p className="text-xs text-muted-foreground">{po.createdByName}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">{po.items.length}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {po.expectedDate ? (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(po.expectedDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      STATUS_STYLES[po.status]
                    )}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold tabular-nums">${po.totalAmount.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewPurchase(po)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mx-auto"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreate && (
        <PurchaseModal
          purchase={null}
          suppliers={suppliers}
          products={products}
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreate={onCreate}
          onReceive={onReceive}
        />
      )}
      {viewPurchase && (
        <PurchaseModal
          purchase={viewPurchase}
          suppliers={suppliers}
          products={products}
          userId={userId}
          onClose={() => setViewPurchase(null)}
          onCreate={onCreate}
          onReceive={onReceive}
        />
      )}
    </div>
  );
}
