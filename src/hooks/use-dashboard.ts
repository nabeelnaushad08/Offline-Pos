"use client";

import { useEffect, useState, useCallback } from "react";
import { isElectron } from "@/lib/utils";
import { dashboardClient } from "@/lib/ipc-client";
import { getMockDashboardData } from "@/lib/dashboard-mock";
import type { DashboardData } from "@/types/dashboard";

interface UseDashboardResult {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isElectron()) {
        const result = await dashboardClient.getData();
        setData(result);
      } else {
        // Browser dev mode — use realistic mock data
        await new Promise((r) => setTimeout(r, 600));
        setData(getMockDashboardData());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}
