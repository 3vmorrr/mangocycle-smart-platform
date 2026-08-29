import React from "react";
import Link from "next/link";
import { Radio, ArrowRight, Wifi } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { SmartBinDeviceSummary } from "@/data/contracts/dashboard";
import { formatWeightKg } from "@/lib/utils/formatters";

interface SmartBinSummaryCardProps {
  devices: SmartBinDeviceSummary[];
}

export const SmartBinSummaryCard: React.FC<SmartBinSummaryCardProps> = ({ devices }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Smart Bins (IoT Telemetry)</CardTitle>
          </div>
          <CardDescription>
            Optional ESP32-based load cell sensor stations (P4 Non-blocking module).
          </CardDescription>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Hardware Optional
        </span>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {devices.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No IoT devices currently configured. Manual weight entry is active.
          </div>
        ) : (
          devices.map((bin) => (
            <div
              key={bin.deviceId}
              className="p-3 rounded-lg border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-text-primary">
                    {bin.deviceId}
                  </span>
                  <span className="font-medium text-text-primary">{bin.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <Wifi className="w-3 h-3" />
                    <span>{bin.status}</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Location: {bin.location}
                </p>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-center shrink-0">
                <div className="text-end font-mono">
                  <span className="text-xs font-bold text-text-primary">
                    {formatWeightKg(bin.currentWeightKg, "en-US", 3)}
                  </span>
                  <span className="text-[10px] text-text-secondary block">
                    {bin.status === "offline" ? "Offline" : "Current Reading"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="pt-2 flex justify-end">
          <Link
            href="/iot"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <span>Manage IoT Devices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
