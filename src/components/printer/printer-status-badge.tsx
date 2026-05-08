"use client";

import { Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrinterStatus, usePrinterStatusPoller } from "@/hooks/use-printer";

export function PrinterStatusBadge() {
  usePrinterStatusPoller();
  const { status, config } = usePrinterStatus();

  if (!config?.enabled) return null;

  const label =
    status === "online" ? "Printer" :
    status === "connecting" ? "Connecting…" :
    status === "error" ? "Printer Error" :
    "Printer Offline";

  return (
    <div
      title={
        status === "online"
          ? `Printer online · ${config.connection === "network" ? `${config.address}:${config.port}` : config.address}`
          : status === "connecting"
          ? "Connecting to printer…"
          : "Printer offline"
      }
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        status === "online" && "border-success/30 bg-success/10 text-success",
        status === "connecting" && "border-warning/30 bg-warning/10 text-warning",
        (status === "offline" || status === "error") && "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {status === "connecting" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "online" ? "bg-success" : "bg-destructive"
          )}
        />
      )}
      <Printer className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}
