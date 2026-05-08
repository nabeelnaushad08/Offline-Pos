export type ReportTab =
  | "daily"
  | "monthly"
  | "profit-loss"
  | "inventory"
  | "top-products"
  | "cash-flow"
  | "suppliers";

export type DatePreset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "last3months"
  | "thisYear"
  | "custom";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

export interface DailySalesRow {
  date: string;
  dayLabel: string;
  revenue: number;
  cost: number;
  profit: number;
  transactions: number;
  avgOrderValue: number;
}

export interface MonthlySalesRow {
  month: string; // YYYY-MM
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  transactions: number;
  avgOrderValue: number;
}

export interface TopProductRow {
  rank: number;
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  totalSold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface InventoryValuationRow {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  unit: string;
  stockQuantity: number;
  costPrice: number;
  sellingPrice: number;
  stockValue: number;
  retailValue: number;
  potentialProfit: number;
}

export interface InventoryValuationSummary {
  totalProducts: number;
  totalStockValue: number;
  totalRetailValue: number;
  totalPotentialProfit: number;
  rows: InventoryValuationRow[];
}

export interface CashFlowRow {
  date: string;
  dayLabel: string;
  salesInflow: number;
  purchaseOutflow: number;
  netFlow: number;
  runningBalance: number;
}

export interface SupplierPurchaseRow {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  lastOrderDate: string | null;
}
