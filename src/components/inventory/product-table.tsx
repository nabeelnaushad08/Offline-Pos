"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Search, Plus, Edit2, Trash2, SlidersHorizontal, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, BarChart2, Download, Upload, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryProduct, InventoryCategory, InventorySupplier } from "@/types/inventory";

interface ProductTableProps {
  products: InventoryProduct[];
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  isLoading: boolean;
  stockFilter: "all" | "low" | "out";
  onAdd: () => void;
  onEdit: (product: InventoryProduct) => void;
  onDelete: (product: InventoryProduct) => void;
  onAdjust: (product: InventoryProduct) => void;
  onImport: () => void;
}

type SortField = "name" | "sku" | "stockQuantity" | "sellingPrice" | "costPrice";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

function exportCSV(products: InventoryProduct[]) {
  const headers = [
    "Name", "SKU", "Barcode", "Category", "Supplier", "Cost Price",
    "Selling Price", "Tax Rate", "Unit", "Stock", "Min Stock", "Status",
  ];
  const rows = products.map((p) => [
    `"${p.name}"`, p.sku, p.barcode ?? "", `"${p.categoryName}"`, `"${p.supplierName ?? ""}"`,
    p.costPrice, p.sellingPrice, p.taxRate, p.unit, p.stockQuantity, p.minStockLevel, p.status,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: InventoryProduct["status"] }) {
  const styles: Record<InventoryProduct["status"], string> = {
    ACTIVE: "bg-success/15 text-success border-success/20",
    INACTIVE: "bg-muted text-muted-foreground border-muted-foreground/20",
    DISCONTINUED: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const labels = { ACTIVE: "Active", INACTIVE: "Inactive", DISCONTINUED: "Discontinued" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", styles[status])}>
      {labels[status]}
    </span>
  );
}

function StockIndicator({ product }: { product: InventoryProduct }) {
  if (!product.isTrackStock) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const isOut = product.stockQuantity <= 0;
  const isLow = !isOut && product.stockQuantity <= product.minStockLevel;
  return (
    <div className="flex items-center gap-1.5">
      {(isOut || isLow) && (
        <AlertTriangle className={cn("h-3 w-3 shrink-0", isOut ? "text-destructive" : "text-warning")} />
      )}
      <span className={cn(
        "text-sm font-semibold tabular-nums",
        isOut ? "text-destructive" : isLow ? "text-warning" : "text-foreground"
      )}>
        {product.stockQuantity}
      </span>
      <span className="text-xs text-muted-foreground">{product.unit}</span>
    </div>
  );
}

export function ProductTable({
  products, categories, suppliers, isLoading, stockFilter,
  onAdd, onEdit, onDelete, onAdjust, onImport,
}: ProductTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) { setSortDir((d) => d === "asc" ? "desc" : "asc"); return field; }
      setSortDir("asc");
      return field;
    });
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q)
      );
    }
    if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
    if (supplierFilter) list = list.filter((p) => p.supplierId === supplierFilter);
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);

    if (stockFilter === "out") list = list.filter((p) => p.isTrackStock && p.stockQuantity <= 0);
    else if (stockFilter === "low") list = list.filter((p) => p.isTrackStock && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel);

    list.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [products, search, categoryFilter, supplierFilter, statusFilter, stockFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectClass = "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <div className="w-3" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 space-y-2.5 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, SKU, or barcode..."
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} className="gap-1.5 h-9">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onImport} className="gap-1.5 h-9">
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button size="sm" onClick={onAdd} className="gap-1.5 h-9">
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className={cn(selectClass, "w-40")}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
            className={cn(selectClass, "w-44")}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={cn(selectClass, "w-36")}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Product <SortIcon field="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("sku")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  SKU <SortIcon field="sku" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort("costPrice")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground ml-auto"
                >
                  Cost <SortIcon field="costPrice" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort("sellingPrice")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground ml-auto"
                >
                  Price <SortIcon field="sellingPrice" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort("stockQuantity")}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground ml-auto"
                >
                  Stock <SortIcon field="stockQuantity" />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? "60%" : j === 7 ? "80px" : "50%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <p className="text-sm text-muted-foreground">No products found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              paginated.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onEdit(product)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                        <BarChart2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                        {product.barcode && (
                          <p className="text-[10px] text-muted-foreground font-mono">{product.barcode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded">{product.sku}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{product.categoryName}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">${product.costPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold tabular-nums">${product.sellingPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StockIndicator product={product} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onAdjust(product)}
                        title="Adjust stock"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <BarChart2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(product)}
                        title="Edit product"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1 bg-destructive/10 rounded-md px-2 py-1">
                          <span className="text-[10px] text-destructive font-medium">Sure?</span>
                          <button
                            onClick={() => { onDelete(product); setDeleteConfirm(null); }}
                            className="text-[10px] text-destructive font-bold hover:underline"
                          >Yes</button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-[10px] text-muted-foreground hover:underline"
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          title="Delete product"
                          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > PAGE_SIZE && (
        <div className="shrink-0 flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const pg = start + i;
              return (
                <Button
                  key={pg}
                  variant={pg === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pg)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pg}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
