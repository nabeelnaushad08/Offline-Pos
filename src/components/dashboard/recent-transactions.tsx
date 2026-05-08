"use client";

import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RecentTransaction } from "@/types/dashboard";

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "border-success/30 text-success bg-success/5",
  VOIDED: "border-destructive/30 text-destructive bg-destructive/5",
  REFUNDED: "border-warning/30 text-warning bg-warning/5",
  PENDING: "border-muted-foreground/30 text-muted-foreground bg-muted/30",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile",
  BANK_TRANSFER: "Bank",
  CREDIT: "Credit",
  SPLIT: "Split",
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.18 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  {/* Icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {tx.saleNumber}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.customerName ?? "Walk-in"} · {tx.itemCount} item{tx.itemCount !== 1 ? "s" : ""} · {timeAgo(tx.createdAt)}
                    </p>
                  </div>

                  {/* Payment + status */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-semibold text-foreground">
                      ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">
                        {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] px-1.5 py-0 h-4 font-medium",
                          STATUS_STYLES[tx.status] ?? "border-border text-muted-foreground"
                        )}
                      >
                        {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
