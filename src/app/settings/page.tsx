"use client";

import { useState, useEffect } from "react";
import { Printer, Store, HardDrive, CheckCircle2, XCircle, Loader2, Wifi, Usb, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isElectron } from "@/lib/utils";
import { usePrinter } from "@/hooks/use-printer";
import { DEFAULT_PRINTER_CONFIG } from "@/types/printer";
import type { PrinterConfig, DetectedPrinter } from "@/types/printer";

type Tab = "printer" | "store" | "system";

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  receiptFooter: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("printer");

  return (
    <div className="flex flex-col h-full gap-0">
      <div className="shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure printer, store info, and system settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 border-b border-border/50 mb-6">
        {([
          { id: "printer" as const, label: "Printer", icon: Printer },
          { id: "store" as const, label: "Store Info", icon: Store },
          { id: "system" as const, label: "System", icon: HardDrive },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {activeTab === "printer" && <PrinterSettings />}
        {activeTab === "store" && <StoreSettings />}
        {activeTab === "system" && <SystemSettings />}
      </div>
    </div>
  );
}

// ── Printer Settings ────────────────────────────────────────────────────────

function PrinterSettings() {
  const { config, status, isSaving, saveConfig, testPrint, detectPrinters, refreshStatus } = usePrinter();
  const [form, setForm] = useState<PrinterConfig>(config ?? DEFAULT_PRINTER_CONFIG);
  const [detected, setDetected] = useState<DetectedPrinter[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [testState, setTestState] = useState<"idle" | "running" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const set = <K extends keyof PrinterConfig>(key: K, value: PrinterConfig[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleDetect = async () => {
    setDetecting(true);
    try {
      setDetected(await detectPrinters());
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
    setSaved(false);
    const result = await saveConfig(form);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Status card */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              status === "online" ? "border-success/30 bg-success/10" :
              status === "connecting" ? "border-warning/30 bg-warning/10" :
              "border-destructive/30 bg-destructive/10"
            )}>
              {status === "connecting" ? (
                <Loader2 className={cn("h-5 w-5 animate-spin text-warning")} />
              ) : (
                <Printer className={cn("h-5 w-5", status === "online" ? "text-success" : "text-destructive")} />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {status === "online" ? "Printer Online" : status === "connecting" ? "Connecting…" : status === "error" ? "Printer Error" : "Printer Offline"}
              </p>
              <p className="text-xs text-muted-foreground">
                {config?.enabled
                  ? config.connection === "network"
                    ? `TCP ${config.address}:${config.port}`
                    : `USB ${config.address}`
                  : "Not configured"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={refreshStatus}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Enable / disable */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Enable Thermal Printer</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activate receipt printing and cash drawer integration
            </p>
          </div>
          <button
            onClick={() => set("enabled", !form.enabled)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              form.enabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              form.enabled ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {form.enabled && (
        <>
          {/* Connection type */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Connection</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { val: "network" as const, label: "Network (TCP/IP)", desc: "Connect via IP address", icon: Wifi },
                { val: "usb" as const, label: "USB Direct", desc: "Connect via USB cable", icon: Usb },
              ] as const).map(({ val, label, desc, icon: Icon }) => (
                <button
                  key={val}
                  onClick={() => set("connection", val)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    form.connection === val
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:border-border hover:bg-muted/20"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border mt-0.5",
                    form.connection === val ? "border-primary/30 bg-primary/10" : "border-border/50"
                  )}>
                    <Icon className={cn("h-4 w-4", form.connection === val ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", form.connection === val ? "text-primary" : "text-foreground")}>{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {form.connection === "network" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">IP Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Port</label>
                  <input
                    value={form.port}
                    onChange={(e) => set("port", parseInt(e.target.value) || 9100)}
                    type="number"
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            {form.connection === "usb" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Device Path</label>
                <div className="flex gap-2">
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="e.g. /dev/usb/lp0 or //./USB001"
                    className="flex-1 h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleDetect} disabled={detecting}>
                    {detecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    {detecting ? "Scanning…" : "Auto-Detect"}
                  </Button>
                </div>
                {detected.length > 0 && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-2 space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground px-1">Detected devices:</p>
                    {detected.map((d) => (
                      <button
                        key={d.path}
                        onClick={() => set("address", d.path)}
                        className={cn(
                          "w-full text-left rounded-md px-2.5 py-1.5 text-xs transition-colors",
                          form.address === d.path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hardware config */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Hardware Configuration</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Printer Driver</p>
                {(["EPSON", "STAR"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => set("modelType", m)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                      form.modelType === m ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full border-2", form.modelType === m ? "border-primary bg-primary" : "border-muted-foreground")} />
                    {m === "EPSON" ? "Epson / Xprinter (ESC/POS)" : "Star Micronics"}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Paper Width</p>
                {([80, 58] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => set("paperWidth", w)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                      form.paperWidth === w ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full border-2", form.paperWidth === w ? "border-primary bg-primary" : "border-muted-foreground")} />
                    {w}mm · {w === 80 ? "Standard (48 chars)" : "Narrow (32 chars)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Options</p>
            {([
              { key: "cashDrawer" as const, label: "Open Cash Drawer", desc: "Automatically trigger cash drawer after CASH payment" },
              { key: "autoprint" as const, label: "Auto-Print Receipt", desc: "Silently print receipt when a sale is completed" },
            ] as const).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => set(key, !form[key])}
                  className={cn("relative h-6 w-11 rounded-full transition-colors", form[key] ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform", form[key] ? "left-6" : "left-1")} />
                </button>
              </div>
            ))}
          </div>

          {/* Test result */}
          {testState !== "idle" && (
            <div className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
              testState === "ok" ? "border-success/30 bg-success/10 text-success" :
              testState === "fail" ? "border-destructive/30 bg-destructive/10 text-destructive" :
              "border-warning/30 bg-warning/10 text-warning"
            )}>
              {testState === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
              {testState === "ok" && <CheckCircle2 className="h-4 w-4" />}
              {testState === "fail" && <XCircle className="h-4 w-4" />}
              {testState === "running" ? "Printing test page…" : testState === "ok" ? "Test print successful!" : testMsg || "Test print failed. Check connection."}
            </div>
          )}
        </>
      )}

      {/* Save row */}
      <div className="flex items-center gap-3">
        {form.enabled && (
          <Button variant="outline" className="gap-1.5" onClick={handleTest} disabled={testState === "running"}>
            {testState === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            Test Print
          </Button>
        )}
        <Button className="flex-1 gap-1.5" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {isSaving ? "Saving…" : saved ? "Saved!" : "Save Printer Settings"}
        </Button>
      </div>
    </div>
  );
}

// ── Store Settings ────────────────────────────────────────────────────────────

function StoreSettings() {
  const [form, setForm] = useState<StoreInfo>({ name: "My Store", address: "", phone: "", receiptFooter: "Thank you for your business!" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isElectron()) { setIsLoading(false); return; }
    window.electron.settings.getAll().then((rows) => {
      const m = new Map(rows.map((r) => [r.key, r.value]));
      setForm({
        name: m.get("store.name") ?? "My Store",
        address: m.get("store.address") ?? "",
        phone: m.get("store.phone") ?? "",
        receiptFooter: m.get("store.receiptFooter") ?? "Thank you for your business!",
      });
    }).finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!isElectron()) return;
    setIsSaving(true);
    try {
      await Promise.all([
        window.electron.settings.set("store.name", form.name),
        window.electron.settings.set("store.address", form.address),
        window.electron.settings.set("store.phone", form.phone),
        window.electron.settings.set("store.receiptFooter", form.receiptFooter),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Store Information</p>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">This information appears on printed receipts.</p>

        {[
          { key: "name" as const, label: "Store Name", placeholder: "My Store", required: true },
          { key: "address" as const, label: "Address", placeholder: "123 Main Street, City" },
          { key: "phone" as const, label: "Phone Number", placeholder: "+1 555-1234" },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{label}{required && " *"}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Receipt Footer Message</label>
          <textarea
            value={form.receiptFooter}
            onChange={(e) => setForm((f) => ({ ...f, receiptFooter: e.target.value }))}
            placeholder="Thank you for your business!"
            rows={2}
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      <Button className="w-full max-w-xl gap-1.5" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
        {isSaving ? "Saving…" : saved ? "Saved!" : "Save Store Info"}
      </Button>
    </div>
  );
}

// ── System Settings ───────────────────────────────────────────────────────────

function SystemSettings() {
  const [dbInfo, setDbInfo] = useState<{ size: number; path: string; tables: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isTogglingAutoLaunch, setIsTogglingAutoLaunch] = useState(false);

  useEffect(() => {
    if (!isElectron()) { setIsLoading(false); return; }
    Promise.all([
      window.electron.database.getInfo().then(setDbInfo),
      window.electron.app.getAutoLaunch().then(setAutoLaunch).catch(() => {}),
    ]).finally(() => setIsLoading(false));
  }, []);

  const handleToggleAutoLaunch = async () => {
    if (!isElectron()) return;
    setIsTogglingAutoLaunch(true);
    try {
      const next = !autoLaunch;
      await window.electron.app.setAutoLaunch(next);
      setAutoLaunch(next);
    } finally {
      setIsTogglingAutoLaunch(false);
    }
  };

  const handleBackup = async () => {
    if (!isElectron()) return;
    setIsBackingUp(true);
    setBackupMsg("");
    try {
      const result = await window.electron.database.backup("");
      setBackupMsg(result.success ? `Backup saved to: ${result.path}` : "Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Database</p>
        </div>
        {dbInfo ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Location</span>
              <span className="font-mono text-foreground truncate max-w-xs text-right">{dbInfo.path}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Size</span>
              <span className="text-foreground">{(dbInfo.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Tables</span>
              <span className="text-foreground">{dbInfo.tables.length} tables</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Not available in browser mode</p>
        )}
      </div>

      {/* Auto-launch */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Launch on Windows Startup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically start Offline POS when Windows boots
            </p>
          </div>
          <button
            onClick={handleToggleAutoLaunch}
            disabled={isTogglingAutoLaunch || !isElectron()}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors disabled:opacity-50",
              autoLaunch ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              autoLaunch ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {backupMsg && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          backupMsg.includes("saved") ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"
        )}>
          {backupMsg}
        </div>
      )}

      <Button className="w-full max-w-xl gap-1.5" onClick={handleBackup} disabled={isBackingUp || !isElectron()}>
        {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
        {isBackingUp ? "Creating Backup…" : "Backup Database"}
      </Button>
    </div>
  );
}
