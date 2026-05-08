"use client";

import { useState, useCallback } from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Split,
  Delete,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CartTotals } from "@/types/pos";

type PayMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "SPLIT";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  totals: CartTotals;
  onConfirm: (method: PayMethod, paid: number, change: number, ref?: string) => Promise<void>;
}

const METHODS: Array<{ id: PayMethod; label: string; icon: React.ElementType }> = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "MOBILE_MONEY", label: "Mobile", icon: Smartphone },
  { id: "SPLIT", label: "Split", icon: Split },
];

// Touch numpad
function NumPad({ onKey }: { onKey: (k: string) => void }) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onKey(k)}
          className={cn(
            "flex h-12 items-center justify-center rounded-xl text-base font-semibold transition-all active:scale-95",
            k === "⌫"
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "bg-muted hover:bg-muted/70 text-foreground"
          )}
        >
          {k === "⌫" ? <Delete className="h-4 w-4" /> : k}
        </button>
      ))}
    </div>
  );
}

function useNumpadInput(initial = "") {
  const [raw, setRaw] = useState(initial);

  const handleKey = useCallback((k: string) => {
    setRaw((prev) => {
      if (k === "⌫") return prev.slice(0, -1);
      // Max 2 decimal places
      const next = prev + k;
      if (k === "." && prev.includes(".")) return prev;
      const parts = next.split(".");
      if (parts[1]?.length > 2) return prev;
      if (next.length > 8) return prev;
      return next;
    });
  }, []);

  const value = parseFloat(raw) || 0;
  const reset = useCallback((v = "") => setRaw(v), []);

  return { raw, value, handleKey, reset };
}

export function PaymentModal({ open, onClose, totals, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PayMethod>("CASH");
  const [payRef, setPayRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const cashInput = useNumpadInput(totals.grandTotal.toFixed(2).replace(".", "."));
  const splitCashInput = useNumpadInput("");

  const cashPaid = cashInput.value;
  const cashChange = Math.max(0, cashPaid - totals.grandTotal);
  const isValidCash = cashPaid >= totals.grandTotal;

  const splitCardAmount = Math.max(0, totals.grandTotal - splitCashInput.value);
  const isValidSplit = splitCashInput.value >= 0 && splitCashInput.value <= totals.grandTotal;

  const handleMethodChange = (m: PayMethod) => {
    setMethod(m);
    cashInput.reset(totals.grandTotal.toFixed(2));
    splitCashInput.reset("");
    setPayRef("");
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    let paid = totals.grandTotal;
    let change = 0;

    if (method === "CASH") {
      if (!isValidCash) return;
      paid = cashPaid;
      change = cashChange;
    } else if (method === "SPLIT") {
      if (!isValidSplit) return;
      paid = totals.grandTotal;
    }

    setIsProcessing(true);
    try {
      await onConfirm(method, paid, change, payRef || undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const canConfirm =
    !isProcessing &&
    (method === "CASH" ? isValidCash : method === "SPLIT" ? isValidSplit : true);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0" hideClose>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Payment</DialogTitle>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary tabular-nums">
                ${totals.grandTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex divide-x divide-border/60">
          {/* Left: method tabs + input */}
          <div className="flex-1 p-5 space-y-4">
            {/* Method selector */}
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleMethodChange(id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-all",
                    method === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* CASH */}
            {method === "CASH" && (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Cash Tendered</p>
                  <div
                    className={cn(
                      "flex h-14 items-center justify-end rounded-xl border px-4 text-3xl font-bold tabular-nums transition-colors",
                      isValidCash
                        ? "border-success/30 bg-success/5 text-foreground"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    ${cashInput.raw || "0.00"}
                  </div>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    totals.grandTotal,
                    Math.ceil(totals.grandTotal / 10) * 10,
                    Math.ceil(totals.grandTotal / 50) * 50,
                    Math.ceil(totals.grandTotal / 100) * 100,
                  ]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 4)
                    .map((amt) => (
                      <button
                        key={amt}
                        onClick={() => cashInput.reset(amt.toFixed(2))}
                        className="rounded-lg border border-border bg-muted/50 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                      >
                        ${amt % 1 === 0 ? amt : amt.toFixed(2)}
                      </button>
                    ))}
                </div>

                <NumPad onKey={cashInput.handleKey} />
              </div>
            )}

            {/* CARD */}
            {method === "CARD" && (
              <div className="space-y-3">
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Swipe or insert card
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Amount: ${totals.grandTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Reference / Approval Code (optional)
                  </p>
                  <Input
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. 123456"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* MOBILE */}
            {method === "MOBILE_MONEY" && (
              <div className="space-y-3">
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 text-center">
                  <Smartphone className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Mobile Money Payment
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Amount: ${totals.grandTotal.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Transaction Reference
                  </p>
                  <Input
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Enter transaction ref"
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* SPLIT */}
            {method === "SPLIT" && (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Cash Amount</p>
                  <div className="flex h-12 items-center justify-end rounded-xl border border-border px-4 text-2xl font-bold tabular-nums bg-muted">
                    ${splitCashInput.raw || "0.00"}
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">${totals.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Banknote className="h-3 w-3" /> Cash
                    </span>
                    <span className="font-semibold">${splitCashInput.value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> Card
                    </span>
                    <span className="font-semibold text-primary">
                      ${splitCardAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <NumPad onKey={splitCashInput.handleKey} />
              </div>
            )}
          </div>

          {/* Right: summary + confirm */}
          <div className="flex w-52 flex-col bg-muted/20 p-5">
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Summary
              </p>

              <div className="space-y-1.5">
                <Row label="Items" value={`${totals.subtotal.toFixed(2)}`} />
                {totals.itemDiscounts > 0 && (
                  <Row label="Discounts" value={`−${totals.itemDiscounts.toFixed(2)}`} className="text-success" />
                )}
                {totals.taxAmount > 0 && (
                  <Row label="Tax" value={`${totals.taxAmount.toFixed(2)}`} />
                )}
                {totals.cartDiscount > 0 && (
                  <Row label="Cart Disc." value={`−${totals.cartDiscount.toFixed(2)}`} className="text-success" />
                )}
                <div className="border-t border-border/60 pt-1.5">
                  <Row label="Total" value={`$${totals.grandTotal.toFixed(2)}`} bold />
                </div>
              </div>

              {method === "CASH" && isValidCash && (
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 space-y-1">
                  <Row label="Paid" value={`$${cashPaid.toFixed(2)}`} className="text-foreground" />
                  <Row
                    label="Change"
                    value={`$${cashChange.toFixed(2)}`}
                    bold
                    className="text-success"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isProcessing ? "Processing…" : "Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
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
    <div className={cn("flex justify-between text-xs", bold && "font-bold text-sm", className)}>
      <span className={bold ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
