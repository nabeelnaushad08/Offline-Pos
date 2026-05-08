"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  delay = 0,
}: StatCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isUp = hasChange && change > 0;
  const isDown = hasChange && change < 0;
  const isFlat = hasChange && change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      <Card className="border-border/50 hover:border-primary/20 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {title}
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              {subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
              )}
              {hasChange && (
                <div
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    isUp && "bg-success/10 text-success",
                    isDown && "bg-destructive/10 text-destructive",
                    isFlat && "bg-muted text-muted-foreground"
                  )}
                >
                  {isUp && <TrendingUp className="h-3 w-3" />}
                  {isDown && <TrendingDown className="h-3 w-3" />}
                  {isFlat && <Minus className="h-3 w-3" />}
                  <span>
                    {isUp ? "+" : ""}
                    {change}% vs yesterday
                  </span>
                </div>
              )}
            </div>
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                iconBg,
                "border-transparent"
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
