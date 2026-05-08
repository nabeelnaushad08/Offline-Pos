"use client";

import { useState, useEffect } from "react";
import { Printer, Wifi, Usb, Search, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrinter } from "@/hooks/use-printer";
import { DEFAULT_PRINTER_CONFIG } from "@/types/printer";
import type { PrinterConfig, DetectedPrinter } from "@/types/printer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrinterSetupModal({ open, onClose }: Props) {
  const { config, status, isSaving, saveConfig, testPrint, detectPrinters, refreshStatus } = usePrinter();

  const [form, setForm] = useState<PrinterConfig>(config ?? DEFAULT_PRINTER_CONFIG);
  const [detected, setDetected] = useState<DetectedPrinter[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [testState, setTestState] = useState<"idle" | "running" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (open) {
      setForm(config ?? DEFAULT_PRINTER_CONFIG);
      setTestState("idle");
      setSaveMsg("");
    }
  }, [open, config]);

  const set = <K extends keyof PrinterConfig>(key: K, value: PrinterConfig[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const results = await detectPrinters();
      setDetected(results);
    } finally {
      setDetecting(false);
    }
  };

  const handleTest = async () => {
    setTestState("running");
    setTestMsg("");
    const result = await testPrint();
    setTestState(result.success ? "ok" : "fail");
    setTestMsg(result.error ?? "");
    await refreshStatus();
  };

  const handleSave = async () => {
    setSaveMsg("");
    const result = await saveConfig(form);
    setSaveMsg(result.success ? "Settings saved!" : result.error ?? "Save failed");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full p-0">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <DialogTitle>Printer Setup</DialogTitle>
            </div>
            <button onClick={onClose} className="rounded-sm text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status */}
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
            status === "online" ? "border-success/30 bg-success/10 text-success" :
            status === "connecting" ? "border-warning/30 bg-warning/10 text-warning" :
            "border-destructive/30 bg-destructive/10 text-destructive"
          )}>
            {status === "connecting" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className={cn("h-2 w-2 rounded-full", status === "online" ? "bg-success" : "bg-destructive")} />
            )}
            {status === "online" ? "Printer Online" : status === "connecting" ? "Connecting…" : "Printer Offline"}
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Printer</p>
              <p className="text-xs text-muted-foreground">Activate thermal receipt printer</p>
            </div>
            <button
              onClick={() => set("enabled", !form.enabled)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors focus:outline-none",
                form.enabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                form.enabled ? "left-4" : "left-0.5"
              )} />
            </button>
          </div>

          {form.enabled && (
            <>
              {/* Connection type */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { val: "network" as const, label: "Network (TCP)", icon: Wifi },
                    { val: "usb" as const, label: "USB / Serial", icon: Usb },
                  ] as const).map(({ val, label, icon: Icon }) => (
                    <button
                      key={val}
                      onClick={() => set("connection", val)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors",
                        form.connection === val
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Network settings */}
              {form.connection === "network" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Settings</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-muted-foreground">IP Address</label>
                      <input
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full h-8 rounded-md border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Port</label>
                      <input
                        value={form.port}
                        onChange={(e) => set("port", parseInt(e.target.value) || 9100)}
                        type="number"
                        className="w-full h-8 rounded-md border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* USB settings */}
              {form.connection === "usb" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">USB Device</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Device Path</label>
                    <div className="flex gap-2">
                      <input
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        placeholder="/dev/usb/lp0 or //./USB001"
                        className="flex-1 h-8 rounded-md border border-border/60 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={handleDetect}
                        disabled={detecting}
                      >
                        {detecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                        Detect
                      </Button>
                    </div>
                  </div>
                  {detected.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Detected devices:</p>
                      {detected.map((d) => (
                        <button
                          key={d.path}
                          onClick={() => set("address", d.path)}
                          className={cn(
                            "w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                            form.address === d.path
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {detected.length === 0 && !detecting && (
                    <p className="text-[10px] text-muted-foreground">Click Detect to find connected USB printers</p>
                  )}
                </div>
              )}

              {/* Printer model + paper width */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Printer Model</p>
                  {(["EPSON", "STAR"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => set("modelType", m)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                        form.modelType === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "h-3 w-3 rounded-full border-2",
                        form.modelType === m ? "border-primary bg-primary" : "border-muted-foreground"
                      )} />
                      {m === "EPSON" ? "Epson / Xprinter" : "Star Micronics"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paper Width</p>
                  {([80, 58] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => set("paperWidth", w)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                        form.paperWidth === w
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "h-3 w-3 rounded-full border-2",
                        form.paperWidth === w ? "border-primary bg-primary" : "border-muted-foreground"
                      )} />
                      {w}mm ({w === 80 ? "48 chars" : "32 chars"})
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options</p>
                {([
                  { key: "cashDrawer" as const, label: "Open cash drawer after cash payment", desc: "Sends drawer kick signal on CASH sales" },
                  { key: "autoprint" as const, label: "Auto-print receipt after each sale", desc: "Silently prints when sale is completed" },
                ] as const).map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => set(key, !form[key])}
                    className="w-full flex items-start justify-between gap-3 rounded-lg border border-border/50 p-3 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <div className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                      form[key] ? "bg-primary" : "bg-muted"
                    )}>
                      <span className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        form[key] ? "left-4" : "left-0.5"
                      )} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Test print feedback */}
              {testState !== "idle" && (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                  testState === "ok" ? "border-success/30 bg-success/10 text-success" :
                  testState === "fail" ? "border-destructive/30 bg-destructive/10 text-destructive" :
                  "border-warning/30 bg-warning/10 text-warning"
                )}>
                  {testState === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {testState === "ok" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {testState === "fail" && <XCircle className="h-3.5 w-3.5" />}
                  {testState === "running" ? "Printing test page…" : testState === "ok" ? "Test print successful!" : testMsg || "Test print failed"}
                </div>
              )}
            </>
          )}

          {/* Save feedback */}
          {saveMsg && (
            <p className={cn(
              "text-xs text-center",
              saveMsg.includes("saved") ? "text-success" : "text-destructive"
            )}>
              {saveMsg}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {form.enabled && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleTest}
                disabled={testState === "running"}
              >
                {testState === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Test Print
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isSaving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
