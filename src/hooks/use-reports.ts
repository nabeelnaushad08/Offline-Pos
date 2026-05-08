"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isElectron } from "@/lib/utils";
import {
  getMockDailySales,
  getMockMonthlySales,
  getMockTopProducts,
  getMockInventoryValuation,
  getMockCashFlow,
  getMockSupplierPurchases,
} from "@/lib/reports-mock";
import type {
  ReportTab,
  DatePreset,
  DateRange,
  DailySalesRow,
  MonthlySalesRow,
  TopProductRow,
  InventoryValuationSummary,
  CashFlowRow,
  SupplierPurchaseRow,
} from "@/types/reports";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getPresetRange(preset: DatePreset): DateRange {
  const today = new Date();
  const todayStr = toIso(today);

  switch (preset) {
    case "today":
      return { from: todayStr, to: todayStr };
    case "last7": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: toIso(d), to: todayStr };
    }
    case "last30": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: toIso(d), to: todayStr };
    }
    case "thisMonth": {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toIso(d), to: todayStr };
    }
    case "lastMonth": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toIso(first), to: toIso(last) };
    }
    case "last3months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { from: toIso(d), to: todayStr };
    }
    case "thisYear": {
      const d = new Date(today.getFullYear(), 0, 1);
      return { from: toIso(d), to: todayStr };
    }
    default:
      return { from: todayStr, to: todayStr };
  }
}

interface ReportsState {
  activeReport: ReportTab;
  preset: DatePreset;
  dateRange: DateRange;
  isLoading: boolean;
  dailySales: DailySalesRow[];
  monthlySales: MonthlySalesRow[];
  topProducts: TopProductRow[];
  inventoryValuation: InventoryValuationSummary | null;
  cashFlow: CashFlowRow[];
  supplierPurchases: SupplierPurchaseRow[];
  setActiveReport: (tab: ReportTab) => void;
  setPreset: (p: DatePreset) => void;
  setDateRange: (r: DateRange) => void;
  refresh: () => void;
}

export function useReports(): ReportsState {
  const [activeReport, setActiveReportState] = useState<ReportTab>("daily");
  const [preset, setPresetState] = useState<DatePreset>("last30");
  const [dateRange, setDateRangeState] = useState<DateRange>(getPresetRange("last30"));
  const [isLoading, setIsLoading] = useState(false);

  const [dailySales, setDailySales] = useState<DailySalesRow[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<InventoryValuationSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowRow[]>([]);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchaseRow[]>([]);

  const loadRef = useRef(0);

  const load = useCallback(
    async (report: ReportTab, range: DateRange) => {
      const token = ++loadRef.current;
      setIsLoading(true);
      try {
        if (isElectron()) {
          const e = window.electron;
          switch (report) {
            case "daily": {
              const data = await e.invoke<DailySalesRow[]>("reports:dailySales", range.from, range.to);
              if (loadRef.current === token) setDailySales(data);
              break;
            }
            case "monthly":
            case "profit-loss": {
              const data = await e.invoke<MonthlySalesRow[]>("reports:monthlySales", range.from, range.to);
              if (loadRef.current === token) setMonthlySales(data);
              break;
            }
            case "top-products": {
              const data = await e.invoke<TopProductRow[]>("reports:topProducts", range.from, range.to);
              if (loadRef.current === token) setTopProducts(data);
              break;
            }
            case "inventory": {
              const data = await e.invoke<InventoryValuationSummary>("reports:inventoryValuation");
              if (loadRef.current === token) setInventoryValuation(data);
              break;
            }
            case "cash-flow": {
              const data = await e.invoke<CashFlowRow[]>("reports:cashFlow", range.from, range.to);
              if (loadRef.current === token) setCashFlow(data);
              break;
            }
            case "suppliers": {
              const data = await e.invoke<SupplierPurchaseRow[]>("reports:supplierPurchases", range.from, range.to);
              if (loadRef.current === token) setSupplierPurchases(data);
              break;
            }
          }
        } else {
          // Mock data
          await new Promise((r) => setTimeout(r, 180)); // simulate latency
          if (loadRef.current !== token) return;
          switch (report) {
            case "daily":
              setDailySales(getMockDailySales(range));
              break;
            case "monthly":
            case "profit-loss":
              setMonthlySales(getMockMonthlySales(range));
              break;
            case "top-products":
              setTopProducts(getMockTopProducts(range));
              break;
            case "inventory":
              setInventoryValuation(getMockInventoryValuation());
              break;
            case "cash-flow":
              setCashFlow(getMockCashFlow(range));
              break;
            case "suppliers":
              setSupplierPurchases(getMockSupplierPurchases(range));
              break;
          }
        }
      } finally {
        if (loadRef.current === token) setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(activeReport, dateRange);
  }, [activeReport, dateRange.from, dateRange.to, load]);

  const setActiveReport = (tab: ReportTab) => {
    setActiveReportState(tab);
  };

  const setPreset = (p: DatePreset) => {
    setPresetState(p);
    if (p !== "custom") {
      setDateRangeState(getPresetRange(p));
    }
  };

  const setDateRange = (r: DateRange) => {
    setPresetState("custom");
    setDateRangeState(r);
  };

  const refresh = () => load(activeReport, dateRange);

  return {
    activeReport,
    preset,
    dateRange,
    isLoading,
    dailySales,
    monthlySales,
    topProducts,
    inventoryValuation,
    cashFlow,
    supplierPurchases,
    setActiveReport,
    setPreset,
    setDateRange,
    refresh,
  };
}
