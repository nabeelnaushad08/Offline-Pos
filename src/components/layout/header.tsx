"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { isElectron, formatDate } from "@/lib/utils";
import { appClient } from "@/lib/ipc-client";

export function Header() {
  const { appVersion, platform, setSystemInfo } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (isElectron() && !appVersion) {
      Promise.all([
        appClient.getVersion(),
        appClient.getPlatform(),
        appClient.getDataPath(),
      ])
        .then(([version, plat, dataPath]) => {
          setSystemInfo({ appVersion: version, platform: plat, dataPath });
        })
        .catch(console.error);
    }
  }, [appVersion, setSystemInfo]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground">
          {formatDate(currentTime)}
        </h1>
        <span className="text-xs text-muted-foreground font-mono">
          {currentTime.toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Offline indicator */}
        <Badge variant="outline" className="gap-1.5 text-xs font-normal border-success/30 text-success">
          <WifiOff className="h-3 w-3" />
          Offline Mode
        </Badge>

        {/* System info */}
        {isElectron() && (
          <Badge variant="outline" className="gap-1.5 text-xs font-normal">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {platform ?? "…"} · v{appVersion ?? "…"}
            </span>
          </Badge>
        )}
      </div>
    </header>
  );
}
