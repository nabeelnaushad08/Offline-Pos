"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataPoint } from "@/types/dashboard";

interface SalesChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

// Recharts uses ResizeObserver — must be dynamically imported (SSR=false) for static Next.js export
const ChartInner = dynamic(() => import("./sales-chart-inner").then((m) => m.SalesChartInner), {
  ssr: false,
  loading: () => (
    <div className="space-y-2 pt-2">
      <div className="flex items-end gap-1 h-32">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${40 + Math.random() * 60}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  ),
});

export function SalesChart({ data, isLoading }: SalesChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-end gap-1 h-32">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${40 + i * 8}%` }} />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    );
  }

  return <ChartInner data={data} />;
}
