"use client";

import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { InventoryProduct } from "@/types/inventory";

interface LowStockBannerProps {
  products: InventoryProduct[];
  onViewLowStock: () => void;
}

export function LowStockBanner({ products, onViewLowStock }: LowStockBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const outOfStock = products.filter((p) => p.isTrackStock && p.stockQuantity <= 0);
  const lowStock = products.filter(
    (p) => p.isTrackStock && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
  );

  if (dismissed || (outOfStock.length === 0 && lowStock.length === 0)) return null;

  return (
    <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Stock Alert
            {outOfStock.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                {outOfStock.length} OUT OF STOCK
              </span>
            )}
            {lowStock.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                {lowStock.length} LOW STOCK
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {outOfStock.length > 0 && (
              <>
                <span className="text-destructive font-medium">
                  {outOfStock.slice(0, 3).map((p) => p.name).join(", ")}
                  {outOfStock.length > 3 && ` +${outOfStock.length - 3} more`}
                </span>
                {lowStock.length > 0 && " · "}
              </>
            )}
            {lowStock.length > 0 && (
              <span className="text-warning font-medium">
                {lowStock.slice(0, 2).map((p) => p.name).join(", ")}
                {lowStock.length > 2 && ` +${lowStock.length - 2} more need reorder`}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewLowStock}
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
