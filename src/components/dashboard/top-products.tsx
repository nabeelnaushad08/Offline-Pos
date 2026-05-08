"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopProduct } from "@/types/dashboard";

interface TopProductsProps {
  products: TopProduct[];
  isLoading?: boolean;
}

export function TopProducts({ products, isLoading }: TopProductsProps) {
  const maxSold = products.length > 0 ? Math.max(...products.map((p) => p.totalSold)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
      className="flex flex-col"
    >
      <Card className="border-border/50 flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => {
                const barWidth = maxSold > 0 ? Math.max(4, (product.totalSold / maxSold) * 100) : 4;
                return (
                  <div key={product.id}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-medium text-foreground truncate">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <span className="text-xs text-muted-foreground">
                          {product.totalSold} sold
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          ${product.revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
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
