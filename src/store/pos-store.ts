"use client";

import { create } from "zustand";
import type { CartItem, CartTotals, HeldBill, POSProduct } from "@/types/pos";

interface PosState {
  // Cart
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  cartDiscount: number;
  note: string;

  // UI filters
  searchTerm: string;
  selectedCategoryId: string | null;

  // Session-held bills
  heldBills: HeldBill[];

  // Actions — cart
  addItem: (product: POSProduct) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  setCartDiscount: (discount: number) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setNote: (note: string) => void;
  clearCart: () => void;

  // Actions — UI
  setSearchTerm: (term: string) => void;
  setCategory: (id: string | null) => void;

  // Actions — hold
  holdCart: (label?: string) => void;
  restoreHeld: (id: string) => void;
  deleteHeld: (id: string) => void;

  // Derived
  getTotals: () => CartTotals;
  getItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  cartDiscount: 0,
  note: "",
  searchTerm: "",
  selectedCategoryId: null,
  heldBills: [],

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            image: product.image,
            unitPrice: product.sellingPrice,
            costPrice: product.costPrice,
            taxRate: product.taxRate,
            unit: product.unit,
            quantity: 1,
            itemDiscount: 0,
          },
        ],
      };
    }),

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

  updateQty: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: qty } : i
        ),
      };
    }),

  setItemDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, itemDiscount: Math.max(0, discount) }
          : i
      ),
    })),

  setCartDiscount: (discount) => set({ cartDiscount: Math.max(0, discount) }),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),

  setNote: (note) => set({ note }),

  clearCart: () =>
    set({ items: [], customerId: null, customerName: null, cartDiscount: 0, note: "" }),

  setSearchTerm: (searchTerm) => set({ searchTerm }),

  setCategory: (selectedCategoryId) => set({ selectedCategoryId }),

  holdCart: (label) => {
    const { items, customerId, customerName, cartDiscount, note, heldBills } = get();
    if (items.length === 0) return;
    const bill: HeldBill = {
      id: `held-${Date.now()}`,
      label: label ?? `Bill ${heldBills.length + 1}`,
      items: [...items],
      customerId,
      customerName,
      cartDiscount,
      note,
      heldAt: new Date().toISOString(),
    };
    set({
      heldBills: [...heldBills, bill],
      items: [],
      customerId: null,
      customerName: null,
      cartDiscount: 0,
      note: "",
    });
  },

  restoreHeld: (id) => {
    const { heldBills } = get();
    const bill = heldBills.find((b) => b.id === id);
    if (!bill) return;
    set({
      items: [...bill.items],
      customerId: bill.customerId,
      customerName: bill.customerName,
      cartDiscount: bill.cartDiscount,
      note: bill.note,
      heldBills: heldBills.filter((b) => b.id !== id),
    });
  },

  deleteHeld: (id) =>
    set((state) => ({ heldBills: state.heldBills.filter((b) => b.id !== id) })),

  getTotals: (): CartTotals => {
    const { items, cartDiscount } = get();
    let subtotal = 0;
    let itemDiscounts = 0;
    let taxAmount = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscount = Math.min(item.itemDiscount, lineSubtotal);
      const taxable = lineSubtotal - lineDiscount;
      subtotal += lineSubtotal;
      itemDiscounts += lineDiscount;
      taxAmount += taxable * (item.taxRate / 100);
    }

    const netSubtotal = subtotal - itemDiscounts;
    const effectiveCartDiscount = Math.min(cartDiscount, netSubtotal);
    const grandTotal = Math.max(0, netSubtotal + taxAmount - effectiveCartDiscount);

    return {
      subtotal,
      itemDiscounts,
      netSubtotal,
      taxAmount,
      cartDiscount: effectiveCartDiscount,
      grandTotal,
    };
  },

  getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
