"use client";

import { motion } from "framer-motion";
import { AlertTriangle, PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LowStockProduct } from "@/types/dashboard";

interface LowStockAlertsProps {
  products: LowStockProduct[];
  isLoading?: boolean;
}

function stockLevel(qty: number, min: number): "critical" | "warning" | "low" {
  if (qty === 0) return "critical";
  if (qty <= min * 0.25) return "critical";
  if (qty <= min * 0.5) return "warning";
  return "low";
}

export function LowStockAlerts({ products, isLoading }: LowStockAlertsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.22 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Low Stock</CardTitle>
            {!isLoading && products.length > 0 && (
              <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                {products.length} item{products.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <PackageX className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-foreground">All stocked up!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                No items below reorder level
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {products.map((product) => {
                const level = stockLevel(product.stockQuantity, product.minStockLevel);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        level === "critical" && "bg-destructive/10",
                        level === "warning" && "bg-warning/10",
                        level === "low" && "bg-orange-500/10"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "h-3.5 w-3.5",
                          level === "critical" && "text-destructive",
                          level === "warning" && "text-warning",
                          level === "low" && "text-orange-500"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {product.sku} · min {product.minStockLevel} {product.unit}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] font-semibold",
                        level === "critical" && "border-destructive/30 text-destructive bg-destructive/5",
                        level === "warning" && "border-warning/30 text-warning bg-warning/5",
                        level === "low" && "border-orange-500/30 text-orange-500 bg-orange-500/5"
                      )}
                    >
                      {product.stockQuantity} {product.unit}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
