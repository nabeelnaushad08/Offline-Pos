// Foundation type exports — domain types are added per module

export type { SettingRecord, DatabaseInfo, BackupResult, ElectronAPI } from "./api";
export * from "./enums";

// ── Utility types ────────────────────────────────────────────────────────────

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export type SortDirection = "asc" | "desc";

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Navigation ───────────────────────────────────────────────────────────────

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};
