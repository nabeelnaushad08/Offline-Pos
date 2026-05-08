"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { POSCategory } from "@/types/pos";

interface CategoryFilterProps {
  categories: POSCategory[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs = [{ id: null, name: "All" }, ...categories];

  return (
    <div
      ref={scrollRef}
      className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id ?? "all"}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
            selected === tab.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
          )}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
