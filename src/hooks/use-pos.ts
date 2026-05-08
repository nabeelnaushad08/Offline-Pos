"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { isElectron } from "@/lib/utils";
import { posClient } from "@/lib/ipc-client";
import { MOCK_CATEGORIES, getFilteredMockProducts } from "@/lib/pos-mock";
import type { POSProduct, POSCategory, POSCustomer } from "@/types/pos";

interface UsePosDataResult {
  categories: POSCategory[];
  products: POSProduct[];
  isLoadingProducts: boolean;
  scanBarcode: (barcode: string) => Promise<POSProduct | null>;
  searchCustomers: (term: string) => Promise<POSCustomer[]>;
}

export function usePosData(
  searchTerm: string,
  categoryId: string | null
): UsePosDataResult {
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories once
  useEffect(() => {
    if (isElectron()) {
      posClient.getCategories().then(setCategories).catch(console.error);
    } else {
      setCategories(MOCK_CATEGORIES);
    }
  }, []);

  // Load products with debounce on search changes
  const loadProducts = useCallback(
    (term: string, catId: string | null) => {
      setIsLoadingProducts(true);
      if (isElectron()) {
        posClient
          .getProducts(term || undefined, catId || undefined)
          .then((rows) =>
            rows.map((r) => ({
              ...r,
              categoryName: (r as unknown as { category: { name: string } }).category.name,
            }))
          )
          .then(setProducts)
          .catch(console.error)
          .finally(() => setIsLoadingProducts(false));
      } else {
        setTimeout(() => {
          setProducts(getFilteredMockProducts(term, catId));
          setIsLoadingProducts(false);
        }, 150);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = searchTerm ? 280 : 0;
    debounceRef.current = setTimeout(() => loadProducts(searchTerm, categoryId), delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, categoryId, loadProducts]);

  const scanBarcode = useCallback(async (barcode: string): Promise<POSProduct | null> => {
    if (isElectron()) {
      const row = await posClient.getProductByBarcode(barcode);
      if (!row) return null;
      return {
        ...row,
        categoryName: (row as unknown as { category: { name: string } }).category.name,
      };
    }
    // Mock barcode lookup
    const { MOCK_PRODUCTS } = await import("@/lib/pos-mock");
    return MOCK_PRODUCTS.find((p) => p.barcode === barcode) ?? null;
  }, []);

  const searchCustomers = useCallback(async (term: string): Promise<POSCustomer[]> => {
    if (!term.trim()) return [];
    if (isElectron()) {
      return posClient.searchCustomers(term);
    }
    // Mock customer search
    return [
      { id: "cust-1", name: "John Doe", code: "JDO001", phone: "+1234567890", balance: 0 },
      { id: "cust-2", name: "Mary Smith", code: "MSM002", phone: "+0987654321", balance: 50 },
    ].filter((c) => c.name.toLowerCase().includes(term.toLowerCase()));
  }, []);

  return { categories, products, isLoadingProducts, scanBarcode, searchCustomers };
}
