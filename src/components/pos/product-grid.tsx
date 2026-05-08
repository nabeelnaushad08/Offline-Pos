"use client";

import { motion } from "framer-motion";
import { PackageX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePosStore } from "@/store/pos-store";
import type { POSProduct } from "@/types/pos";

// Deterministic card accent color from product id
const ACCENTS = [
  "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
  "from-violet-500/20 to-violet-600/5 border-violet-500/20",
  "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  "from-pink-500/20 to-pink-600/5 border-pink-500/20",
  "from-teal-500/20 to-teal-600/5 border-teal-500/20",
  "from-amber-500/20 to-amber-600/5 border-amber-500/20",
  "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
];

const ICON_COLORS = [
  "text-blue-400",
  "text-emerald-400",
  "text-violet-400",
  "text-orange-400",
  "text-pink-400",
  "text-teal-400",
  "text-amber-400",
  "text-cyan-400",
];

function accentIndex(id: string): number {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % ACCENTS.length;
}

function ProductEmoji({ name }: { name: string }) {
  const first = name.toLowerCase();
  if (first.includes("water")) return "💧";
  if (first.includes("rice")) return "🌾";
  if (first.includes("oil")) return "🫙";
  if (first.includes("sugar")) return "🍬";
  if (first.includes("noodle") || first.includes("pasta")) return "🍜";
  if (first.includes("juice")) return "🧃";
  if (first.includes("milk")) return "🥛";
  if (first.includes("coffee")) return "☕";
  if (first.includes("battery") || first.includes("batteries")) return "🔋";
  if (first.includes("cable")) return "🔌";
  if (first.includes("phone") || first.includes("screen")) return "📱";
  if (first.includes("earphone") || first.includes("headphone")) return "🎧";
  if (first.includes("shampoo") || first.includes("soap")) return "🧴";
  if (first.includes("toothpaste")) return "🪥";
  if (first.includes("paper")) return "📄";
  if (first.includes("pen")) return "✏️";
  if (first.includes("detergent") || first.includes("laundry")) return "🫧";
  if (first.includes("toilet")) return "🧻";
  if (first.includes("toy")) return "🧸";
  return "📦";
}

interface ProductCardProps {
  product: POSProduct;
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = usePosStore();
  const idx = accentIndex(product.id);
  const cartItem = items.find((i) => i.productId === product.id);
  const inCart = (cartItem?.quantity ?? 0) > 0;
  const outOfStock = product.stockQuantity <= 0;

  return (
    <motion.button
      whileTap={{ scale: outOfStock ? 1 : 0.96 }}
      transition={{ duration: 0.1 }}
      onClick={() => !outOfStock && addItem(product)}
      disabled={outOfStock}
      className={cn(
        "relative flex flex-col rounded-xl border bg-gradient-to-b p-3 text-left transition-all duration-150",
        ACCENTS[idx],
        outOfStock
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:shadow-black/10 active:shadow-none",
        inCart && "ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
      )}
    >
      {/* Cart quantity badge */}
      {inCart && (
        <div className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow">
          {cartItem!.quantity}
        </div>
      )}

      {/* Out of stock overlay */}
      {outOfStock && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 z-10">
          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border">
            Out of Stock
          </span>
        </div>
      )}

      {/* Emoji / image */}
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 text-xl">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`file://${product.image}`}
            alt={product.name}
            className="h-9 w-9 rounded-md object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className={cn("text-lg", ICON_COLORS[idx])}>
            <ProductEmoji name={product.name} />
          </span>
        )}
      </div>

      {/* Name */}
      <p className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
        {product.name}
      </p>

      {/* SKU */}
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground font-mono">
        {product.sku}
      </p>

      {/* Price + stock */}
      <div className="mt-2 flex items-end justify-between gap-1">
        <span className="text-sm font-bold text-foreground">
          ${product.sellingPrice.toFixed(2)}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium",
            product.stockQuantity <= 5
              ? "text-warning"
              : "text-muted-foreground"
          )}
        >
          {product.stockQuantity} {product.unit}
        </span>
      </div>
    </motion.button>
  );
}

interface ProductGridProps {
  products: POSProduct[];
  isLoading: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <PackageX className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-foreground">No products found</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Try a different search or category
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
