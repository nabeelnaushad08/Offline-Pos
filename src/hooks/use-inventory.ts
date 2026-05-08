"use client";

import { useEffect, useState, useCallback } from "react";
import { isElectron } from "@/lib/utils";
import { inventoryClient } from "@/lib/ipc-client";
import {
  MOCK_INV_PRODUCTS,
  MOCK_INV_CATEGORIES,
  MOCK_INV_SUPPLIERS,
  MOCK_INV_PURCHASES,
  MOCK_STOCK_MOVEMENTS,
} from "@/lib/inventory-mock";
import { slugify } from "@/lib/utils";
import type {
  InventoryProduct,
  InventoryCategory,
  InventorySupplier,
  InventoryPurchase,
  StockMovementRecord,
  StockAdjustInput,
  ProductFormValues,
  CategoryFormValues,
  SupplierFormValues,
  PurchaseFormValues,
  ReceivePurchaseItem,
} from "@/types/inventory";

interface UseInventoryResult {
  products: InventoryProduct[];
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  purchases: InventoryPurchase[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProduct: (data: ProductFormValues) => Promise<void>;
  updateProduct: (id: string, data: ProductFormValues) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (input: StockAdjustInput) => Promise<void>;
  getStockMovements: (productId: string) => Promise<StockMovementRecord[]>;
  createCategory: (data: CategoryFormValues) => Promise<void>;
  updateCategory: (id: string, data: CategoryFormValues) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createSupplier: (data: SupplierFormValues) => Promise<void>;
  updateSupplier: (id: string, data: SupplierFormValues) => Promise<void>;
  createPurchase: (data: PurchaseFormValues, userId: string) => Promise<void>;
  receivePurchase: (purchaseId: string, items: ReceivePurchaseItem[], userId: string) => Promise<void>;
}

let mockProductState = [...MOCK_INV_PRODUCTS];
let mockCategoryState = [...MOCK_INV_CATEGORIES];
let mockSupplierState = [...MOCK_INV_SUPPLIERS];
let mockPurchaseState = [...MOCK_INV_PURCHASES];
let mockIdCounter = 9000;

function nextMockId(): string {
  return `mock-${++mockIdCounter}`;
}

export function useInventory(): UseInventoryResult {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([]);
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron()) {
        const [prods, cats, sups, pos] = await Promise.all([
          inventoryClient.getProducts(),
          inventoryClient.getCategories(),
          inventoryClient.getSuppliers(),
          inventoryClient.getPurchases(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setSuppliers(sups);
        setPurchases(pos);
      } else {
        await new Promise((r) => setTimeout(r, 200));
        setProducts([...mockProductState]);
        setCategories([...mockCategoryState]);
        setSuppliers([...mockSupplierState]);
        setPurchases([...mockPurchaseState]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Products ────────────────────────────────────────────────────────────────

  const createProduct = useCallback(
    async (data: ProductFormValues) => {
      const slug = slugify(data.name) + "-" + Date.now();
      const productData: Record<string, unknown> = {
        name: data.name.trim(),
        slug,
        sku: data.sku.trim(),
        barcode: data.barcode.trim() || null,
        description: data.description.trim() || null,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        costPrice: parseFloat(data.costPrice) || 0,
        sellingPrice: parseFloat(data.sellingPrice) || 0,
        taxRate: parseFloat(data.taxRate) || 0,
        unit: data.unit || "pcs",
        stockQuantity: parseFloat(data.stockQuantity) || 0,
        minStockLevel: parseFloat(data.minStockLevel) || 0,
        maxStockLevel: data.maxStockLevel ? parseFloat(data.maxStockLevel) : null,
        isTrackStock: data.isTrackStock,
        status: data.status,
      };

      if (isElectron()) {
        await inventoryClient.createProduct(productData);
      } else {
        const cat = mockCategoryState.find((c) => c.id === data.categoryId);
        const sup = mockSupplierState.find((s) => s.id === data.supplierId);
        const now = new Date().toISOString();
        const newProduct: InventoryProduct = {
          id: nextMockId(),
          name: data.name.trim(),
          slug,
          sku: data.sku.trim(),
          barcode: data.barcode.trim() || null,
          description: data.description.trim() || null,
          categoryId: data.categoryId,
          categoryName: cat?.name ?? "",
          supplierId: data.supplierId || null,
          supplierName: sup?.name ?? null,
          costPrice: parseFloat(data.costPrice) || 0,
          sellingPrice: parseFloat(data.sellingPrice) || 0,
          taxRate: parseFloat(data.taxRate) || 0,
          unit: data.unit || "pcs",
          stockQuantity: parseFloat(data.stockQuantity) || 0,
          minStockLevel: parseFloat(data.minStockLevel) || 0,
          maxStockLevel: data.maxStockLevel ? parseFloat(data.maxStockLevel) : null,
          isTrackStock: data.isTrackStock,
          status: data.status,
          image: null,
          createdAt: now,
          updatedAt: now,
        };
        mockProductState = [...mockProductState, newProduct];
      }
      await refresh();
    },
    [refresh]
  );

  const updateProduct = useCallback(
    async (id: string, data: ProductFormValues) => {
      const productData: Record<string, unknown> = {
        name: data.name.trim(),
        sku: data.sku.trim(),
        barcode: data.barcode.trim() || null,
        description: data.description.trim() || null,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        costPrice: parseFloat(data.costPrice) || 0,
        sellingPrice: parseFloat(data.sellingPrice) || 0,
        taxRate: parseFloat(data.taxRate) || 0,
        unit: data.unit || "pcs",
        minStockLevel: parseFloat(data.minStockLevel) || 0,
        maxStockLevel: data.maxStockLevel ? parseFloat(data.maxStockLevel) : null,
        isTrackStock: data.isTrackStock,
        status: data.status,
      };

      if (isElectron()) {
        await inventoryClient.updateProduct(id, productData);
      } else {
        const cat = mockCategoryState.find((c) => c.id === data.categoryId);
        const sup = mockSupplierState.find((s) => s.id === data.supplierId);
        mockProductState = mockProductState.map((p) =>
          p.id === id
            ? {
                ...p,
                ...productData,
                categoryName: cat?.name ?? p.categoryName,
                supplierName: sup?.name ?? null,
                updatedAt: new Date().toISOString(),
              }
            : p
        );
      }
      await refresh();
    },
    [refresh]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (isElectron()) {
        await inventoryClient.deleteProduct(id);
      } else {
        mockProductState = mockProductState.filter((p) => p.id !== id);
      }
      await refresh();
    },
    [refresh]
  );

  // ── Stock Adjustment ────────────────────────────────────────────────────────

  const adjustStock = useCallback(
    async (input: StockAdjustInput) => {
      if (isElectron()) {
        const result = await inventoryClient.adjustStock(input);
        if (!result.success) throw new Error(result.error ?? "Adjustment failed");
      } else {
        mockProductState = mockProductState.map((p) => {
          if (p.id !== input.productId) return p;
          let newQty = p.stockQuantity;
          if (input.movementType === "ADJUSTMENT_IN") newQty += input.quantity;
          else if (input.movementType === "ADJUSTMENT_OUT") newQty -= input.quantity;
          else if (input.movementType === "OPENING_STOCK") newQty = input.quantity;
          return { ...p, stockQuantity: Math.max(0, newQty), updatedAt: new Date().toISOString() };
        });
      }
      await refresh();
    },
    [refresh]
  );

  const getStockMovements = useCallback(async (productId: string): Promise<StockMovementRecord[]> => {
    if (isElectron()) {
      return inventoryClient.getStockMovements(productId);
    }
    return MOCK_STOCK_MOVEMENTS.filter((m) => m.productId === productId);
  }, []);

  // ── Categories ──────────────────────────────────────────────────────────────

  const createCategory = useCallback(
    async (data: CategoryFormValues) => {
      const slug = slugify(data.name);
      const catData: Record<string, unknown> = {
        name: data.name.trim(),
        slug,
        description: data.description.trim() || null,
        parentId: data.parentId || null,
        sortOrder: parseInt(data.sortOrder) || 0,
        isActive: true,
      };

      if (isElectron()) {
        await inventoryClient.createCategory(catData);
      } else {
        const newCat: InventoryCategory = {
          id: nextMockId(),
          name: data.name.trim(),
          slug,
          description: data.description.trim() || null,
          parentId: data.parentId || null,
          sortOrder: parseInt(data.sortOrder) || 0,
          isActive: true,
          productCount: 0,
        };
        mockCategoryState = [...mockCategoryState, newCat];
      }
      await refresh();
    },
    [refresh]
  );

  const updateCategory = useCallback(
    async (id: string, data: CategoryFormValues) => {
      const catData: Record<string, unknown> = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        parentId: data.parentId || null,
        sortOrder: parseInt(data.sortOrder) || 0,
      };

      if (isElectron()) {
        await inventoryClient.updateCategory(id, catData);
      } else {
        mockCategoryState = mockCategoryState.map((c) =>
          c.id === id ? { ...c, ...catData } : c
        );
      }
      await refresh();
    },
    [refresh]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (isElectron()) {
        await inventoryClient.deleteCategory(id);
      } else {
        mockCategoryState = mockCategoryState.filter((c) => c.id !== id);
      }
      await refresh();
    },
    [refresh]
  );

  // ── Suppliers ───────────────────────────────────────────────────────────────

  const createSupplier = useCallback(
    async (data: SupplierFormValues) => {
      const supData: Record<string, unknown> = {
        name: data.name.trim(),
        code: data.code.trim(),
        contactName: data.contactName.trim() || null,
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        address: data.address.trim() || null,
        city: data.city.trim() || null,
        country: data.country.trim() || null,
        taxNumber: data.taxNumber.trim() || null,
        notes: data.notes.trim() || null,
        isActive: true,
        balance: 0,
      };

      if (isElectron()) {
        await inventoryClient.createSupplier(supData);
      } else {
        const now = new Date().toISOString();
        const newSup: InventorySupplier = {
          id: nextMockId(),
          name: data.name.trim(),
          code: data.code.trim(),
          contactName: data.contactName.trim() || null,
          email: data.email.trim() || null,
          phone: data.phone.trim() || null,
          address: data.address.trim() || null,
          city: data.city.trim() || null,
          country: data.country.trim() || null,
          taxNumber: data.taxNumber.trim() || null,
          notes: data.notes.trim() || null,
          isActive: true,
          balance: 0,
          productCount: 0,
          createdAt: now,
        };
        mockSupplierState = [...mockSupplierState, newSup];
      }
      await refresh();
    },
    [refresh]
  );

  const updateSupplier = useCallback(
    async (id: string, data: SupplierFormValues) => {
      const supData: Record<string, unknown> = {
        name: data.name.trim(),
        code: data.code.trim(),
        contactName: data.contactName.trim() || null,
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        address: data.address.trim() || null,
        city: data.city.trim() || null,
        country: data.country.trim() || null,
        taxNumber: data.taxNumber.trim() || null,
        notes: data.notes.trim() || null,
      };

      if (isElectron()) {
        await inventoryClient.updateSupplier(id, supData);
      } else {
        mockSupplierState = mockSupplierState.map((s) =>
          s.id === id ? { ...s, ...supData } : s
        );
      }
      await refresh();
    },
    [refresh]
  );

  // ── Purchases ───────────────────────────────────────────────────────────────

  const createPurchase = useCallback(
    async (data: PurchaseFormValues, userId: string) => {
      if (isElectron()) {
        const result = await inventoryClient.createPurchase({ ...data, createdByUserId: userId });
        if (!result.success) throw new Error(result.error ?? "Failed to create purchase");
      } else {
        const sup = mockSupplierState.find((s) => s.id === data.supplierId);
        const subtotal = data.items.reduce((s, i) => s + i.quantityOrdered * i.unitCost, 0);
        const now = new Date().toISOString();
        const date = now.slice(0, 10).replace(/-/g, "");
        const newPo: InventoryPurchase = {
          id: nextMockId(),
          purchaseNumber: `PO-${date}-${String(mockPurchaseState.length + 1).padStart(4, "0")}`,
          status: "DRAFT",
          supplierId: data.supplierId,
          supplierName: sup?.name ?? "",
          subtotal,
          taxAmount: 0,
          shippingCost: 0,
          discountAmount: 0,
          totalAmount: subtotal,
          paidAmount: 0,
          expectedDate: data.expectedDate || null,
          receivedDate: null,
          notes: data.notes || null,
          items: data.items.map((item, idx) => ({
            id: `${nextMockId()}-${idx}`,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            unitCost: item.unitCost,
            totalAmount: item.quantityOrdered * item.unitCost,
          })),
          createdByName: "Current User",
          createdAt: now,
        };
        mockPurchaseState = [...mockPurchaseState, newPo];
      }
      await refresh();
    },
    [refresh]
  );

  const receivePurchase = useCallback(
    async (purchaseId: string, items: ReceivePurchaseItem[], userId: string) => {
      if (isElectron()) {
        const result = await inventoryClient.receivePurchase(purchaseId, items, userId);
        if (!result.success) throw new Error(result.error ?? "Failed to receive purchase");
      } else {
        mockPurchaseState = mockPurchaseState.map((po) => {
          if (po.id !== purchaseId) return po;
          const updatedItems = po.items.map((pi) => {
            const received = items.find((i) => i.purchaseItemId === pi.id);
            return received ? { ...pi, quantityReceived: received.quantityReceived } : pi;
          });
          const allReceived = updatedItems.every((i) => i.quantityReceived >= i.quantityOrdered);
          const anyReceived = updatedItems.some((i) => i.quantityReceived > 0);
          return {
            ...po,
            items: updatedItems,
            status: (allReceived ? "RECEIVED" : anyReceived ? "PARTIAL" : po.status) as InventoryPurchase["status"],
            receivedDate: anyReceived ? new Date().toISOString() : po.receivedDate,
          };
        });

        // Update mock stock
        for (const item of items) {
          if (item.quantityReceived > 0) {
            mockProductState = mockProductState.map((p) =>
              p.id === item.productId
                ? { ...p, stockQuantity: p.stockQuantity + item.quantityReceived }
                : p
            );
          }
        }
      }
      await refresh();
    },
    [refresh]
  );

  return {
    products,
    categories,
    suppliers,
    purchases,
    isLoading,
    error,
    refresh,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getStockMovements,
    createCategory,
    updateCategory,
    deleteCategory,
    createSupplier,
    updateSupplier,
    createPurchase,
    receivePurchase,
  };
}
