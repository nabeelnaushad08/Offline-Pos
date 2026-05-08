"use client";

import { BarChart3, Calendar, RefreshCw, TrendingUp, ShoppingBag, Package, ArrowUpDown, Building2 } from "lucide-react";
import { useReports, getPresetRange } from "@/hooks/use-reports";
import { DailySalesReport } from "@/components/reports/daily-sales";
import { MonthlySalesReport } from "@/components/reports/monthly-sales";
import { ProfitLossReport } from "@/components/reports/profit-loss";
import { InventoryValuationReport } from "@/components/reports/inventory-valuation";
import { TopProductsReport } from "@/components/reports/top-products-report";
import { CashFlowReport } from "@/components/reports/cash-flow";
import { SupplierPurchasesReport } from "@/components/reports/supplier-purchases";
import { cn } from "@/lib/utils";
import type { ReportTab, DatePreset } from "@/types/reports";

type TabConfig = { id: ReportTab; label: string; icon: React.ElementType };

const TABS: TabConfig[] = [
  { id: "daily", label: "Daily Sales", icon: TrendingUp },
  { id: "monthly", label: "Monthly Sales", icon: BarChart3 },
  { id: "profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { id: "inventory", label: "Inventory Value", icon: Package },
  { id: "top-products", label: "Top Products", icon: ShoppingBag },
  { id: "cash-flow", label: "Cash Flow", icon: ArrowUpDown },
  { id: "suppliers", label: "Supplier Purchases", icon: Building2 },
];

const PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisMonth", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
  { id: "last3months", label: "Last 3 Months" },
  { id: "thisYear", label: "This Year" },
  { id: "custom", label: "Custom" },
];

export default function ReportsPage() {
  const reports = useReports();
  const { activeReport, preset, dateRange, isLoading } = reports;

  const isInventory = activeReport === "inventory";

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isInventory ? "Real-time inventory snapshot" : `${dateRange.from} – ${dateRange.to}`}
          </p>
        </div>
        <button
          onClick={reports.refresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Date Range Controls (hidden for inventory) */}
      {!isInventory && (
        <div className="shrink-0 mb-4 space-y-2">
          {/* Preset pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {PRESETS.filter((p) => p.id !== "custom").map((p) => (
              <button
                key={p.id}
                onClick={() => reports.setPreset(p.id)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  preset === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-background">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dateRange.from}
                max={dateRange.to}
                onChange={(e) => reports.setDateRange({ from: e.target.value, to: dateRange.to })}
                className="text-xs text-foreground bg-transparent focus:outline-none w-28"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.to}
                min={dateRange.from}
                onChange={(e) => reports.setDateRange({ from: dateRange.from, to: e.target.value })}
                className="text-xs text-foreground bg-transparent focus:outline-none w-28"
              />
            </div>
            {preset === "custom" && (
              <span className="text-[10px] text-muted-foreground border border-border/50 rounded-full px-2 py-0.5">Custom range</span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-0.5 border-b border-border/50 mb-4 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => reports.setActiveReport(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              activeReport === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Report content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {activeReport === "daily" && (
          <DailySalesReport data={reports.dailySales} isLoading={isLoading} />
        )}
        {activeReport === "monthly" && (
          <MonthlySalesReport data={reports.monthlySales} isLoading={isLoading} />
        )}
        {activeReport === "profit-loss" && (
          <ProfitLossReport data={reports.monthlySales} isLoading={isLoading} />
        )}
        {activeReport === "inventory" && (
          <InventoryValuationReport data={reports.inventoryValuation} isLoading={isLoading} />
        )}
        {activeReport === "top-products" && (
          <TopProductsReport data={reports.topProducts} isLoading={isLoading} />
        )}
        {activeReport === "cash-flow" && (
          <CashFlowReport data={reports.cashFlow} isLoading={isLoading} />
        )}
        {activeReport === "suppliers" && (
          <SupplierPurchasesReport data={reports.supplierPurchases} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
