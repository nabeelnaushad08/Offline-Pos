"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Point of Sale", href: "/pos", icon: ShoppingCart },
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Customers", href: "/customers", icon: Users, badge: "Soon" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Database", href: "/database", icon: Database, badge: "Soon" },
      { label: "Settings", href: "/settings", icon: Settings, badge: "Soon" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar, toggleSidebar } = useAppStore();
  const isExpanded = sidebar === "expanded";

  return (
    <motion.aside
      animate={{ width: isExpanded ? 240 : 68 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-full flex-col border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap"
              >
                Offline POS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-6 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <AnimatePresence>
                {isExpanded && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={!isExpanded ? item.label : undefined}
                        className={cn(
                          "group flex h-9 items-center gap-3 rounded-md px-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                              {item.badge && (
                                <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4">
                                  {item.badge}
                                </Badge>
                              )}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-full text-muted-foreground hover:text-foreground"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
