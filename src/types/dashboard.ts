// Dashboard data types — shared between IPC handler and renderer

export interface DailyStats {
  amount: number;
  count: number;
  /** Percentage change vs the previous period (positive = up) */
  change: number;
}

export interface DashboardStats {
  todaySales: DailyStats;
  monthRevenue: DailyStats;
  totalProducts: number;
  lowStockCount: number;
  activeCustomers: number;
  pendingPurchases: number;
}

export interface ChartDataPoint {
  /** Display label, e.g. "Mon" or "Jan 08" */
  label: string;
  /** Raw ISO date string YYYY-MM-DD */
  date: string;
  revenue: number;
  transactions: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  totalSold: number;
  revenue: number;
}

export interface RecentTransaction {
  id: string;
  saleNumber: string;
  customerName: string | null;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
}

export interface DashboardData {
  stats: DashboardStats;
  salesChart: ChartDataPoint[];
  topProducts: TopProduct[];
  recentTransactions: RecentTransaction[];
  lowStockProducts: LowStockProduct[];
  generatedAt: string;
}
