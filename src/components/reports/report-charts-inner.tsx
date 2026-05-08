"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { DailySalesRow, MonthlySalesRow, CashFlowRow } from "@/types/reports";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "#4ade80",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
};

function fmt(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-xl text-xs">
      {children}
    </div>
  );
}

// ── Daily Sales Chart ─────────────────────────────────────────────────────────

interface DailySalesChartProps {
  data: DailySalesRow[];
}

function DailySalesTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const profit = payload.find((p) => p.dataKey === "profit")?.value ?? 0;
  return (
    <TooltipBox>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Revenue: <span className="font-semibold text-primary">{fmt(rev)}</span></p>
      <p className="text-muted-foreground">Profit: <span className="font-semibold" style={{ color: COLORS.success }}>{fmt(profit)}</span></p>
    </TooltipBox>
  );
}

export function DailySalesChartInner({ data }: DailySalesChartProps) {
  const displayed = data.length > 60 ? data.slice(-60) : data;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={displayed} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} strokeOpacity={0.4} />
        <XAxis dataKey="dayLabel" tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={4} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<DailySalesTooltip />} cursor={{ stroke: COLORS.border, strokeWidth: 1 }} />
        <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="profit" stroke={COLORS.success} strokeWidth={1.5} fill="url(#profGrad)" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Monthly Sales Chart ───────────────────────────────────────────────────────

interface MonthlySalesChartProps {
  data: MonthlySalesRow[];
}

function MonthlySalesTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number; dataKey: string; fill?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const cost = payload.find((p) => p.dataKey === "cost")?.value ?? 0;
  const profit = payload.find((p) => p.dataKey === "profit")?.value ?? 0;
  return (
    <TooltipBox>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Revenue: <span className="font-semibold text-primary">{fmt(rev)}</span></p>
      <p className="text-muted-foreground">COGS: <span className="font-semibold text-destructive">{fmt(cost)}</span></p>
      <p className="text-muted-foreground">Profit: <span className="font-semibold" style={{ color: COLORS.success }}>{fmt(profit)}</span></p>
    </TooltipBox>
  );
}

export function MonthlySalesChartInner({ data }: MonthlySalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} strokeOpacity={0.4} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} dy={4} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<MonthlySalesTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }} />
        <Bar dataKey="revenue" fill={COLORS.primary} fillOpacity={0.7} radius={[2, 2, 0, 0]} maxBarSize={28} />
        <Bar dataKey="profit" fill={COLORS.success} fillOpacity={0.8} radius={[2, 2, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Profit Loss Chart ─────────────────────────────────────────────────────────

function ProfitLossTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const profit = payload.find((p) => p.dataKey === "profit")?.value ?? 0;
  const margin = payload.find((p) => p.dataKey === "grossMargin")?.value ?? 0;
  return (
    <TooltipBox>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Gross Profit: <span className="font-semibold" style={{ color: profit >= 0 ? COLORS.success : "hsl(var(--destructive))" }}>{fmt(profit)}</span></p>
      <p className="text-muted-foreground">Margin: <span className="font-semibold text-foreground">{margin.toFixed(1)}%</span></p>
    </TooltipBox>
  );
}

export function ProfitLossChartInner({ data }: MonthlySalesChartProps) {
  const chartData = data.map((r) => ({
    ...r,
    grossMargin: r.revenue > 0 ? Math.round((r.profit / r.revenue) * 1000) / 10 : 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} strokeOpacity={0.4} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} dy={4} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ProfitLossTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.3 }} />
        <ReferenceLine y={0} stroke={COLORS.border} strokeWidth={1} />
        <Bar dataKey="profit" radius={[2, 2, 0, 0]} maxBarSize={32}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? COLORS.success : "hsl(var(--destructive))"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Cash Flow Chart ───────────────────────────────────────────────────────────

interface CashFlowChartProps {
  data: CashFlowRow[];
}

function CashFlowTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const inflow = payload.find((p) => p.dataKey === "salesInflow")?.value ?? 0;
  const outflow = payload.find((p) => p.dataKey === "purchaseOutflow")?.value ?? 0;
  const balance = payload.find((p) => p.dataKey === "runningBalance")?.value ?? 0;
  return (
    <TooltipBox>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Inflow: <span className="font-semibold" style={{ color: COLORS.success }}>{fmt(inflow)}</span></p>
      <p className="text-muted-foreground">Outflow: <span className="font-semibold text-destructive">{fmt(outflow)}</span></p>
      <p className="text-muted-foreground">Balance: <span className="font-semibold text-foreground">{fmt(balance)}</span></p>
    </TooltipBox>
  );
}

export function CashFlowChartInner({ data }: CashFlowChartProps) {
  const displayed = data.length > 60 ? data.slice(-60) : data;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={displayed} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} strokeOpacity={0.4} />
        <XAxis dataKey="dayLabel" tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" dy={4} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: COLORS.muted }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<CashFlowTooltip />} cursor={{ stroke: COLORS.border, strokeWidth: 1 }} />
        <Area type="monotone" dataKey="runningBalance" stroke={COLORS.primary} strokeWidth={2} fill="url(#balanceGrad)" dot={false} />
        <Area type="monotone" dataKey="salesInflow" stroke={COLORS.success} strokeWidth={1.5} fill="url(#inflowGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
