import React from "react";
import Link from "next/link";
import { Radio, MapPin, Clock, ArrowRight, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IoTDevice } from "@/data/contracts/iot";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface SmartBinCardProps {
  device: IoTDevice;
  onSimulateReading?: (device: IoTDevice) => void;
}

export const SmartBinCard: React.FC<SmartBinCardProps> = ({
  device,
  onSimulateReading,
}) => {
  const isOnline = device.status === "active" || device.status === "idle";

  return (
    <Card className="hover:border-primary/50 transition-all flex flex-col justify-between group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isOnline ? "bg-primary/10 text-primary" : "bg-surface-secondary text-text-secondary"
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-text-primary">
                  {device.deviceCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    device.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : device.status === "idle"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-surface-secondary text-text-secondary border-border"
                  }`}
                >
                  {device.status === "active" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span className="capitalize">{device.status}</span>
                </span>
              </div>
              <CardTitle className="text-sm pt-1 text-text-primary group-hover:text-primary transition-colors">
                {device.name || "Smart Bin Station"}
              </CardTitle>
            </div>
          </div>
        </div>

        {device.location && (
          <p className="text-[11px] text-text-secondary flex items-center gap-1 pt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{device.location}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Latest Weight Reading Display */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-text-secondary block">
              Simulated Reading
            </span>
            <span className="text-[10px] text-text-secondary flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              <span>{device.latestReadingAt ? formatDate(device.latestReadingAt, "en-US", { hour: "numeric", minute: "numeric" }) : "No readings"}</span>
            </span>
          </div>

          <div className="text-end font-mono">
            <span className="text-lg font-extrabold text-primary block">
              {device.latestReadingKg !== null && device.latestReadingKg !== undefined
                ? formatWeightKg(device.latestReadingKg, "en-US", 3)
                : "0.000 kg"}
            </span>
            <span className="text-[9px] text-text-secondary">
              Load Cell Mass
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          {onSimulateReading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSimulateReading(device)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
              className="text-[11px]"
            >
              Simulate Reading
            </Button>
          )}

          <Link href={`/iot/${device.id}`} className="ms-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-[11px] text-primary"
            >
              Details & History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
