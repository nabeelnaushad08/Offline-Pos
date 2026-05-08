import { create } from "zustand";

type InventoryTab = "products" | "categories" | "suppliers" | "purchases";
type StockFilter = "all" | "low" | "out";

interface InventoryUIState {
  activeTab: InventoryTab;
  stockFilter: StockFilter;
  setActiveTab: (tab: InventoryTab) => void;
  setStockFilter: (f: StockFilter) => void;
}

export const useInventoryStore = create<InventoryUIState>()((set) => ({
  activeTab: "products",
  stockFilter: "all",
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStockFilter: (stockFilter) => set({ stockFilter }),
}));
