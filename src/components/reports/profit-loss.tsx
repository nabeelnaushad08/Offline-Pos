"use client";

import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, DollarSign, Percent, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthlySalesRow } from "@/types/reports";

const Chart = dynamic(
  () => import("./report-charts-inner").then((m) => m.ProfitLossChartInner),
  { ssr: false, loading: () => <Skeleton className="w-full h-[200px]" /> }
);

interface Props {
  data: MonthlySalesRow[];
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function exportPLCsv(data: MonthlySalesRow[]) {
  const headers = ["Period", "Revenue", "COGS", "Gross Profit", "Gross Margin %"];
  const rows = data.map((r) => [
    r.label,
    r.revenue.toFixed(2),
    r.cost.toFixed(2),
    r.profit.toFixed(2),
    r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : "0.0",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "profit-loss-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ProfitLossReport({ data, isLoading }: Props) {
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalCogs = data.reduce((s, r) => s + r.cost, 0);
  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const isProfitable = grossProfit >= 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4" id="report-print-area">
      {/* P&L Statement Summary */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Profit & Loss Statement</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Total Revenue (Sales)</span>
            </div>
            <span className="font-mono text-sm font-bold text-primary">{fmt(totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-foreground">Cost of Goods Sold</span>
            </div>
            <span className="font-mono text-sm font-bold text-destructive">({fmt(totalCogs)})</span>
          </div>
          <div className="flex items-center justify-between py-3 rounded-lg bg-muted/30 px-2">
            <div className="flex items-center gap-2">
              {isProfitable ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-semibold text-foreground">Gross Profit</span>
            </div>
            <span className={cn("font-mono text-base font-bold", isProfitable ? "text-success" : "text-destructive")}>
              {fmt(grossProfit)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Gross Margin</span>
            </div>
            <span className={cn("font-mono text-sm font-semibold", grossMargin >= 30 ? "text-success" : grossMargin >= 15 ? "text-warning" : "text-destructive")}>
              {grossMargin.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Monthly breakdown chart */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Monthly Gross Profit</p>
            <p className="text-xs text-muted-foreground">Green = profit · Red = loss</p>
          </div>
        </div>
        <Chart data={data} />
      </div>

      {/* Export / Print */}
      <div className="flex items-center gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportPLCsv(data)}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">COGS</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Profit</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margin %</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transactions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No data for selected range</td></tr>
            ) : (
              data.map((r) => {
                const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                return (
                  <tr key={r.month} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">{r.label}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.revenue)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{fmt(r.cost)}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-semibold", r.profit >= 0 ? "text-success" : "text-destructive")}>
                      {r.profit >= 0 ? "" : "-"}{fmt(Math.abs(r.profit))}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs">
                      <span className={cn("font-medium", margin >= 30 ? "text-success" : margin >= 15 ? "text-warning" : "text-destructive")}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground">{r.transactions.toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr className="border-t border-border/50 bg-muted/20">
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground">Total</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-foreground">{fmt(totalRevenue)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-muted-foreground">{fmt(totalCogs)}</td>
                <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", isProfitable ? "text-success" : "text-destructive")}>
                  {fmt(grossProfit)}
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">{grossMargin.toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">
                  {data.reduce((s, r) => s + r.transactions, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
