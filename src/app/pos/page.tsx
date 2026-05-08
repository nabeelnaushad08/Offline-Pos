"use client";

import { useState, useCallback } from "react";
import { usePosStore } from "@/store/pos-store";
import { usePosData } from "@/hooks/use-pos";
import { useAuth } from "@/hooks/use-auth";
import { isElectron } from "@/lib/utils";
import { posClient } from "@/lib/ipc-client";
import { ProductSearch } from "@/components/pos/product-search";
import { CategoryFilter } from "@/components/pos/category-filter";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentModal } from "@/components/pos/payment-modal";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { HeldBillsModal } from "@/components/pos/held-bills-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompletedSale } from "@/types/pos";
import type { ReceiptData } from "@/types/printer";

export default function PosPage() {
  const { user } = useAuth();
  const {
    searchTerm,
    selectedCategoryId,
    setSearchTerm,
    setCategory,
    getTotals,
    items,
    customerId,
    customerName,
    cartDiscount,
    note,
    heldBills,
    holdCart,
    clearCart,
  } = usePosStore();

  const { categories, products, isLoadingProducts, scanBarcode } = usePosData(
    searchTerm,
    selectedCategoryId
  );

  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const totals = getTotals();

  // Barcode scanning via search input enter key or dedicated scan
  const handleSearchChange = useCallback(
    async (value: string) => {
      // If it looks like a pure barcode (all digits, 8–14 chars), auto-scan
      if (/^\d{8,14}$/.test(value.trim())) {
        const product = await scanBarcode(value.trim());
        if (product) {
          usePosStore.getState().addItem(product);
          setSearchTerm("");
          return;
        }
      }
      setSearchTerm(value);
    },
    [scanBarcode, setSearchTerm]
  );

  const handlePay = () => {
    if (items.length === 0) return;
    setShowPayment(true);
  };

  const handlePaymentConfirm = useCallback(
    async (
      method: "CASH" | "CARD" | "MOBILE_MONEY" | "SPLIT",
      paid: number,
      change: number,
      ref?: string
    ) => {
      if (!user) return;

      const t = getTotals();

      // Build sale items for IPC
      const saleItems = items.map((item) => {
        const lineAfterDiscount = item.quantity * item.unitPrice - item.itemDiscount;
        const lineTax = lineAfterDiscount * (item.taxRate / 100);
        return {
          productId: item.productId,
          productName: item.name,
          productSku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
          taxRate: item.taxRate,
          taxAmount: lineTax,
          discount: item.itemDiscount,
          totalAmount: lineAfterDiscount + lineTax,
        };
      });

      let saleId = `mock-${Date.now()}`;
      let saleNumber = `SAL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;

      if (isElectron()) {
        const result = await posClient.completeSale({
          userId: user.id,
          customerId,
          items: saleItems,
          subtotal: t.subtotal,
          taxAmount: t.taxAmount,
          discountAmount: t.itemDiscounts + t.cartDiscount,
          totalAmount: t.grandTotal,
          paidAmount: paid,
          changeAmount: change,
          paymentMethod: method,
          paymentRef: ref,
          notes: note || undefined,
        });

        if (!result.success) {
          throw new Error(result.error ?? "Sale failed");
        }
        saleId = result.saleId!;
        saleNumber = result.saleNumber!;

        // Fire cash drawer + auto-print asynchronously (don't block UI)
        const printerStatus = await window.electron.invoke<{ config: { enabled: boolean; cashDrawer: boolean; autoprint: boolean } | null }>("printer:getStatus");
        const pc = printerStatus.config;
        if (pc?.enabled) {
          if (pc.cashDrawer && method === "CASH") {
            window.electron.invoke("printer:openCashDrawer").catch(console.error);
          }
          if (pc.autoprint) {
            const rd: ReceiptData = {
              saleId,
              saleNumber,
              cashierName: user.fullName,
              customerName: customerName ?? null,
              completedAt: new Date().toISOString(),
              items: items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                itemDiscount: item.itemDiscount,
                lineTotal: item.quantity * item.unitPrice - item.itemDiscount,
              })),
              subtotal: t.subtotal,
              taxAmount: t.taxAmount,
              discountAmount: t.itemDiscounts + t.cartDiscount,
              grandTotal: t.grandTotal,
              paidAmount: paid,
              changeAmount: change,
              paymentMethod: method,
            };
            window.electron.invoke("printer:printReceipt", rd).catch(console.error);
          }
        }
      }

      const sale: CompletedSale = {
        saleId,
        saleNumber,
        items: [...items],
        customerId,
        customerName,
        subtotal: t.subtotal,
        taxAmount: t.taxAmount,
        discountAmount: t.itemDiscounts + t.cartDiscount,
        grandTotal: t.grandTotal,
        paidAmount: paid,
        changeAmount: change,
        paymentMethod: method,
        cashierName: user.fullName,
        completedAt: new Date().toISOString(),
      };

      setCompletedSale(sale);
      setShowPayment(false);
      setShowReceipt(true);
      clearCart();
    },
    [user, items, getTotals, customerId, customerName, note, clearCart]
  );

  const handleNewSale = () => {
    setShowReceipt(false);
    setCompletedSale(null);
  };

  return (
    <>
      {/* Full-height layout that cancels AppShell's p-6 */}
      <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* ── LEFT: Products ───────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border/50 bg-background/30">
          {/* Search + categories header */}
          <div className="shrink-0 space-y-2.5 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-sm">
            <ProductSearch
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <CategoryFilter
              categories={categories}
              selected={selectedCategoryId}
              onSelect={setCategory}
            />
          </div>

          {/* Product grid */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <ProductGrid products={products} isLoading={isLoadingProducts} />
            </div>
          </ScrollArea>
        </div>

        {/* ── RIGHT: Cart ───────────────────────────────────────────── */}
        <div className="flex w-[360px] shrink-0 flex-col overflow-hidden border-l border-border/30">
          <CartPanel
            onPay={handlePay}
            onHold={() => holdCart()}
            onHeldBills={() => setShowHeld(true)}
            heldCount={heldBills.length}
            customerSearchNode={null}
          />
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        totals={totals}
        onConfirm={handlePaymentConfirm}
      />

      <ReceiptModal
        open={showReceipt}
        sale={completedSale}
        onNewSale={handleNewSale}
        onClose={() => setShowReceipt(false)}
        isPrinting={isPrinting}
        onPrint={async (sale) => {
          if (!isElectron()) return;
          setIsPrinting(true);
          try {
            const rd: ReceiptData = {
              saleId: sale.saleId,
              saleNumber: sale.saleNumber,
              cashierName: sale.cashierName,
              customerName: sale.customerName ?? null,
              completedAt: sale.completedAt,
              items: sale.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                itemDiscount: item.itemDiscount,
                lineTotal: item.quantity * item.unitPrice - item.itemDiscount,
              })),
              subtotal: sale.subtotal,
              taxAmount: sale.taxAmount,
              discountAmount: sale.discountAmount,
              grandTotal: sale.grandTotal,
              paidAmount: sale.paidAmount,
              changeAmount: sale.changeAmount,
              paymentMethod: sale.paymentMethod,
            };
            await window.electron.invoke("printer:printReceipt", rd);
          } finally {
            setIsPrinting(false);
          }
        }}
      />

      <HeldBillsModal open={showHeld} onClose={() => setShowHeld(false)} />
    </>
  );
}
