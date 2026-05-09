"use client";

import { useState } from "react";
import { Printer, Loader2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrinterStatus, usePrinterStatusPoller } from "@/hooks/use-printer";
import { PrinterSetupModal } from "./printer-setup-modal";

export function PrinterStatusBadge() {
  usePrinterStatusPoller();
  const { status, config } = usePrinterStatus();
  const [showSetup, setShowSetup] = useState(false);

  const isConfigured = config?.enabled;

  // When printer is disabled / not yet configured, show a subtle "Setup Printer" button
  if (!isConfigured) {
    return (
      <>
        <button
          onClick={() => setShowSetup(true)}
          title="Set up thermal printer"
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <Printer className="h-3 w-3" />
          <span className="hidden sm:inline">Setup Printer</span>
          <Settings2 className="h-3 w-3" />
        </button>
        <PrinterSetupModal open={showSetup} onClose={() => setShowSetup(false)} />
      </>
    );
  }

  const label =
    status === "online"     ? "Printer"        :
    status === "connecting" ? "Connecting…"    :
    status === "error"      ? "Printer Error"  :
                              "Printer Offline";

  const tooltip =
    status === "online"
      ? `Online · ${config.connection === "network" ? `${config.address}:${config.port}` : config.address} · Click to configure`
      : status === "connecting"
      ? "Connecting to printer… · Click to configure"
      : "Printer offline · Click to configure";

  return (
    <>
      <button
        onClick={() => setShowSetup(true)}
        title={tooltip}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          status === "online"
            ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
            : status === "connecting"
            ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
            : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
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
        <span className="hidden sm:inline">{label}</span>
      </button>

      <PrinterSetupModal open={showSetup} onClose={() => setShowSetup(false)} />
    </>
  );
}
