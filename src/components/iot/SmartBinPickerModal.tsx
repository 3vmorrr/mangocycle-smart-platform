"use client";

import React, { useState, useEffect } from "react";
import { Radio, X, Check, Clock, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IoTDevice } from "@/data/contracts/iot";
import { iotService } from "@/data/services";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface SmartBinPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWeight: (weightKg: number, deviceCode: string, timestamp: string) => void;
}

export const SmartBinPickerModal: React.FC<SmartBinPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectWeight,
}) => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    async function loadDevices() {
      setIsLoading(true);
      try {
        const data = await iotService.getIoTDevices();
        setDevices(data);
      } catch {
        // non-blocking
      } finally {
        setIsLoading(false);
      }
    }
    loadDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Select from Smart Bin Station
              </h2>
              <span className="font-mono text-[10px] text-text-secondary">
                Optional IoT Load Cell Telemetry
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          <div className="p-3 rounded-xl border border-border bg-surface-secondary/30 text-[11px] text-text-secondary">
            Select a Smart Bin to pre-fill the intake weight with its latest recorded sensor reading. You can always manually edit the weight value after applying.
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-text-secondary">
              Loading Smart Bin stations...
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-text-secondary space-y-2">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
              <p>No Smart Bin devices configured.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((device) => {
                const readingKg = device.latestReadingKg ?? 0;
                const readingDate = device.latestReadingAt || device.lastSeenAt || "";
                const isUsable = device.status !== "offline" && readingKg > 0;

                return (
                  <div
                    key={device.id}
                    className="p-3.5 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-text-primary">
                          {device.deviceCode}
                        </span>
                        <span className="font-medium text-text-primary">
                          {device.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                            device.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-surface-secondary text-text-secondary border-border"
                          }`}
                        >
                          {device.status}
                        </span>
                      </div>

                      {device.location && (
                        <p className="text-[11px] text-text-secondary flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{device.location}</span>
                        </p>
                      )}

                      {readingDate && (
                        <p className="text-[10px] text-text-secondary flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Reading time: {formatDate(readingDate, "en-US", { hour: "numeric", minute: "numeric" })}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <div className="text-end font-mono">
                        <span className="text-base font-extrabold text-primary block">
                          {formatWeightKg(readingKg, "en-US", 3)}
                        </span>
                        <span className="text-[9px] text-text-secondary">
                          Latest Reading
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant={isUsable ? "primary" : "outline"}
                        size="sm"
                        disabled={readingKg <= 0}
                        onClick={() => {
                          onSelectWeight(readingKg, device.deviceCode, readingDate);
                          onClose();
                        }}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="text-[11px]"
                      >
                        {readingKg > 0 ? "Apply Weight" : "Zero / Empty"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-surface-secondary/20 flex items-center justify-between text-[11px] text-text-secondary">
          <span>Manual weight entry remains available at all times.</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
