// Inventory management domain types

export interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  unit: string;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  isTrackStock: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface InventorySupplier {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  balance: number;
  productCount: number;
  createdAt: string;
}

export interface InventoryPurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalAmount: number;
}

export interface InventoryPurchase {
  id: string;
  purchaseNumber: string;
  status: "DRAFT" | "ORDERED" | "PARTIAL" | "RECEIVED" | "CANCELLED";
  supplierId: string;
  supplierName: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  items: InventoryPurchaseItem[];
  createdByName: string;
  createdAt: string;
}

export interface StockMovementRecord {
  id: string;
  productId: string;
  productName: string;
  movementType: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  notes: string | null;
  createdAt: string;
  userName: string | null;
}

export interface StockAdjustInput {
  productId: string;
  movementType: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "OPENING_STOCK";
  quantity: number;
  notes: string;
  userId: string;
}

export interface ReceivePurchaseItem {
  purchaseItemId: string;
  productId: string;
  quantityReceived: number;
  unitCost: number;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  supplierId: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  unit: string;
  stockQuantity: string;
  minStockLevel: string;
  maxStockLevel: string;
  isTrackStock: boolean;
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
}

export interface CategoryFormValues {
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
}

export interface SupplierFormValues {
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxNumber: string;
  notes: string;
}

export interface PurchaseFormItem {
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface PurchaseFormValues {
  supplierId: string;
  expectedDate: string;
  notes: string;
  items: PurchaseFormItem[];
}
