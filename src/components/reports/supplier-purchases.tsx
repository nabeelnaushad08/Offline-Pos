"use client";

import { Building2, ShoppingBag, DollarSign, AlertCircle, Download, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SupplierPurchaseRow } from "@/types/reports";

interface Props {
  data: SupplierPurchaseRow[];
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function exportSuppliersCsv(data: SupplierPurchaseRow[]) {
  const headers = ["Supplier", "Total Orders", "Total Amount", "Paid Amount", "Pending Amount", "Last Order"];
  const rows = data.map((r) => [
    `"${r.supplierName}"`,
    r.totalOrders,
    r.totalAmount.toFixed(2),
    r.paidAmount.toFixed(2),
    r.pendingAmount.toFixed(2),
    r.lastOrderDate ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplier-purchases-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SupplierPurchasesReport({ data, isLoading }: Props) {
  const totalOrders = data.reduce((s, r) => s + r.totalOrders, 0);
  const totalAmount = data.reduce((s, r) => s + r.totalAmount, 0);
  const totalPaid = data.reduce((s, r) => s + r.paidAmount, 0);
  const totalPending = data.reduce((s, r) => s + r.pendingAmount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const stats = [
    { label: "Total Suppliers", value: data.length.toString(), icon: Building2, color: "text-foreground" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-foreground" },
    { label: "Total Purchased", value: fmt(totalAmount), icon: DollarSign, color: "text-primary" },
    { label: "Outstanding Balance", value: fmt(totalPending), icon: AlertCircle, color: totalPending > 0 ? "text-warning" : "text-success" },
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
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportSuppliersCsv(data)}>
          <Download className="h-3.5 w-3.5" />Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
      </div>

      {/* Supplier cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((r) => {
            const paidPct = r.totalAmount > 0 ? (r.paidAmount / r.totalAmount) * 100 : 0;
            return (
              <div key={r.supplierId} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.supplierName}</p>
                      <p className="text-[10px] text-muted-foreground">{r.totalOrders} order{r.totalOrders !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    r.pendingAmount > 0
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-success/40 bg-success/10 text-success"
                  )}>
                    {r.pendingAmount > 0 ? "Has Balance" : "Settled"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Purchased</span>
                    <span className="font-mono font-semibold text-foreground">{fmt(r.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-mono text-success">{fmt(r.paidAmount)}</span>
                  </div>
                  {r.pendingAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-mono font-bold text-warning">{fmt(r.pendingAmount)}</span>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Payment progress</span>
                      <span>{paidPct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", paidPct >= 100 ? "bg-success" : "bg-primary")}
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>
                  {r.lastOrderDate && (
                    <p className="text-[10px] text-muted-foreground pt-1">Last order: {r.lastOrderDate}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No supplier data for selected range</td></tr>
            ) : (
              data.map((r) => (
                <tr key={r.supplierId} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{r.supplierName}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-foreground">{r.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">{fmt(r.totalAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-success">{fmt(r.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold">
                    <span className={r.pendingAmount > 0 ? "text-warning" : "text-muted-foreground"}>
                      {r.pendingAmount > 0 ? fmt(r.pendingAmount) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{r.lastOrderDate ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr className="border-t border-border/50 bg-muted/20">
                <td className="px-4 py-2.5 text-xs font-semibold text-foreground">Totals</td>
                <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">{totalOrders}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-foreground">{fmt(totalAmount)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-success">{fmt(totalPaid)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-warning">{totalPending > 0 ? fmt(totalPending) : "—"}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
