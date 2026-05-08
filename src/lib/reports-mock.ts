import type {
  DailySalesRow,
  MonthlySalesRow,
  TopProductRow,
  InventoryValuationSummary,
  CashFlowRow,
  SupplierPurchaseRow,
  DateRange,
} from "@/types/reports";

// Deterministic pseudo-random based on seed
function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function rnd(seed: number, min: number, max: number): number {
  return Math.round(seeded(seed) * (max - min) + min);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const BASE_DATE = new Date("2026-05-08");

// ── Daily Sales ───────────────────────────────────────────────────────────────

const ALL_DAILY: DailySalesRow[] = Array.from({ length: 120 }, (_, i) => {
  const date = addDays(BASE_DATE, -(119 - i));
  const dateStr = toIso(date);
  const seed = i * 7;
  const transactions = rnd(seed, 10, 45);
  const avgOrder = rnd(seed + 1, 38, 92);
  const revenue = transactions * avgOrder;
  const costPct = 0.54 + seeded(seed + 2) * 0.16;
  const cost = Math.round(revenue * costPct);
  const profit = revenue - cost;
  return {
    date: dateStr,
    dayLabel: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    revenue,
    cost,
    profit,
    transactions,
    avgOrderValue: Math.round((revenue / transactions) * 100) / 100,
  };
});

export function getMockDailySales(range: DateRange): DailySalesRow[] {
  return ALL_DAILY.filter((r) => r.date >= range.from && r.date <= range.to);
}

// ── Monthly Sales ─────────────────────────────────────────────────────────────

const ALL_MONTHLY: MonthlySalesRow[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(BASE_DATE);
  d.setDate(1);
  d.setMonth(d.getMonth() - (23 - i));
  const month = toIso(d).slice(0, 7);
  const seed = i * 13;
  const transactions = rnd(seed, 280, 980);
  const avgOrder = rnd(seed + 1, 42, 88);
  const revenue = transactions * avgOrder;
  const costPct = 0.54 + seeded(seed + 2) * 0.16;
  const cost = Math.round(revenue * costPct);
  const profit = revenue - cost;
  return {
    month,
    label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    revenue,
    cost,
    profit,
    transactions,
    avgOrderValue: Math.round((revenue / transactions) * 100) / 100,
  };
});

export function getMockMonthlySales(range: DateRange): MonthlySalesRow[] {
  const fromMonth = range.from.slice(0, 7);
  const toMonth = range.to.slice(0, 7);
  return ALL_MONTHLY.filter((r) => r.month >= fromMonth && r.month <= toMonth);
}

// ── Top Products ──────────────────────────────────────────────────────────────

export function getMockTopProducts(_range: DateRange): TopProductRow[] {
  const products = [
    { name: "Arabica Coffee Blend", sku: "COF-001", cat: "Beverages" },
    { name: "Croissant (Butter)", sku: "BAK-001", cat: "Bakery" },
    { name: "Sparkling Water 500ml", sku: "DRK-002", cat: "Beverages" },
    { name: "Avocado Toast", sku: "FNB-003", cat: "Food" },
    { name: "Latte (Large)", sku: "COF-004", cat: "Beverages" },
    { name: "Chocolate Muffin", sku: "BAK-005", cat: "Bakery" },
    { name: "Orange Juice Fresh", sku: "JUI-001", cat: "Beverages" },
    { name: "Caesar Salad", sku: "FNB-007", cat: "Food" },
    { name: "Iced Matcha Latte", sku: "COF-008", cat: "Beverages" },
    { name: "Blueberry Cheesecake", sku: "DES-002", cat: "Desserts" },
  ];
  return products.map((p, i) => {
    const seed = i * 17;
    const totalSold = rnd(seed, 120, 850);
    const revenue = totalSold * rnd(seed + 1, 4, 18);
    const cost = Math.round(revenue * (0.45 + seeded(seed + 2) * 0.2));
    const profit = revenue - cost;
    return {
      rank: i + 1,
      id: `mock-prod-${i}`,
      name: p.name,
      sku: p.sku,
      categoryName: p.cat,
      totalSold,
      revenue,
      cost,
      profit,
      profitMargin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
    };
  });
}

// ── Inventory Valuation ────────────────────────────────────────────────────────

