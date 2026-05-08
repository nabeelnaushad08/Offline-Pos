"use client";

import { Printer, ShoppingBag, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CompletedSale } from "@/types/pos";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT: "Credit",
  SPLIT: "Cash + Card",
};

interface ReceiptModalProps {
  open: boolean;
  sale: CompletedSale | null;
  storeName?: string;
  onNewSale: () => void;
  onClose: () => void;
}

export function ReceiptModal({
  open,
  sale,
  storeName = "My Store",
  onNewSale,
  onClose,
}: ReceiptModalProps) {
  if (!sale) return null;

  const date = new Date(sale.completedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-full p-0">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">Receipt</DialogTitle>
            <button onClick={onClose} className="rounded-sm text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Store header */}
          <div className="bg-muted/30 px-6 py-4 text-center">
            <p className="text-base font-bold text-foreground">{storeName}</p>
            <p className="mt-1 font-mono text-xs font-semibold text-primary tracking-wider">
              {sale.saleNumber}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {dateStr} · {timeStr}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cashier: {sale.cashierName}
            </p>
            {sale.customerName && (
              <p className="text-[11px] text-muted-foreground">
                Customer: {sale.customerName}
              </p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="px-5 py-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Items
            </p>
            {sale.items.map((item) => {
              const lineSubtotal = item.quantity * item.unitPrice - item.itemDiscount;
              return (
                <div key={item.productId} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground leading-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                      {item.itemDiscount > 0 && (
                        <span className="text-success"> −${item.itemDiscount.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums shrink-0">
                    ${lineSubtotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Totals */}
          <div className="px-5 py-3 space-y-1.5">
            <TotalRow label="Subtotal" value={`$${sale.subtotal.toFixed(2)}`} />
            {sale.discountAmount > 0 && (
              <TotalRow
                label="Discount"
                value={`−$${sale.discountAmount.toFixed(2)}`}
                className="text-success"
              />
            )}
            {sale.taxAmount > 0 && (
              <TotalRow label="Tax" value={`$${sale.taxAmount.toFixed(2)}`} />
            )}
            <Separator className="my-1" />
            <TotalRow
              label="TOTAL"
              value={`$${sale.grandTotal.toFixed(2)}`}
              bold
            />
          </div>

          <Separator />

          {/* Payment */}
          <div className="px-5 py-3 space-y-1.5">
            <TotalRow
              label={PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
              value={`$${sale.paidAmount.toFixed(2)}`}
            />
            {sale.changeAmount > 0 && (
              <TotalRow
                label="Change"
                value={`$${sale.changeAmount.toFixed(2)}`}
                className="text-success font-semibold"
              />
            )}
          </div>

          <Separator />

          {/* Footer */}
          <div className="px-5 py-3 text-center">
            <p className="text-[11px] text-muted-foreground italic">
              Thank you for your business!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" className="flex-1 gap-2" size="sm" onClick={onClose}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button className="flex-1 gap-2" size="sm" onClick={onNewSale}>
            <ShoppingBag className="h-3.5 w-3.5" />
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TotalRow({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className={cn("text-xs", bold ? "font-bold text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("text-xs tabular-nums", bold && "font-bold text-foreground")}>
        {value}
      </span>
    </div>
  );
}
