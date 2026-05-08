// POS-specific types — cart, products, categories, payment

export interface POSProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  image: string | null;
  sellingPrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  stockQuantity: number;
  categoryId: string;
  categoryName: string;
}

export interface POSCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export interface POSCustomer {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  balance: number;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  image: string | null;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  quantity: number;
  itemDiscount: number; // flat monetary discount on this line
}

export interface HeldBill {
  id: string;
  label: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  cartDiscount: number;
  note: string;
  heldAt: string;
}

export interface CartTotals {
  subtotal: number;      // sum(qty × unitPrice)
  itemDiscounts: number; // sum of per-line discounts
  netSubtotal: number;   // subtotal − itemDiscounts
  taxAmount: number;     // sum of per-line taxes after item discounts
  cartDiscount: number;  // cart-level flat discount
  grandTotal: number;    // netSubtotal + taxAmount − cartDiscount
}

export interface CompleteSaleInput {
  userId: string;
  customerId: string | null;
  items: CompleteSaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentRef?: string;
  notes?: string;
}

export interface CompleteSaleItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
}

export interface CompleteSaleResult {
  success: boolean;
  saleId?: string;
  saleNumber?: string;
  error?: string;
}

// Completed sale data for the receipt
export interface CompletedSale {
  saleId: string;
  saleNumber: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  cashierName: string;
  completedAt: string;
}
