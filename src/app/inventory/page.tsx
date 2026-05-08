"use client";

import { useState } from "react";
import { Boxes, Tag, Building2, ShoppingBag } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useInventoryStore } from "@/store/inventory-store";
import { useAuth } from "@/hooks/use-auth";
import { LowStockBanner } from "@/components/inventory/low-stock-banner";
import { ProductTable } from "@/components/inventory/product-table";
import { ProductModal } from "@/components/inventory/product-modal";
import { StockAdjustModal } from "@/components/inventory/stock-adjust-modal";
import { CategoryTab } from "@/components/inventory/category-tab";
import { SupplierTab } from "@/components/inventory/supplier-tab";
import { PurchaseTab } from "@/components/inventory/purchase-tab";
import { CsvImportModal } from "@/components/inventory/csv-import-modal";
import { cn } from "@/lib/utils";
import type { InventoryProduct, ProductFormValues } from "@/types/inventory";

type Tab = "products" | "categories" | "suppliers" | "purchases";

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: "products", label: "Products", icon: Boxes },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "suppliers", label: "Suppliers", icon: Building2 },
  { id: "purchases", label: "Purchases", icon: ShoppingBag },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const { activeTab, stockFilter, setActiveTab, setStockFilter } = useInventoryStore();
  const inventory = useInventory();

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<InventoryProduct | null>(null);
  const [showImport, setShowImport] = useState(false);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: InventoryProduct) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (data: ProductFormValues) => {
    if (editingProduct) {
      await inventory.updateProduct(editingProduct.id, data);
    } else {
      await inventory.createProduct(data);
    }
  };

  const handleDeleteProduct = async (product: InventoryProduct) => {
    await inventory.deleteProduct(product.id);
  };

  const handleViewLowStock = () => {
    setActiveTab("products");
    setStockFilter("low");
  };

  const handleImport = async (products: ProductFormValues[]) => {
    for (const product of products) {
      await inventory.createProduct(product);
    }
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {inventory.products.length} products · {inventory.categories.length} categories · {inventory.suppliers.length} suppliers
          </p>
        </div>
      </div>

      {/* Low stock banner (only on products tab) */}
      {activeTab === "products" && (
        <LowStockBanner products={inventory.products} onViewLowStock={handleViewLowStock} />
      )}

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 border-b border-border/50 mb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {id === "products" && !inventory.isLoading && (
              <span className={cn(
                "ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                activeTab === id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {inventory.products.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stock filter quick pills (products tab only) */}
      {activeTab === "products" && (
        <div className="shrink-0 flex items-center gap-2 mb-3">
          {(["all", "low", "out"] as const).map((f) => {
            const count = f === "all"
              ? inventory.products.length
              : f === "low"
                ? inventory.products.filter((p) => p.isTrackStock && p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length
                : inventory.products.filter((p) => p.isTrackStock && p.stockQuantity <= 0).length;
            return (
              <button
                key={f}
                onClick={() => setStockFilter(f)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  stockFilter === f
                    ? f === "out" ? "border-destructive bg-destructive/10 text-destructive"
                      : f === "low" ? "border-warning bg-warning/10 text-warning"
                      : "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
                <span className={cn(
                  "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold",
                  stockFilter === f ? "bg-current/20" : "bg-muted"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "products" && (
          <ProductTable
            products={inventory.products}
            categories={inventory.categories}
            suppliers={inventory.suppliers}
            isLoading={inventory.isLoading}
            stockFilter={stockFilter}
            onAdd={handleAddProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onAdjust={setAdjustProduct}
            onImport={() => setShowImport(true)}
          />
        )}

        {activeTab === "categories" && (
          <div className="overflow-y-auto h-full">
            <CategoryTab
              categories={inventory.categories}
              products={inventory.products}
              onCreate={inventory.createCategory}
              onUpdate={inventory.updateCategory}
              onDelete={inventory.deleteCategory}
            />
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="overflow-y-auto h-full">
            <SupplierTab
              suppliers={inventory.suppliers}
              products={inventory.products}
              onCreate={inventory.createSupplier}
              onUpdate={inventory.updateSupplier}
            />
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="overflow-y-auto h-full">
            <PurchaseTab
              purchases={inventory.purchases}
              products={inventory.products}
              suppliers={inventory.suppliers}
              userId={user?.id ?? ""}
              onCreate={(data) => inventory.createPurchase(data, user?.id ?? "")}
              onReceive={inventory.receivePurchase}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={inventory.categories}
          suppliers={inventory.suppliers}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          userId={user?.id ?? ""}
          onClose={() => setAdjustProduct(null)}
          onAdjust={inventory.adjustStock}
        />
      )}

      {showImport && (
        <CsvImportModal
          categories={inventory.categories}
          suppliers={inventory.suppliers}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
