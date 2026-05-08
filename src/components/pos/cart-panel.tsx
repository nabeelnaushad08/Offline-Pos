"use client";

import { useState } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ShoppingCart,
  UserRound,
  StickyNote,
  Layers,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePosStore } from "@/store/pos-store";
import type { CartItem } from "@/types/pos";

interface CartItemRowProps {
  item: CartItem;
}

function CartItemRow({ item }: CartItemRowProps) {
  const { removeItem, updateQty, setItemDiscount } = usePosStore();
  const [showDiscount, setShowDiscount] = useState(false);
  const lineSubtotal = item.quantity * item.unitPrice;
  const lineAfterDiscount = lineSubtotal - item.itemDiscount;

  return (
    <div className="group px-3 py-2.5 hover:bg-muted/40 rounded-lg transition-colors">
      <div className="flex items-start gap-2">
        {/* Name + sku */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">
            {item.name}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
          {item.itemDiscount > 0 && (
            <p className="text-[10px] text-success">
              −${item.itemDiscount.toFixed(2)} discount
            </p>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => removeItem(item.productId)}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        {/* Qty control */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background">
          <button
            onClick={() => updateQty(item.productId, item.quantity - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-l-md hover:bg-muted transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-xs font-semibold tabular-nums">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQty(item.productId, item.quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-r-md hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <span className="text-[10px] text-muted-foreground">
          @${item.unitPrice.toFixed(2)}
        </span>

        <div className="flex-1" />

        {/* Discount toggle */}
        <button
          onClick={() => setShowDiscount((v) => !v)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded transition-colors",
            showDiscount ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Tag className="h-3 w-3" />
        </button>

        {/* Line total */}
        <span className="text-xs font-bold text-foreground tabular-nums w-14 text-right">
          ${lineAfterDiscount.toFixed(2)}
        </span>
      </div>

      {/* Inline discount input */}
      {showDiscount && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Discount $</span>
          <Input
            type="number"
            min={0}
            max={lineSubtotal}
            step={0.01}
            value={item.itemDiscount || ""}
            onChange={(e) => {
              const v = Math.min(parseFloat(e.target.value) || 0, lineSubtotal);
              setItemDiscount(item.productId, v);
            }}
            className="h-6 w-24 text-xs py-0 px-2"
          />
          <button
            onClick={() => setShowDiscount(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            done
          </button>
        </div>
      )}
    </div>
  );
}

interface CartPanelProps {
  onPay: () => void;
  onHold: () => void;
  onHeldBills: () => void;
  heldCount: number;
  customerSearchNode: React.ReactNode;
}

export function CartPanel({
  onPay,
  onHold,
  onHeldBills,
  heldCount,
  customerSearchNode,
}: CartPanelProps) {
  const {
    items,
    cartDiscount,
    note,
    customerName,
    setCartDiscount,
    setNote,
    clearCart,
    getTotals,
    getItemCount,
  } = usePosStore();

  const [showNote, setShowNote] = useState(false);
  const [showCartDiscount, setShowCartDiscount] = useState(false);
  const totals = getTotals();
  const itemCount = getItemCount();

  return (
    <div className="flex h-full flex-col bg-card/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Cart</span>
          {itemCount > 0 && (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] font-bold">
              {itemCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Held bills */}
          <button
            onClick={onHeldBills}
            className="relative flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Hold</span>
            {heldCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {heldCount}
              </span>
            )}
          </button>
          {/* Clear cart */}
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer selector */}
      <div className="border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {customerName ? (
            <span className="text-xs font-medium text-foreground truncate flex-1">
              {customerName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground flex-1">Walk-in Customer</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
        {customerSearchNode}
      </div>

      {/* Cart items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Tap products to add them
            </p>
          </div>
        ) : (
          <div className="py-1">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals + actions */}
      {items.length > 0 && (
        <div className="border-t border-border/60">
          {/* Totals */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.itemDiscounts > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Item Discounts</span>
                <span className="tabular-nums">−${totals.itemDiscounts.toFixed(2)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax</span>
                <span className="tabular-nums">${totals.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {totals.cartDiscount > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Cart Discount</span>
                <span className="tabular-nums">−${totals.cartDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total</span>
              <span className="tabular-nums text-primary">
                ${totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Cart discount + note */}
          {(showCartDiscount || showNote) && (
            <div className="px-4 pb-2 space-y-2">
              {showCartDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Cart discount $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={cartDiscount || ""}
                    onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                </div>
              )}
              {showNote && (
                <Input
                  placeholder="Order note…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus={!showCartDiscount}
                />
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex gap-1.5 px-3 pb-2">
            <button
              onClick={() => setShowCartDiscount((v) => !v)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors",
                showCartDiscount
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              <Tag className="h-3.5 w-3.5" />
              Discount
            </button>
            <button
              onClick={() => setShowNote((v) => !v)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors",
                showNote
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
              )}
            >
              <StickyNote className="h-3.5 w-3.5" />
              Note
            </button>
            <button
              onClick={onHold}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:border-primary/20 hover:text-foreground transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              Hold
            </button>
          </div>

          {/* Pay button */}
          <div className="px-3 pb-3">
            <Button
              onClick={onPay}
              className="w-full h-12 text-sm font-bold rounded-xl gap-2 shadow-lg shadow-primary/20"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4" />
              Pay ${totals.grandTotal.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
