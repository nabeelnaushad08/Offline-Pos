"use client";

import { useState, useRef } from "react";
import { Upload, Download, AlertTriangle, CheckCircle2, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InventoryCategory, InventorySupplier, ProductFormValues } from "@/types/inventory";

interface CsvImportModalProps {
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  onClose: () => void;
  onImport: (products: ProductFormValues[]) => Promise<void>;
}

interface ParseError {
  row: number;
  message: string;
}

function downloadTemplate() {
  const headers = [
    "name", "sku", "barcode", "category_name", "supplier_name",
    "cost_price", "selling_price", "tax_rate", "unit",
    "min_stock_level", "status",
  ];
  const example = [
    "Sample Product", "SKU-001", "1234567890", "Food & Beverage",
    "", "5.00", "10.00", "0", "pcs", "10", "ACTIVE",
  ];
  const csv = [headers, example].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory-import-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split("\n");
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function CsvImportModal({ categories, suppliers, onClose, onImport }: CsvImportModalProps) {
  const [preview, setPreview] = useState<ProductFormValues[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { setErrors([{ row: 0, message: "File has no data rows" }]); return; }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const parseErrors: ParseError[] = [];
      const products: ProductFormValues[] = [];

      rows.slice(1).forEach((row, idx) => {
        const rowNum = idx + 2;
        if (row.every((cell) => !cell.trim())) return;

        const get = (key: string) => {
          const colIdx = headers.indexOf(key);
          return colIdx >= 0 ? (row[colIdx] ?? "").trim() : "";
        };

        const name = get("name");
        const sku = get("sku");
        if (!name) { parseErrors.push({ row: rowNum, message: "Missing name" }); return; }
        if (!sku) { parseErrors.push({ row: rowNum, message: `Row ${rowNum}: Missing SKU` }); return; }

        const categoryName = get("category_name");
        const category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!category) { parseErrors.push({ row: rowNum, message: `Row ${rowNum}: Category "${categoryName}" not found` }); return; }

        const supplierName = get("supplier_name");
        const supplier = supplierName ? suppliers.find((s) => s.name.toLowerCase() === supplierName.toLowerCase()) : null;

        const statusRaw = get("status").toUpperCase();
        const status = (["ACTIVE", "INACTIVE", "DISCONTINUED"].includes(statusRaw) ? statusRaw : "ACTIVE") as ProductFormValues["status"];

        products.push({
          name,
          sku,
          barcode: get("barcode"),
          description: get("description"),
          categoryId: category.id,
          supplierId: supplier?.id ?? "",
          costPrice: get("cost_price") || "0",
          sellingPrice: get("selling_price") || "0",
          taxRate: get("tax_rate") || "0",
          unit: get("unit") || "pcs",
          stockQuantity: get("opening_stock") || "0",
          minStockLevel: get("min_stock_level") || "0",
          maxStockLevel: get("max_stock_level") || "",
          isTrackStock: get("track_stock") !== "false",
          status,
        });
      });

      setErrors(parseErrors);
      setPreview(products);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(preview);
      setIsDone(true);
    } catch {
      setErrors([{ row: 0, message: "Import failed. Please try again." }]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg w-full p-0">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <DialogTitle>Import Products from CSV</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {isDone ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mb-3" />
              <p className="text-base font-semibold text-foreground">Import Complete</p>
              <p className="text-sm text-muted-foreground mt-1">
                {preview.length} product{preview.length !== 1 ? "s" : ""} imported successfully
              </p>
              <Button className="mt-4" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-1.5 w-full"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV Template
              </Button>

              <div
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-8 cursor-pointer hover:border-primary/40 hover:bg-muted/10 transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Click to select CSV file</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Or drag and drop</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {errors.length > 0 && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-xs font-semibold text-destructive">{errors.length} error{errors.length !== 1 ? "s" : ""} found</p>
                  </div>
                  {errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-destructive">{e.message}</p>
                  ))}
                  {errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">...and {errors.length - 5} more</p>
                  )}
                </div>
              )}

              {preview.length > 0 && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-xs font-semibold text-success">{preview.length} products ready to import</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Preview: {preview.slice(0, 3).map((p) => p.name).join(", ")}
                    {preview.length > 3 && ` +${preview.length - 3} more`}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isImporting}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={handleImport}
                  disabled={preview.length === 0 || isImporting || errors.length > 0}
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${preview.length > 0 ? preview.length : ""} Products`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
