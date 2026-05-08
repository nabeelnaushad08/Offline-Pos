"use client";

import { useRef, useEffect } from "react";
import { Search, Barcode, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  onBarcodeScan?: (barcode: string) => void;
  placeholder?: string;
}

export function ProductSearch({
  value,
  onChange,
  placeholder = "Search products or scan barcode… (F2)",
}: ProductSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // F2 focuses the search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onChange("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-10 pr-20 h-11 bg-background text-sm",
          "focus-visible:ring-primary/30"
        )}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {value && (
          <button
            onClick={() => onChange("")}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5">
          <Barcode className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-mono">F2</span>
        </div>
      </div>
    </div>
  );
}
