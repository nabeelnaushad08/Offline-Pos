"use client";

import dynamic from "next/dynamic";
import { TrendingUp, ShoppingCart, DollarSign, BarChart2, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DailySalesRow } from "@/types/reports";

const Chart = dynamic(
  () => import("./report-charts-inner").then((m) => m.DailySalesChartInner),
  { ssr: false, loading: () => <Skeleton className="w-full h-[200px]" /> }
);

interface Props {
  data: DailySalesRow[];
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function pct(a: number, b: number): number {
  if (b === 0) return a > 0 ? 100 : 0;
  return Math.round(((a - b) / b) * 1000) / 10;
}

export function exportDailyCsv(data: DailySalesRow[]) {
  const headers = ["Date", "Revenue", "Cost (COGS)", "Gross Profit", "Margin %", "Transactions", "Avg Order Value"];
  const rows = data.map((r) => [
    r.date,
    r.revenue.toFixed(2),
    r.cost.toFixed(2),
    r.profit.toFixed(2),
    r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : "0.0",
    r.transactions,
    r.avgOrderValue.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "daily-sales-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DailySalesReport({ data, isLoading }: Props) {
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const totalCost = data.reduce((s, r) => s + r.cost, 0);
  const totalProfit = data.reduce((s, r) => s + r.profit, 0);
  const totalTransactions = data.reduce((s, r) => s + r.transactions, 0);
  const avgOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const grossMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // compare first half vs second half
  const half = Math.floor(data.length / 2);
  const firstRev = data.slice(0, half).reduce((s, r) => s + r.revenue, 0);
  const secondRev = data.slice(half).reduce((s, r) => s + r.revenue, 0);
  const revChange = pct(secondRev, firstRev);

  const stats = [
    { label: "Total Revenue", value: fmt(totalRevenue), icon: DollarSign, change: revChange, color: "text-primary" },
    { label: "Gross Profit", value: fmt(totalProfit), icon: TrendingUp, suffix: `${grossMargin.toFixed(1)}% margin`, color: "text-success" },
    { label: "Total Orders", value: totalTransactions.toLocaleString(), icon: ShoppingCart, color: "text-foreground" },
    { label: "Avg Order Value", value: fmt(avgOrder), icon: BarChart2, color: "text-foreground" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4" id="report-print-area">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
            {s.change !== undefined && (
              <p className={cn("text-[10px] mt-0.5", s.change >= 0 ? "text-success" : "text-destructive")}>
                {s.change >= 0 ? "+" : ""}{s.change}% vs prev period
              </p>
            )}
            {s.suffix && <p className="text-[10px] mt-0.5 text-muted-foreground">{s.suffix}</p>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Revenue & Profit Trend</p>
            <p className="text-xs text-muted-foreground">{data.length} days shown</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-primary" />Revenue</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#4ade80" }} />Profit</span>
          </div>
        </div>
        <Chart data={data} />
      </div>

      {/* Export / Print */}
      <div className="flex items-center gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportDailyCsv(data)}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">COGS</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Profit</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margin</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Order</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No data for selected range</td></tr>
              ) : (
                data.map((r) => {
                  const margin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
                  return (
                    <tr key={r.date} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-medium text-foreground">{r.date}</p>
                        <p className="text-[10px] text-muted-foreground">{r.dayLabel.split(",")[0]}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs font-medium text-foreground">{fmt(r.revenue)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{fmt(r.cost)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-success">{fmt(r.profit)}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <span className={cn("font-medium", margin >= 30 ? "text-success" : margin >= 15 ? "text-warning" : "text-destructive")}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-foreground">{r.transactions}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{fmt(r.avgOrderValue)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr className="border-t border-border/50 bg-muted/20">
                  <td className="px-4 py-2.5 text-xs font-semibold text-foreground">Totals</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-foreground">{fmt(totalRevenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-muted-foreground">{fmt(totalCost)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-success">{fmt(totalProfit)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">{grossMargin.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">{totalTransactions}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-muted-foreground">{fmt(avgOrder)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
