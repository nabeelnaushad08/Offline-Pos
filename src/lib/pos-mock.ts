import type { POSCategory, POSProduct } from "@/types/pos";

export const MOCK_CATEGORIES: POSCategory[] = [
  { id: "cat-1", name: "Food & Beverage", slug: "food-beverage", image: null },
  { id: "cat-2", name: "Electronics", slug: "electronics", image: null },
  { id: "cat-3", name: "Clothing", slug: "clothing", image: null },
  { id: "cat-4", name: "Health & Beauty", slug: "health-beauty", image: null },
  { id: "cat-5", name: "Home & Living", slug: "home-living", image: null },
  { id: "cat-6", name: "Stationery", slug: "stationery", image: null },
  { id: "cat-7", name: "Toys & Games", slug: "toys-games", image: null },
  { id: "cat-8", name: "Other", slug: "other", image: null },
];

export const MOCK_PRODUCTS: POSProduct[] = [
  // Food & Beverage
  { id: "p-01", name: "Mineral Water 500ml", sku: "WTR-500", barcode: "5901234567001", image: null, sellingPrice: 1.5, costPrice: 0.8, taxRate: 0, unit: "pcs", stockQuantity: 120, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-02", name: "Mineral Water 1.5L", sku: "WTR-150", barcode: "5901234567002", image: null, sellingPrice: 2.5, costPrice: 1.2, taxRate: 0, unit: "pcs", stockQuantity: 88, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-03", name: "White Rice 5kg", sku: "RCE-005", barcode: "5901234567003", image: null, sellingPrice: 28.0, costPrice: 18.0, taxRate: 0, unit: "bag", stockQuantity: 45, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-04", name: "Cooking Oil 1L", sku: "OIL-001", barcode: "5901234567004", image: null, sellingPrice: 12.5, costPrice: 8.0, taxRate: 0, unit: "btl", stockQuantity: 60, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-05", name: "Sugar 1kg", sku: "SGR-001", barcode: "5901234567005", image: null, sellingPrice: 8.0, costPrice: 5.0, taxRate: 0, unit: "pcs", stockQuantity: 75, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-06", name: "Instant Noodles x5", sku: "NDL-005", barcode: "5901234567006", image: null, sellingPrice: 6.5, costPrice: 3.5, taxRate: 0, unit: "pack", stockQuantity: 90, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-07", name: "Orange Juice 1L", sku: "JUC-ORA", barcode: "5901234567007", image: null, sellingPrice: 5.5, costPrice: 3.0, taxRate: 0, unit: "btl", stockQuantity: 40, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-08", name: "Tomato Paste 400g", sku: "TMP-400", barcode: "5901234567008", image: null, sellingPrice: 4.0, costPrice: 2.2, taxRate: 0, unit: "can", stockQuantity: 2, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-09", name: "Black Coffee 250g", sku: "COF-BLK", barcode: "5901234567009", image: null, sellingPrice: 18.0, costPrice: 11.0, taxRate: 0, unit: "pcs", stockQuantity: 25, categoryId: "cat-1", categoryName: "Food & Beverage" },
  { id: "p-10", name: "Milk Full Cream 1L", sku: "MLK-FCR", barcode: "5901234567010", image: null, sellingPrice: 9.0, costPrice: 5.5, taxRate: 0, unit: "btl", stockQuantity: 30, categoryId: "cat-1", categoryName: "Food & Beverage" },
  // Electronics
  { id: "p-11", name: "AA Batteries x4", sku: "BAT-AA4", barcode: "5901234567011", image: null, sellingPrice: 8.5, costPrice: 4.5, taxRate: 16, unit: "pack", stockQuantity: 3, categoryId: "cat-2", categoryName: "Electronics" },
  { id: "p-12", name: "USB-C Cable 1m", sku: "CAB-USC", barcode: "5901234567012", image: null, sellingPrice: 15.0, costPrice: 7.0, taxRate: 16, unit: "pcs", stockQuantity: 22, categoryId: "cat-2", categoryName: "Electronics" },
  { id: "p-13", name: "Phone Screen Protector", sku: "SPR-PHN", barcode: "5901234567013", image: null, sellingPrice: 12.0, costPrice: 5.0, taxRate: 16, unit: "pcs", stockQuantity: 18, categoryId: "cat-2", categoryName: "Electronics" },
  { id: "p-14", name: "Earphones Basic", sku: "EAR-BSC", barcode: "5901234567014", image: null, sellingPrice: 22.0, costPrice: 12.0, taxRate: 16, unit: "pcs", stockQuantity: 14, categoryId: "cat-2", categoryName: "Electronics" },
  // Health & Beauty
  { id: "p-15", name: "Shampoo 400ml", sku: "SHP-400", barcode: "5901234567015", image: null, sellingPrice: 14.0, costPrice: 7.5, taxRate: 16, unit: "btl", stockQuantity: 32, categoryId: "cat-4", categoryName: "Health & Beauty" },
  { id: "p-16", name: "Toothpaste 150g", sku: "TPT-150", barcode: "5901234567016", image: null, sellingPrice: 6.0, costPrice: 3.0, taxRate: 0, unit: "pcs", stockQuantity: 50, categoryId: "cat-4", categoryName: "Health & Beauty" },
  { id: "p-17", name: "Soap Bar 125g", sku: "SAP-125", barcode: "5901234567017", image: null, sellingPrice: 3.5, costPrice: 1.5, taxRate: 0, unit: "pcs", stockQuantity: 0, categoryId: "cat-4", categoryName: "Health & Beauty" },
  { id: "p-18", name: "Hand Sanitizer 500ml", sku: "SNT-500", barcode: "5901234567018", image: null, sellingPrice: 10.0, costPrice: 5.5, taxRate: 0, unit: "btl", stockQuantity: 28, categoryId: "cat-4", categoryName: "Health & Beauty" },
  // Stationery
  { id: "p-19", name: "A4 Paper Ream 500s", sku: "PPR-A4R", barcode: "5901234567019", image: null, sellingPrice: 18.0, costPrice: 11.0, taxRate: 16, unit: "ream", stockQuantity: 20, categoryId: "cat-6", categoryName: "Stationery" },
  { id: "p-20", name: "Ballpoint Pens x10", sku: "PEN-BPT", barcode: "5901234567020", image: null, sellingPrice: 5.0, costPrice: 2.0, taxRate: 16, unit: "pack", stockQuantity: 40, categoryId: "cat-6", categoryName: "Stationery" },
  // Home & Living
  { id: "p-21", name: "Laundry Detergent 2kg", sku: "DET-2KG", barcode: "5901234567021", image: null, sellingPrice: 22.0, costPrice: 14.0, taxRate: 0, unit: "pcs", stockQuantity: 18, categoryId: "cat-5", categoryName: "Home & Living" },
  { id: "p-22", name: "Dishwashing Liquid 500ml", sku: "DSH-500", barcode: "5901234567022", image: null, sellingPrice: 8.0, costPrice: 4.5, taxRate: 0, unit: "btl", stockQuantity: 35, categoryId: "cat-5", categoryName: "Home & Living" },
  { id: "p-23", name: "Toilet Rolls x10", sku: "TLT-10X", barcode: "5901234567023", image: null, sellingPrice: 12.0, costPrice: 7.0, taxRate: 0, unit: "pack", stockQuantity: 26, categoryId: "cat-5", categoryName: "Home & Living" },
];

export function getFilteredMockProducts(
  search: string,
  categoryId: string | null
): POSProduct[] {
  let products = MOCK_PRODUCTS;
  if (categoryId) {
    products = products.filter((p) => p.categoryId === categoryId);
  }
  if (search.trim()) {
    const lower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        p.barcode?.includes(lower)
    );
  }
  return products;
}
