import { ipcMain } from "electron";
import { getDb } from "../lib/db";

export interface CompleteSaleRaw {
  userId: string;
  customerId: string | null;
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentRef?: string;
  notes?: string;
}

async function generateSaleNumber(): Promise<string> {
  const db = getDb();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `SAL-${y}${m}${d}-`;

  const last = await db.sale.findFirst({
    where: { saleNumber: { startsWith: prefix } },
    orderBy: { saleNumber: "desc" },
    select: { saleNumber: true },
  });

  const n = last ? parseInt(last.saleNumber.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export function registerPosHandlers(): void {
  const db = getDb();

  // Categories for the tab filter
  ipcMain.handle("pos:getCategories", () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, image: true },
    })
  );

  // Products for the grid — optional search + category filter
  ipcMain.handle(
    "pos:getProducts",
    (_, search?: string, categoryId?: string) =>
      db.product.findMany({
        where: {
          status: "ACTIVE",
          ...(categoryId ? { categoryId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { sku: { contains: search } },
                  { barcode: { contains: search } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          image: true,
          sellingPrice: true,
          costPrice: true,
          taxRate: true,
          unit: true,
          stockQuantity: true,
          categoryId: true,
          category: { select: { name: true } },
        },
        orderBy: { name: "asc" },
        take: 120,
      })
  );

  // Single product by barcode for scanner
  ipcMain.handle("pos:getProductByBarcode", (_, barcode: string) =>
    db.product.findUnique({
      where: { barcode },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        image: true,
        sellingPrice: true,
        costPrice: true,
        taxRate: true,
        unit: true,
        stockQuantity: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    })
  );

  // Customer search for cart customer selector
  ipcMain.handle("pos:searchCustomers", (_, term: string) =>
    db.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term } },
          { phone: { contains: term } },
          { code: { contains: term } },
        ],
      },
      select: { id: true, name: true, code: true, phone: true, balance: true },
      take: 10,
    })
  );

  // Complete a sale — transaction: sale + items + stock movements + activity log
  ipcMain.handle(
    "pos:completeSale",
    async (_, input: CompleteSaleRaw) => {
      try {
        const saleNumber = await generateSaleNumber();

        const result = await db.$transaction(async (tx) => {
          const sale = await tx.sale.create({
            data: {
              saleNumber,
              status: "COMPLETED",
              customerId: input.customerId ?? null,
              userId: input.userId,
              subtotal: input.subtotal,
              taxAmount: input.taxAmount,
              discountAmount: input.discountAmount,
              totalAmount: input.totalAmount,
              paidAmount: input.paidAmount,
              changeAmount: input.changeAmount,
              paymentMethod: input.paymentMethod,
              paymentRef: input.paymentRef ?? null,
              notes: input.notes ?? null,
            },
          });

          for (const item of input.items) {
            await tx.saleItem.create({
              data: {
                saleId: sale.id,
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                costPrice: item.costPrice,
                taxRate: item.taxRate,
                taxAmount: item.taxAmount,
                discount: item.discount,
                totalAmount: item.totalAmount,
              },
            });

            // Stock tracking
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQuantity: true, isTrackStock: true },
            });

            if (product?.isTrackStock) {
              const before = product.stockQuantity;
              const after = before - item.quantity;

              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: after },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  movementType: "SALE",
                  quantity: -item.quantity,
                  quantityBefore: before,
                  quantityAfter: after,
                  referenceType: "sale",
                  referenceId: sale.id,
                  saleId: sale.id,
                  userId: input.userId,
                },
              });
            }
          }

          await tx.activityLog.create({
            data: {
              userId: input.userId,
              action: "SALE_COMPLETE",
              entity: "sale",
              entityId: sale.id,
              summary: `Sale ${saleNumber} — $${input.totalAmount.toFixed(2)} (${input.paymentMethod})`,
            },
          });

          return { success: true, saleId: sale.id, saleNumber: sale.saleNumber };
        });

        return result;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sale failed",
        };
      }
    }
  );
}
