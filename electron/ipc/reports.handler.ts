import { ipcMain } from "electron";
import { getDb } from "../lib/db";
import type {
  DailySalesRow,
  MonthlySalesRow,
  TopProductRow,
  InventoryValuationSummary,
  InventoryValuationRow,
  CashFlowRow,
  SupplierPurchaseRow,
} from "../../src/types/reports";

function toNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  return Number(v);
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function monthLabel(monthStr: string): string {
  const d = new Date(monthStr + "-01T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function registerReportsHandlers(): void {
  const db = getDb();

  // ── Daily Sales ─────────────────────────────────────────────────────────────
  ipcMain.handle("reports:dailySales", async (_, from: string, to: string): Promise<DailySalesRow[]> => {
    const rows = await db.$queryRaw<
      Array<{ sale_date: string; transactions: bigint; revenue: number | null; cost: number | null }>
    >`
      SELECT
        date(s.created_at, 'localtime') AS sale_date,
        COUNT(DISTINCT s.id) AS transactions,
        SUM(s.total_amount) AS revenue,
        COALESCE(SUM(si.quantity * p.cost_price), 0) AS cost
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'COMPLETED'
        AND date(s.created_at, 'localtime') >= ${from}
        AND date(s.created_at, 'localtime') <= ${to}
      GROUP BY date(s.created_at, 'localtime')
      ORDER BY sale_date ASC
    `;

    const rowMap = new Map<string, DailySalesRow>();
    for (const r of rows) {
      const revenue = toNum(r.revenue);
      const cost = toNum(r.cost);
      const transactions = toNum(r.transactions);
      rowMap.set(r.sale_date, {
        date: r.sale_date,
        dayLabel: dayLabel(r.sale_date),
        revenue,
        cost,
        profit: revenue - cost,
        transactions,
        avgOrderValue: transactions > 0 ? Math.round((revenue / transactions) * 100) / 100 : 0,
      });
    }

    // Fill all days in range
    const result: DailySalesRow[] = [];
    let cur = from;
    while (cur <= to) {
      result.push(
        rowMap.get(cur) ?? {
          date: cur,
          dayLabel: dayLabel(cur),
          revenue: 0,
          cost: 0,
          profit: 0,
          transactions: 0,
          avgOrderValue: 0,
        }
      );
      cur = addDays(cur, 1);
    }
    return result;
  });

  // ── Monthly Sales ───────────────────────────────────────────────────────────
  ipcMain.handle("reports:monthlySales", async (_, from: string, to: string): Promise<MonthlySalesRow[]> => {
    const rows = await db.$queryRaw<
      Array<{ month: string; transactions: bigint; revenue: number | null; cost: number | null }>
    >`
      SELECT
        strftime('%Y-%m', s.created_at, 'localtime') AS month,
        COUNT(DISTINCT s.id) AS transactions,
        SUM(s.total_amount) AS revenue,
        COALESCE(SUM(si.quantity * p.cost_price), 0) AS cost
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'COMPLETED'
        AND date(s.created_at, 'localtime') >= ${from}
        AND date(s.created_at, 'localtime') <= ${to}
      GROUP BY strftime('%Y-%m', s.created_at, 'localtime')
      ORDER BY month ASC
    `;

    return rows.map((r) => {
      const revenue = toNum(r.revenue);
      const cost = toNum(r.cost);
      const transactions = toNum(r.transactions);
      return {
        month: r.month,
        label: monthLabel(r.month),
        revenue,
        cost,
        profit: revenue - cost,
        transactions,
        avgOrderValue: transactions > 0 ? Math.round((revenue / transactions) * 100) / 100 : 0,
      };
    });
  });

  // ── Top Products ────────────────────────────────────────────────────────────
  ipcMain.handle("reports:topProducts", async (_, from: string, to: string): Promise<TopProductRow[]> => {
    const rows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        cost_price: number;
        category_name: string | null;
        total_sold: number | null;
        revenue: number | null;
        cost: number | null;
      }>
    >`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.cost_price,
        c.name AS category_name,
        SUM(si.quantity) AS total_sold,
        SUM(si.total_amount) AS revenue,
        SUM(si.quantity * p.cost_price) AS cost
      FROM sale_items si
      JOIN products p ON p.id = si.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      JOIN sales s ON s.id = si.sale_id
      WHERE s.status = 'COMPLETED'
        AND date(s.created_at, 'localtime') >= ${from}
        AND date(s.created_at, 'localtime') <= ${to}
      GROUP BY p.id, p.name, p.sku, p.cost_price, c.name
      ORDER BY revenue DESC
      LIMIT 20
    `;

    return rows.map((r, i) => {
      const revenue = toNum(r.revenue);
      const cost = toNum(r.cost);
      const profit = revenue - cost;
      return {
        rank: i + 1,
        id: r.id,
        name: r.name,
        sku: r.sku,
        categoryName: toStr(r.category_name) || "Uncategorized",
        totalSold: toNum(r.total_sold),
        revenue,
        cost,
        profit,
        profitMargin: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      };
    });
  });

  // ── Inventory Valuation ─────────────────────────────────────────────────────
  ipcMain.handle("reports:inventoryValuation", async (): Promise<InventoryValuationSummary> => {
    const rows = await db.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string;
        unit: string;
        stock_quantity: number;
        cost_price: number;
        selling_price: number;
        category_name: string | null;
      }>
    >`
      SELECT
        p.id,
        p.name,
        p.sku,
        p.unit,
        p.stock_quantity,
        p.cost_price,
        p.selling_price,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'ACTIVE'
      ORDER BY (p.stock_quantity * p.cost_price) DESC
    `;

    const mapped: InventoryValuationRow[] = rows.map((r) => {
      const qty = toNum(r.stock_quantity);
      const cost = toNum(r.cost_price);
      const sell = toNum(r.selling_price);
      const stockValue = Math.round(qty * cost * 100) / 100;
      const retailValue = Math.round(qty * sell * 100) / 100;
      return {
        id: r.id,
        name: r.name,
        sku: r.sku,
        categoryName: toStr(r.category_name) || "Uncategorized",
        unit: r.unit,
        stockQuantity: qty,
        costPrice: cost,
        sellingPrice: sell,
        stockValue,
        retailValue,
        potentialProfit: Math.round((retailValue - stockValue) * 100) / 100,
      };
    });

    return {
      totalProducts: mapped.length,
      totalStockValue: Math.round(mapped.reduce((s, r) => s + r.stockValue, 0) * 100) / 100,
      totalRetailValue: Math.round(mapped.reduce((s, r) => s + r.retailValue, 0) * 100) / 100,
      totalPotentialProfit: Math.round(mapped.reduce((s, r) => s + r.potentialProfit, 0) * 100) / 100,
      rows: mapped,
    };
  });

  // ── Cash Flow ───────────────────────────────────────────────────────────────
  ipcMain.handle("reports:cashFlow", async (_, from: string, to: string): Promise<CashFlowRow[]> => {
    const [salesRows, purchaseRows] = await Promise.all([
      db.$queryRaw<Array<{ flow_date: string; inflow: number | null }>>`
        SELECT
          date(created_at, 'localtime') AS flow_date,
          SUM(total_amount) AS inflow
        FROM sales
        WHERE status = 'COMPLETED'
          AND date(created_at, 'localtime') >= ${from}
          AND date(created_at, 'localtime') <= ${to}
        GROUP BY flow_date
        ORDER BY flow_date ASC
      `,
      db.$queryRaw<Array<{ flow_date: string; outflow: number | null }>>`
        SELECT
          date(created_at, 'localtime') AS flow_date,
          SUM(total_amount) AS outflow
        FROM purchases
        WHERE status IN ('RECEIVED', 'PARTIAL', 'ORDERED')
          AND date(created_at, 'localtime') >= ${from}
          AND date(created_at, 'localtime') <= ${to}
        GROUP BY flow_date
        ORDER BY flow_date ASC
      `,
    ]);

    const inflowMap = new Map<string, number>();
    for (const r of salesRows) inflowMap.set(r.flow_date, toNum(r.inflow));

    const outflowMap = new Map<string, number>();
    for (const r of purchaseRows) outflowMap.set(r.flow_date, toNum(r.outflow));

    const result: CashFlowRow[] = [];
    let running = 0;
    let cur = from;
    while (cur <= to) {
      const salesInflow = inflowMap.get(cur) ?? 0;
      const purchaseOutflow = outflowMap.get(cur) ?? 0;
      const netFlow = salesInflow - purchaseOutflow;
      running += netFlow;
      result.push({
        date: cur,
        dayLabel: dayLabel(cur),
        salesInflow,
        purchaseOutflow,
        netFlow,
        runningBalance: Math.round(running * 100) / 100,
      });
      cur = addDays(cur, 1);
    }
    return result;
  });

  // ── Supplier Purchases ──────────────────────────────────────────────────────
  ipcMain.handle("reports:supplierPurchases", async (_, from: string, to: string): Promise<SupplierPurchaseRow[]> => {
    const rows = await db.$queryRaw<
      Array<{
        supplier_id: string;
        supplier_name: string;
        total_orders: bigint;
        total_amount: number | null;
        paid_amount: number | null;
        last_order_date: string | null;
      }>
    >`
      SELECT
        su.id AS supplier_id,
        su.name AS supplier_name,
        COUNT(pu.id) AS total_orders,
        COALESCE(SUM(pu.total_amount), 0) AS total_amount,
        COALESCE(SUM(pu.paid_amount), 0) AS paid_amount,
        MAX(date(pu.created_at, 'localtime')) AS last_order_date
      FROM suppliers su
      LEFT JOIN purchases pu ON pu.supplier_id = su.id
        AND date(pu.created_at, 'localtime') >= ${from}
        AND date(pu.created_at, 'localtime') <= ${to}
      GROUP BY su.id, su.name
      ORDER BY total_amount DESC
    `;

    return rows.map((r) => {
      const total = toNum(r.total_amount);
      const paid = toNum(r.paid_amount);
      return {
        supplierId: r.supplier_id,
        supplierName: r.supplier_name,
        totalOrders: toNum(r.total_orders),
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: Math.round((total - paid) * 100) / 100,
        lastOrderDate: r.last_order_date ?? null,
      };
    });
  });
}
