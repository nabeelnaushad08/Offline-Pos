import { ipcMain } from "electron";
import { getDb } from "../lib/db";

export interface DashboardData {
  stats: {
    todaySales: { amount: number; count: number; change: number };
    monthRevenue: { amount: number; count: number; change: number };
    totalProducts: number;
    lowStockCount: number;
    activeCustomers: number;
    pendingPurchases: number;
  };
  salesChart: Array<{
    label: string;
    date: string;
    revenue: number;
    transactions: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    image: string | null;
    totalSold: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    saleNumber: string;
    customerName: string | null;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    itemCount: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    minStockLevel: number;
    unit: string;
  }>;
  generatedAt: string;
}

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function toNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  return Number(v);
}

function dayLabel(dateStr: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

export function registerDashboardHandlers(): void {
  const db = getDb();

  ipcMain.handle("dashboard:getData", async (): Promise<DashboardData> => {
    // ── Today stats ───────────────────────────────────────────────────────────
    const [todayRow] = await db.$queryRaw<
      Array<{ count: bigint; amount: number | null }>
    >`
      SELECT COUNT(*) as count, SUM(total_amount) as amount
      FROM sales
      WHERE status = 'COMPLETED'
        AND date(created_at) = date('now', 'localtime')
    `;

    const [yesterdayRow] = await db.$queryRaw<
      Array<{ count: bigint; amount: number | null }>
    >`
      SELECT COUNT(*) as count, SUM(total_amount) as amount
      FROM sales
      WHERE status = 'COMPLETED'
        AND date(created_at) = date('now', '-1 day', 'localtime')
    `;

    const todayAmount = toNum(todayRow.amount);
    const yesterdayAmount = toNum(yesterdayRow.amount);

    // ── Month revenue ─────────────────────────────────────────────────────────
    const [monthRow] = await db.$queryRaw<
      Array<{ count: bigint; amount: number | null }>
    >`
      SELECT COUNT(*) as count, SUM(total_amount) as amount
      FROM sales
      WHERE status = 'COMPLETED'
        AND strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
    `;

    const [lastMonthRow] = await db.$queryRaw<
      Array<{ count: bigint; amount: number | null }>
    >`
      SELECT COUNT(*) as count, SUM(total_amount) as amount
      FROM sales
      WHERE status = 'COMPLETED'
        AND strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', '-1 month', 'localtime')
    `;

    const monthAmount = toNum(monthRow.amount);
    const lastMonthAmount = toNum(lastMonthRow.amount);

    // ── Counts ────────────────────────────────────────────────────────────────
    const [productCountRow] = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM products WHERE status = 'ACTIVE'
    `;

    const [lowStockRow] = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM products
      WHERE status = 'ACTIVE'
        AND is_track_stock = 1
        AND stock_quantity <= min_stock_level
    `;

    const [customerCountRow] = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM customers WHERE is_active = 1
    `;

    const [pendingPurchasesRow] = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM purchases
      WHERE status IN ('DRAFT', 'ORDERED', 'PARTIAL')
    `;

    // ── 7-day sales chart ─────────────────────────────────────────────────────
    const chartRows = await db.$queryRaw<
      Array<{ date: string; transactions: bigint; revenue: number | null }>
    >`
      SELECT
        date(created_at, 'localtime') as date,
        COUNT(*) as transactions,
        SUM(total_amount) as revenue
      FROM sales
      WHERE status = 'COMPLETED'
        AND created_at >= datetime('now', '-6 days', 'start of day')
      GROUP BY date(created_at, 'localtime')
      ORDER BY date ASC
    `;

    // Build a map of existing rows then fill all 7 days
    const chartMap = new Map<string, { revenue: number; transactions: number }>();
    for (const row of chartRows) {
      chartMap.set(row.date, {
        revenue: toNum(row.revenue),
        transactions: toNum(row.transactions),
      });
    }

    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const existing = chartMap.get(iso);
      salesChart.push({
        label: i === 0 ? "Today" : dayLabel(iso),
        date: iso,
        revenue: existing?.revenue ?? 0,
        transactions: existing?.transactions ?? 0,
      });
    }

    // ── Top 5 products (last 30 days) ─────────────────────────────────────────
    const topProductRows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        image: string | null;
        total_sold: number | null;
        revenue: number | null;
      }>
    >`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.image,
        SUM(si.quantity) as total_sold,
        SUM(si.total_amount) as revenue
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.status = 'COMPLETED'
        AND s.created_at >= datetime('now', '-30 days')
      GROUP BY p.id, p.name, p.sku, p.image
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    const topProducts = topProductRows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      image: r.image,
      totalSold: toNum(r.total_sold),
      revenue: toNum(r.revenue),
    }));

    // ── Recent 10 transactions ────────────────────────────────────────────────
    const recentRows = await db.$queryRaw<
      Array<{
        id: string;
        sale_number: string;
        customer_name: string | null;
        total_amount: number;
        payment_method: string;
        status: string;
        created_at: string;
        item_count: bigint;
      }>
    >`
      SELECT
        s.id,
        s.sale_number,
        c.name as customer_name,
        s.total_amount,
        s.payment_method,
        s.status,
        s.created_at,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN sale_items si ON si.sale_id = s.id
      GROUP BY s.id, s.sale_number, c.name, s.total_amount, s.payment_method, s.status, s.created_at
      ORDER BY s.created_at DESC
      LIMIT 10
    `;

    const recentTransactions = recentRows.map((r) => ({
      id: r.id,
      saleNumber: r.sale_number,
      customerName: r.customer_name,
      amount: r.total_amount,
      paymentMethod: r.payment_method,
      status: r.status,
      createdAt: r.created_at,
      itemCount: toNum(r.item_count),
    }));

    // ── Low stock products ────────────────────────────────────────────────────
    const lowStockRows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        stock_quantity: number;
        min_stock_level: number;
        unit: string;
      }>
    >`
      SELECT id, name, sku, stock_quantity, min_stock_level, unit
      FROM products
      WHERE status = 'ACTIVE'
        AND is_track_stock = 1
        AND stock_quantity <= min_stock_level
      ORDER BY CAST(stock_quantity AS REAL) / MAX(CAST(min_stock_level AS REAL), 1) ASC
      LIMIT 10
    `;

    const lowStockProducts = lowStockRows.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      stockQuantity: r.stock_quantity,
      minStockLevel: r.min_stock_level,
      unit: r.unit,
    }));

    return {
      stats: {
        todaySales: {
          amount: todayAmount,
          count: toNum(todayRow.count),
          change: pct(todayAmount, yesterdayAmount),
        },
        monthRevenue: {
          amount: monthAmount,
          count: toNum(monthRow.count),
          change: pct(monthAmount, lastMonthAmount),
        },
        totalProducts: toNum(productCountRow.count),
        lowStockCount: toNum(lowStockRow.count),
        activeCustomers: toNum(customerCountRow.count),
        pendingPurchases: toNum(pendingPurchasesRow.count),
      },
      salesChart,
      topProducts,
      recentTransactions,
      lowStockProducts,
      generatedAt: new Date().toISOString(),
    };
  });
}
