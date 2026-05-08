"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, RotateCcw, Loader2 } from "lucide-react";
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
import type { InventoryProduct, StockAdjustInput } from "@/types/inventory";

interface StockAdjustModalProps {
  product: InventoryProduct | null;
  userId: string;
  onClose: () => void;
  onAdjust: (input: StockAdjustInput) => Promise<void>;
}

type MovementType = "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "OPENING_STOCK";

const TYPES: Array<{ id: MovementType; label: string; icon: React.ElementType; color: string }> = [
  { id: "ADJUSTMENT_IN", label: "Stock In", icon: TrendingUp, color: "text-success border-success/30 bg-success/5 data-[active=true]:bg-success/15 data-[active=true]:border-success/50" },
  { id: "ADJUSTMENT_OUT", label: "Stock Out", icon: TrendingDown, color: "text-destructive border-destructive/30 bg-destructive/5 data-[active=true]:bg-destructive/15 data-[active=true]:border-destructive/50" },
  { id: "OPENING_STOCK", label: "Set Stock", icon: RotateCcw, color: "text-primary border-primary/30 bg-primary/5 data-[active=true]:bg-primary/15 data-[active=true]:border-primary/50" },
];

export function StockAdjustModal({ product, userId, onClose, onAdjust }: StockAdjustModalProps) {
  const [movementType, setMovementType] = useState<MovementType>("ADJUSTMENT_IN");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const qty = parseFloat(quantity) || 0;
  const current = product.stockQuantity;

  let projected = current;
  if (movementType === "ADJUSTMENT_IN") projected = current + qty;
  else if (movementType === "ADJUSTMENT_OUT") projected = current - qty;
  else if (movementType === "OPENING_STOCK") projected = qty;

  const isValid = qty > 0 && (movementType !== "ADJUSTMENT_OUT" || projected >= 0);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onAdjust({ productId: product.id, movementType, quantity: qty, notes, userId });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Adjustment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full p-0">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Product info */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current stock:</span>
              <span className={cn(
                "text-sm font-bold tabular-nums",
                current <= 0 ? "text-destructive" : current <= product.minStockLevel ? "text-warning" : "text-foreground"
              )}>
                {current} {product.unit}
              </span>
            </div>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                data-active={movementType === id}
                onClick={() => setMovementType(id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-all",
                  color
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="adj-qty" className="text-xs text-muted-foreground mb-1.5 block">
              {movementType === "OPENING_STOCK" ? "Set Quantity To" : "Quantity"}
            </Label>
            <Input
              id="adj-qty"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="text-lg font-bold"
            />
          </div>

          {/* Projected result */}
          {qty > 0 && (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Current</span>
                <span className="font-semibold">{current} {product.unit}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Change</span>
                <span className={cn("font-semibold",
                  movementType === "ADJUSTMENT_IN" ? "text-success" :
                  movementType === "ADJUSTMENT_OUT" ? "text-destructive" : "text-primary"
                )}>
                  {movementType === "ADJUSTMENT_IN" ? "+" : movementType === "ADJUSTMENT_OUT" ? "-" : "→"}{qty}
                </span>
              </div>
              <div className="border-t border-border/40 pt-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground font-semibold">New Stock</span>
                <span className={cn("font-bold text-sm",
                  projected < 0 ? "text-destructive" : projected <= product.minStockLevel ? "text-warning" : "text-foreground"
                )}>
                  {projected} {product.unit}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="adj-notes" className="text-xs text-muted-foreground mb-1.5 block">
              Notes <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <textarea
              id="adj-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