export function getMockInventoryValuation(): InventoryValuationSummary {
  const items = [
    { name: "Arabica Coffee Beans 1kg", sku: "COF-001", cat: "Beverages", unit: "kg", qty: 85, cost: 12.5, sell: 22 },
    { name: "Croissant Dough Pack", sku: "BAK-001", cat: "Bakery", unit: "pcs", qty: 120, cost: 1.8, sell: 3.5 },
    { name: "Sparkling Water Case (24)", sku: "DRK-002", cat: "Beverages", unit: "case", qty: 45, cost: 14, sell: 24 },
    { name: "Avocado (Box 20)", sku: "FNB-003", cat: "Food", unit: "box", qty: 22, cost: 28, sell: 48 },
    { name: "Whole Milk 2L", sku: "DAI-001", cat: "Dairy", unit: "L", qty: 180, cost: 2.2, sell: 4.5 },
    { name: "Chocolate Chips 500g", sku: "BAK-005", cat: "Bakery", unit: "bag", qty: 60, cost: 4.5, sell: 8 },
    { name: "Orange Juice 1L", sku: "JUI-001", cat: "Beverages", unit: "L", qty: 90, cost: 3.2, sell: 6.5 },
    { name: "Romaine Lettuce", sku: "FNB-007", cat: "Food", unit: "pcs", qty: 55, cost: 1.5, sell: 3 },
    { name: "Matcha Powder 100g", sku: "COF-008", cat: "Beverages", unit: "g", qty: 40, cost: 8, sell: 15 },
    { name: "Cream Cheese 500g", sku: "DES-002", cat: "Dairy", unit: "pcs", qty: 35, cost: 5.5, sell: 10 },
    { name: "Blueberries 500g", sku: "FRT-001", cat: "Fresh Produce", unit: "pack", qty: 28, cost: 6, sell: 12 },
    { name: "Bread Loaf", sku: "BAK-010", cat: "Bakery", unit: "pcs", qty: 72, cost: 1.2, sell: 2.8 },
    { name: "Espresso Pods x10", sku: "COF-011", cat: "Beverages", unit: "box", qty: 95, cost: 7.5, sell: 14 },
    { name: "Sugar 1kg", sku: "DRY-001", cat: "Pantry", unit: "bag", qty: 110, cost: 1.1, sell: 2.5 },
    { name: "Vanilla Extract 50ml", sku: "DRY-002", cat: "Pantry", unit: "bottle", qty: 30, cost: 4, sell: 8.5 },
  ];
  const rows = items.map((it) => {
    const stockValue = Math.round(it.qty * it.cost * 100) / 100;
    const retailValue = Math.round(it.qty * it.sell * 100) / 100;
    return {
      id: `mock-inv-${it.sku}`,
      name: it.name,
      sku: it.sku,
      categoryName: it.cat,
      unit: it.unit,
      stockQuantity: it.qty,
      costPrice: it.cost,
      sellingPrice: it.sell,
      stockValue,
      retailValue,
      potentialProfit: Math.round((retailValue - stockValue) * 100) / 100,
    };
  });
  return {
    totalProducts: rows.length,
    totalStockValue: Math.round(rows.reduce((s, r) => s + r.stockValue, 0) * 100) / 100,
    totalRetailValue: Math.round(rows.reduce((s, r) => s + r.retailValue, 0) * 100) / 100,
    totalPotentialProfit: Math.round(rows.reduce((s, r) => s + r.potentialProfit, 0) * 100) / 100,
    rows,
  };
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

export function getMockCashFlow(range: DateRange): CashFlowRow[] {
  const days: CashFlowRow[] = [];
  let running = 8500;
  let i = 0;
  const start = new Date(range.from);
  const end = new Date(range.to);
  let cur = new Date(start);
  while (cur <= end) {
    const seed = i * 11;
    const salesInflow = rnd(seed, 400, 2800);
    const purchaseOutflow = rnd(seed + 3, 0, 1200);
    const netFlow = salesInflow - purchaseOutflow;
    running += netFlow;
    days.push({
      date: toIso(cur),
      dayLabel: cur.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      salesInflow,
      purchaseOutflow,
      netFlow,
      runningBalance: running,
    });
    cur = addDays(cur, 1);
    i++;
  }
  return days;
}

// ── Supplier Purchases ────────────────────────────────────────────────────────

export function getMockSupplierPurchases(_range: DateRange): SupplierPurchaseRow[] {
  return [
    { supplierId: "sup-1", supplierName: "Fresh Fields Co.", totalOrders: 14, totalAmount: 8420, paidAmount: 7200, pendingAmount: 1220, lastOrderDate: "2026-05-01" },
    { supplierId: "sup-2", supplierName: "Metro Wholesale", totalOrders: 9, totalAmount: 5680, paidAmount: 5680, pendingAmount: 0, lastOrderDate: "2026-04-28" },
    { supplierId: "sup-3", supplierName: "Global Beans Ltd.", totalOrders: 6, totalAmount: 3950, paidAmount: 2800, pendingAmount: 1150, lastOrderDate: "2026-04-20" },
    { supplierId: "sup-4", supplierName: "Dairy Direct", totalOrders: 11, totalAmount: 2340, paidAmount: 2340, pendingAmount: 0, lastOrderDate: "2026-05-05" },
  ];
}
