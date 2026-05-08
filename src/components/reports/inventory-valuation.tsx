"use client";

import { useState } from "react";
import { Package, DollarSign, TrendingUp, Download, Printer, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryValuationSummary } from "@/types/reports";

interface Props {
  data: InventoryValuationSummary | null;
  isLoading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export function exportValuationCsv(data: InventoryValuationSummary) {
  const headers = ["Name", "SKU", "Category", "Unit", "Stock Qty", "Cost Price", "Selling Price", "Stock Value", "Retail Value", "Potential Profit"];
  const rows = data.rows.map((r) => [
    `"${r.name}"`,
    r.sku,
    r.categoryName,
    r.unit,
    r.stockQuantity,
    r.costPrice.toFixed(2),
    r.sellingPrice.toFixed(2),
    r.stockValue.toFixed(2),
    r.retailValue.toFixed(2),
    r.potentialProfit.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory-valuation-report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function InventoryValuationReport({ data, isLoading }: Props) {
  const [search, setSearch] = useState("");

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

  if (!data) return null;

  const filtered = search
    ? data.rows.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.sku.toLowerCase().includes(search.toLowerCase()) ||
        r.categoryName.toLowerCase().includes(search.toLowerCase())
      )
    : data.rows;

  const stats = [
    { label: "Products in Stock", value: data.totalProducts.toLocaleString(), icon: Package, color: "text-foreground" },
    { label: "Stock Value (Cost)", value: fmt(data.totalStockValue), icon: DollarSign, color: "text-primary" },
    { label: "Retail Value", value: fmt(data.totalRetailValue), icon: TrendingUp, color: "text-foreground" },
    { label: "Potential Profit", value: fmt(data.totalPotentialProfit), icon: TrendingUp, color: "text-success" },
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

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto print:hidden">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportValuationCsv(data)}>
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />Print
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sell Price</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock Value</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retail Value</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pot. Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No products found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.sku}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.categoryName}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-foreground">{r.stockQuantity.toLocaleString()} {r.unit}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{fmt(r.costPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.sellingPrice)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-medium text-primary">{fmt(r.stockValue)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-foreground">{fmt(r.retailValue)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-success">{fmt(r.potentialProfit)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t border-border/50 bg-muted/20">
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-foreground">{filtered.length} products</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-primary">
                    {fmt(filtered.reduce((s, r) => s + r.stockValue, 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-foreground">
                    {fmt(filtered.reduce((s, r) => s + r.retailValue, 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-success">
                    {fmt(filtered.reduce((s, r) => s + r.potentialProfit, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
