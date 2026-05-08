"use client";

import { DollarSign, ShoppingBag, TrendingUp, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TopProductRow } from "@/types/reports";

interface Props {
  data: TopProductRow[];
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function exportTopProductsCsv(data: TopProductRow[]) {
  const headers = ["Rank", "Product", "SKU", "Category", "Units Sold", "Revenue", "COGS", "Profit", "Margin %"];
  const rows = data.map((r) => [
    r.rank,
    `"${r.name}"`,
    r.sku,
    r.categoryName,
    r.totalSold,
    r.revenue.toFixed(2),
    r.cost.toFixed(2),
    r.profit.toFixed(2),
    r.profitMargin.toFixed(1),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "top-products-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function TopProductsReport({ data, isLoading }: Props) {
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = data.reduce((s, r) => s + r.profit, 0);
  const totalSold = data.reduce((s, r) => s + r.totalSold, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: fmt(totalRevenue), icon: DollarSign, color: "text-primary" },
    { label: "Total Profit", value: fmt(totalProfit), icon: TrendingUp, color: "text-success" },
    { label: "Units Sold", value: totalSold.toLocaleString(), icon: ShoppingBag, color: "text-foreground" },
    { label: "Avg Margin", value: `${overallMargin.toFixed(1)}%`, icon: TrendingUp, color: overallMargin >= 30 ? "text-success" : "text-warning" },
  ];

  return (
    <div className="space-y-4" id="report-print-area">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportTopProductsCsv(data)}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
      </div>

      {/* Visual bars + table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Units Sold</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">COGS</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margin</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Share</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No data for selected range</td></tr>
            ) : (
              data.map((r) => {
                const share = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0;
                const rankColors = ["text-yellow-400", "text-slate-400", "text-amber-600"];
                return (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs font-bold", rankColors[r.rank - 1] ?? "text-muted-foreground")}>
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.categoryName} · {r.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-foreground">{r.totalSold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">{fmt(r.revenue)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{fmt(r.cost)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-success">{fmt(r.profit)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={cn("font-medium", r.profitMargin >= 30 ? "text-success" : r.profitMargin >= 15 ? "text-warning" : "text-destructive")}>
                        {r.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
