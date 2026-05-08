"use client";

import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, ArrowUpDown, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CashFlowRow } from "@/types/reports";

const Chart = dynamic(
  () => import("./report-charts-inner").then((m) => m.CashFlowChartInner),
  { ssr: false, loading: () => <Skeleton className="w-full h-[200px]" /> }
);

interface Props {
  data: CashFlowRow[];
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function exportCashFlowCsv(data: CashFlowRow[]) {
  const headers = ["Date", "Sales Inflow", "Purchase Outflow", "Net Flow", "Running Balance"];
  const rows = data.map((r) => [
    r.date,
    r.salesInflow.toFixed(2),
    r.purchaseOutflow.toFixed(2),
    r.netFlow.toFixed(2),
    r.runningBalance.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cash-flow-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CashFlowReport({ data, isLoading }: Props) {
  const totalInflow = data.reduce((s, r) => s + r.salesInflow, 0);
  const totalOutflow = data.reduce((s, r) => s + r.purchaseOutflow, 0);
  const netCashFlow = totalInflow - totalOutflow;
  const closingBalance = data.length > 0 ? data[data.length - 1].runningBalance : 0;

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

  const stats = [
    { label: "Total Inflow (Sales)", value: fmt(totalInflow), icon: TrendingUp, color: "text-success" },
    { label: "Total Outflow (Purchases)", value: fmt(totalOutflow), icon: TrendingDown, color: "text-destructive" },
    { label: "Net Cash Flow", value: fmt(netCashFlow), icon: ArrowUpDown, color: netCashFlow >= 0 ? "text-success" : "text-destructive" },
    { label: "Closing Balance", value: fmt(closingBalance), icon: TrendingUp, color: closingBalance >= 0 ? "text-primary" : "text-destructive" },
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

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Cash Flow & Balance</p>
            <p className="text-xs text-muted-foreground">{data.length} days</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-primary" />Balance</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#4ade80" }} />Inflow</span>
          </div>
        </div>
        <Chart data={data} />
      </div>

      <div className="flex items-center gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCashFlowCsv(data)}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/50 bg-muted/60 backdrop-blur-sm">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales Inflow</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Outflow</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Flow</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No data for selected range</td></tr>
              ) : (
                data.map((r) => (
                  <tr key={r.date} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-foreground">{r.date}</p>
                      <p className="text-[10px] text-muted-foreground">{r.dayLabel}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-success">{fmt(r.salesInflow)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-destructive">{r.purchaseOutflow > 0 ? `(${fmt(r.purchaseOutflow)})` : "—"}</td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-semibold", r.netFlow >= 0 ? "text-success" : "text-destructive")}>
                      {r.netFlow >= 0 ? "+" : ""}{fmt(r.netFlow)}
                    </td>
                    <td className={cn("px-4 py-2.5 text-right font-mono text-xs font-bold", r.runningBalance >= 0 ? "text-foreground" : "text-destructive")}>
                      {fmt(r.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
