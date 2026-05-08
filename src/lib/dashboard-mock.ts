import type { DashboardData } from "@/types/dashboard";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(iso: string, index: number): string {
  if (index === 6) return "Today";
  return DAY_LABELS[new Date(iso + "T00:00:00").getDay()];
}

export function getMockDashboardData(): DashboardData {
  const chartDates = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const baseRevenue = [1240, 980, 1560, 2100, 1780, 890, 2340];

  return {
    stats: {
      todaySales: { amount: 2340.5, count: 18, change: 12.4 },
      monthRevenue: { amount: 48920.0, count: 312, change: 8.7 },
      totalProducts: 147,
      lowStockCount: 6,
      activeCustomers: 89,
      pendingPurchases: 3,
    },
    salesChart: chartDates.map((date, i) => ({
      label: dayLabel(date, i),
      date,
      revenue: baseRevenue[i],
      transactions: Math.round(baseRevenue[i] / 130),
    })),
    topProducts: [
      { id: "1", name: "Mineral Water 1L", sku: "WTR-001", image: null, totalSold: 240, revenue: 960 },
      { id: "2", name: "White Rice 5kg", sku: "RCE-005", image: null, totalSold: 98, revenue: 2940 },
      { id: "3", name: "Cooking Oil 1L", sku: "OIL-001", image: null, totalSold: 87, revenue: 1305 },
      { id: "4", name: "Sugar 1kg", sku: "SGR-001", image: null, totalSold: 76, revenue: 760 },
      { id: "5", name: "Instant Noodles x5", sku: "NDL-005", image: null, totalSold: 65, revenue: 650 },
    ],
    recentTransactions: [
      { id: "t1", saleNumber: "SAL-20260508-0018", customerName: "Walk-in Customer", amount: 145.5, paymentMethod: "CASH", status: "COMPLETED", createdAt: new Date(Date.now() - 5 * 60000).toISOString(), itemCount: 4 },
      { id: "t2", saleNumber: "SAL-20260508-0017", customerName: "John Doe", amount: 320.0, paymentMethod: "CARD", status: "COMPLETED", createdAt: new Date(Date.now() - 22 * 60000).toISOString(), itemCount: 7 },
      { id: "t3", saleNumber: "SAL-20260508-0016", customerName: null, amount: 89.0, paymentMethod: "CASH", status: "COMPLETED", createdAt: new Date(Date.now() - 45 * 60000).toISOString(), itemCount: 2 },
      { id: "t4", saleNumber: "SAL-20260508-0015", customerName: "Mary Smith", amount: 512.75, paymentMethod: "MOBILE_MONEY", status: "COMPLETED", createdAt: new Date(Date.now() - 90 * 60000).toISOString(), itemCount: 11 },
      { id: "t5", saleNumber: "SAL-20260508-0014", customerName: null, amount: 67.0, paymentMethod: "CASH", status: "VOIDED", createdAt: new Date(Date.now() - 130 * 60000).toISOString(), itemCount: 1 },
      { id: "t6", saleNumber: "SAL-20260508-0013", customerName: "Walk-in Customer", amount: 204.0, paymentMethod: "CASH", status: "COMPLETED", createdAt: new Date(Date.now() - 180 * 60000).toISOString(), itemCount: 5 },
    ],
    lowStockProducts: [
      { id: "p1", name: "Tomato Paste 400g", sku: "TMP-400", stockQuantity: 2, minStockLevel: 10, unit: "pcs" },
      { id: "p2", name: "Sunflower Oil 2L", sku: "OIL-002", stockQuantity: 0, minStockLevel: 5, unit: "pcs" },
      { id: "p3", name: "Laundry Soap Bar", sku: "SAP-001", stockQuantity: 4, minStockLevel: 20, unit: "pcs" },
      { id: "p4", name: "AA Batteries x4", sku: "BAT-AA4", stockQuantity: 3, minStockLevel: 12, unit: "packs" },
      { id: "p5", name: "Black Pepper 50g", sku: "SPE-BLK", stockQuantity: 1, minStockLevel: 8, unit: "pcs" },
    ],
    generatedAt: new Date().toISOString(),
  };
}
