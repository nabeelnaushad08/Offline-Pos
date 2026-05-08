"use client";

import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useDashboard } from "@/hooks/use-dashboard";

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

export default function DashboardPage() {
  const { data, isLoading, error, refresh } = useDashboard();

  return (
    <div className="space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data
              ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}`
              : "Loading…"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {/* Quick actions */}
      <QuickActions />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Today's Sales"
              value={formatCurrency(data?.stats.todaySales.amount ?? 0)}
              subtitle={`${formatCount(data?.stats.todaySales.count ?? 0)} transactions`}
              change={data?.stats.todaySales.change}
              icon={ShoppingCart}
              iconColor="text-primary"
              iconBg="bg-primary/10"
              delay={0}
            />
            <StatCard
              title="Month Revenue"
              value={formatCurrency(data?.stats.monthRevenue.amount ?? 0)}
              subtitle={`${formatCount(data?.stats.monthRevenue.count ?? 0)} sales`}
              change={data?.stats.monthRevenue.change}
              icon={DollarSign}
              iconColor="text-success"
              iconBg="bg-success/10"
              delay={0.04}
            />
            <StatCard
              title="Total Products"
              value={formatCount(data?.stats.totalProducts ?? 0)}
              subtitle="Active items"
              icon={Package}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10"
              delay={0.08}
            />
            <StatCard
              title="Low Stock"
              value={formatCount(data?.stats.lowStockCount ?? 0)}
              subtitle="Need reorder"
              icon={AlertTriangle}
              iconColor="text-warning"
              iconBg="bg-warning/10"
              delay={0.12}
            />
            <StatCard
              title="Customers"
              value={formatCount(data?.stats.activeCustomers ?? 0)}
              subtitle="Active accounts"
              icon={Users}
              iconColor="text-purple-500"
              iconBg="bg-purple-500/10"
              delay={0.16}
            />
            <StatCard
              title="Pending POs"
              value={formatCount(data?.stats.pendingPurchases ?? 0)}
              subtitle="Purchase orders"
              icon={ClipboardList}
              iconColor="text-orange-500"
              iconBg="bg-orange-500/10"
              delay={0.2}
            />
          </>
        )}
      </div>

      {/* Sales chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Revenue (7 Days)</CardTitle>
              {data && (
                <span className="text-xs text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(data.salesChart.reduce((s, d) => s + d.revenue, 0))}
                  </span>
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <SalesChart data={data?.salesChart ?? []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom row: top products + low stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopProducts products={data?.topProducts ?? []} isLoading={isLoading} />
        <LowStockAlerts products={data?.lowStockProducts ?? []} isLoading={isLoading} />
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={data?.recentTransactions ?? []} isLoading={isLoading} />
    </div>
  );
}
