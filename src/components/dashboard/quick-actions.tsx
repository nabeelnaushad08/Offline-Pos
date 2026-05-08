"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Package, Users, BarChart3, Settings, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    label: "New Sale",
    description: "Open POS",
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10 hover:bg-primary/20",
    border: "border-primary/20",
  },
  {
    label: "Add Product",
    description: "Inventory",
    icon: PlusCircle,
    color: "text-success",
    bg: "bg-success/10 hover:bg-success/20",
    border: "border-success/20",
  },
  {
    label: "Customers",
    description: "Manage",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    border: "border-blue-500/20",
  },
  {
    label: "Purchases",
    description: "Stock in",
    icon: Package,
    color: "text-orange-500",
    bg: "bg-orange-500/10 hover:bg-orange-500/20",
    border: "border-orange-500/20",
  },
  {
    label: "Reports",
    description: "Analytics",
    icon: BarChart3,
    color: "text-purple-500",
    bg: "bg-purple-500/10 hover:bg-purple-500/20",
    border: "border-purple-500/20",
  },
  {
    label: "Settings",
    description: "Configure",
    icon: Settings,
    color: "text-muted-foreground",
    bg: "bg-muted hover:bg-muted/80",
    border: "border-border",
  },
] as const;

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 active:scale-95",
                    action.bg,
                    action.border
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      action.bg.split(" ")[0]
                    )}
                  >
                    <Icon className={cn("h-4 w-4", action.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-none">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
