import { ipcMain } from "electron";
import { getDb } from "../lib/db";

async function generatePurchaseNumber(): Promise<string> {
  const db = getDb();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `PO-${y}${m}${d}-`;

  const last = await db.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  });

  const n = last ? parseInt(last.purchaseNumber.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export interface AdjustStockInput {
  productId: string;
  movementType: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "OPENING_STOCK";
  quantity: number;
  notes: string;
  userId: string;
}

export interface ReceivePurchaseItemInput {
  purchaseItemId: string;
  productId: string;
  quantityReceived: number;
  unitCost: number;
}

export function registerInventoryHandlers(): void {
  const db = getDb();

  // ── Flexible product list for inventory (supports all statuses) ──────────────
  ipcMain.handle(
    "inventory:getProducts",
    (
      _,
      filters?: {
        categoryId?: string;
        supplierId?: string;
        status?: string | null;
        search?: string;
      }
    ) => {
      const statusFilter =
        filters?.status && filters.status !== "ALL"
          ? filters.status
          : undefined;

      return db.product.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
          ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
          ...(filters?.search
            ? {
                OR: [
                  { name: { contains: filters.search } },
                  { sku: { contains: filters.search } },
                  { barcode: { contains: filters.search } },
                ],
              }
            : {}),
        },
        include: { category: true, supplier: true },
        orderBy: { name: "asc" },
      });
    }
  );

  // ── Adjust stock for a product ───────────────────────────────────────────────
  ipcMain.handle("inventory:adjustStock", async (_, input: AdjustStockInput) => {
    try {
      const result = await db.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: input.productId },
          select: { stockQuantity: true, name: true, isTrackStock: true },
        });

        if (!product) throw new Error("Product not found");

        const before = product.stockQuantity;
        let delta = 0;

        if (input.movementType === "ADJUSTMENT_IN") {
          delta = input.quantity;
        } else if (input.movementType === "ADJUSTMENT_OUT") {
          delta = -input.quantity;
        } else if (input.movementType === "OPENING_STOCK") {
          // Set absolute quantity
          delta = input.quantity - before;
        }

        const after = before + delta;

        await tx.product.update({
          where: { id: input.productId },
          data: { stockQuantity: after },
        });

        await tx.stockMovement.create({
          data: {
            productId: input.productId,
            movementType: input.movementType,
            quantity: delta,
            quantityBefore: before,
            quantityAfter: after,
            referenceType: "adjustment",
            userId: input.userId,
            notes: input.notes || null,
          },
        });

        await tx.activityLog.create({
          data: {
            userId: input.userId,
            action: "STOCK_ADJUST",
            entity: "product",
            entityId: input.productId,
            summary: `Stock adjusted for ${product.name}: ${before} → ${after} (${input.movementType})`,
          },
        });

        return { success: true, before, after };
      });

      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Stock adjustment failed",
      };
    }
  });

  // ── Create purchase with items and generate PO number ───────────────────────
  ipcMain.handle(
    "inventory:createPurchase",
    async (
      _,
      input: {
        supplierId: string;
        createdByUserId: string;
        expectedDate?: string | null;
        notes?: string | null;
        items: Array<{
          productId: string;
          productName: string;
          productSku: string;
          quantityOrdered: number;
          unitCost: number;
        }>;
      }
    ) => {
      try {
        const purchaseNumber = await generatePurchaseNumber();

        const subtotal = input.items.reduce(
          (sum, item) => sum + item.quantityOrdered * item.unitCost,
          0
        );

        const purchase = await db.purchase.create({
          data: {
            purchaseNumber,
            status: "DRAFT",
            supplierId: input.supplierId,
            createdByUserId: input.createdByUserId,
            subtotal,
            totalAmount: subtotal,
            expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
            notes: input.notes ?? null,
            items: {
              create: input.items.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                quantityOrdered: item.quantityOrdered,
                quantityReceived: 0,
                unitCost: item.unitCost,
                totalAmount: item.quantityOrdered * item.unitCost,
              })),
            },
          },
          include: { items: true, supplier: true },
        });

        return { success: true, purchase };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create purchase",
        };
      }
    }
  );

  // ── Receive a purchase — update stock for all items ──────────────────────────
  ipcMain.handle(
    "inventory:receivePurchase",
    async (
      _,
      purchaseId: string,
      items: ReceivePurchaseItemInput[],
      userId: string
    ) => {
      try {
        const result = await db.$transaction(async (tx) => {
          const purchase = await tx.purchase.findUnique({
            where: { id: purchaseId },
            include: { items: true },
          });

          if (!purchase) throw new Error("Purchase not found");

          for (const received of items) {
            if (received.quantityReceived <= 0) continue;

            const product = await tx.product.findUnique({
              where: { id: received.productId },
              select: { stockQuantity: true, isTrackStock: true, name: true },
            });

            if (product?.isTrackStock) {
              const before = product.stockQuantity;
              const after = before + received.quantityReceived;

              await tx.product.update({
                where: { id: received.productId },
                data: { stockQuantity: after },
              });

              await tx.stockMovement.create({
                data: {
                  productId: received.productId,
                  movementType: "PURCHASE",
                  quantity: received.quantityReceived,
                  quantityBefore: before,
                  quantityAfter: after,
                  unitCost: received.unitCost,
                  referenceType: "purchase",
                  referenceId: purchaseId,
                  purchaseId,
                  userId,
                },
              });
            }

            await tx.purchaseItem.update({
              where: { id: received.purchaseItemId },
              data: { quantityReceived: received.quantityReceived },
            });
          }

          const allReceived = items.every(
            (i) =>
              i.quantityReceived >=
              (purchase.items.find((pi) => pi.id === i.purchaseItemId)
                ?.quantityOrdered ?? 0)
          );
          const anyReceived = items.some((i) => i.quantityReceived > 0);

          const newStatus = allReceived
            ? "RECEIVED"
            : anyReceived
              ? "PARTIAL"
              : purchase.status;

          await tx.purchase.update({
            where: { id: purchaseId },
            data: {
              status: newStatus,
              receivedDate: anyReceived ? new Date() : null,
              receivedByUserId: userId,
            },
          });

          await tx.activityLog.create({
            data: {
              userId,
              action: "PURCHASE_RECEIVE",
              entity: "purchase",
              entityId: purchaseId,
              summary: `Received purchase ${purchase.purchaseNumber} — status: ${newStatus}`,
            },
          });

          return { success: true, status: newStatus };
        });

        return result;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to receive purchase",
        };
      }
    }
  );
}
