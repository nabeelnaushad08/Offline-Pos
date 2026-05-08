"use client";

import { ShoppingCart, Trash2, RotateCcw, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePosStore } from "@/store/pos-store";

interface HeldBillsModalProps {
  open: boolean;
  onClose: () => void;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function HeldBillsModal({ open, onClose }: HeldBillsModalProps) {
  const { heldBills, restoreHeld, deleteHeld } = usePosStore();

  const handleRestore = (id: string) => {
    restoreHeld(id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full p-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <DialogTitle>Held Bills</DialogTitle>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {heldBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No held bills</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Hold a cart to park it temporarily
              </p>
            </div>
          ) : (
            heldBills.map((bill) => {
              const itemCount = bill.items.reduce((s, i) => s + i.quantity, 0);
              const total = bill.items.reduce(
                (s, i) =>
                  s +
                  (i.quantity * i.unitPrice -
                    i.itemDiscount) *
                    (1 + i.taxRate / 100),
                0
              ) - bill.cartDiscount;

              return (
                <div
                  key={bill.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {bill.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {itemCount} item{itemCount !== 1 ? "s" : ""} · $
                      {Math.max(0, total).toFixed(2)}
                      {bill.customerName && ` · ${bill.customerName}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {timeLabel(bill.heldAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHeld(bill.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(bill.id)}
                      className="h-8 gap-1.5 text-xs px-3"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
