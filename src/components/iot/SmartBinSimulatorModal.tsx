"use client";

import React, { useState } from "react";
import { Sparkles, Radio, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IoTDevice } from "@/data/contracts/iot";
import { iotService } from "@/data/services";
import { simulateReadingSchema } from "@/lib/validators/iot";

interface SmartBinSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: IoTDevice[];
  selectedDevice?: IoTDevice | null;
  onReadingSimulated: () => void;
}

export const SmartBinSimulatorModal: React.FC<SmartBinSimulatorModalProps> = ({
  isOpen,
  onClose,
  devices,
  selectedDevice,
  onReadingSimulated,
}) => {
  const [deviceId, setDeviceId] = useState<string>(
    selectedDevice?.id || devices[0]?.id || ""
  );
  const [weightKg, setWeightKg] = useState<string>("0.735");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreset = (weight: number) => {
    setWeightKg(weight.toFixed(3));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numWeight = parseFloat(weightKg);
    const validation = simulateReadingSchema.safeParse({
      deviceId: deviceId || selectedDevice?.id,
      weightKg: numWeight,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid reading weight.");
      return;
    }

    setIsSubmitting(true);
    try {
      await iotService.simulateIoTReading({
        deviceId: deviceId || selectedDevice!.id,
        weightKg: numWeight,
      });
      onReadingSimulated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to simulate reading."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Simulate Smart Bin Reading
              </h2>
              <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                Prototype Hardware Simulator
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-[11px] text-text-secondary leading-relaxed">
            <strong className="text-text-primary block mb-0.5">Prototype Demonstration Tool:</strong>
            Simulate a load cell weight transmission from an ESP32 device into shared platform state without physical hardware.
          </div>

          {/* Device Selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-text-primary">
              Target Smart Bin Station
            </label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text-primary font-mono text-xs focus:outline-none focus:border-primary"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deviceCode} — {d.name} ({d.location})
                </option>
              ))}
            </select>
          </div>

          {/* Weight Field */}
          <div className="space-y-1">
            <label className="block font-semibold text-text-primary">
              Simulated Weight (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0"
                max="1000"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full ps-3 pe-10 py-2 rounded-lg border border-border bg-background text-text-primary font-mono text-xs focus:outline-none focus:border-primary"
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 font-mono text-xs text-text-secondary">
                kg
              </span>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-text-secondary font-semibold uppercase block">
              Quick Test Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(0.0)}
                className="p-2 rounded-lg border border-border hover:bg-surface-secondary text-center text-[11px] font-mono transition-colors"
              >
                0.000 kg
                <span className="block text-[9px] text-text-secondary font-sans">Empty Bin</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset(0.735)}
                className="p-2 rounded-lg border border-border hover:bg-surface-secondary text-center text-[11px] font-mono transition-colors"
              >
                0.735 kg
                <span className="block text-[9px] text-text-secondary font-sans">Sample Batch</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreset(4.5)}
                className="p-2 rounded-lg border border-border hover:bg-surface-secondary text-center text-[11px] font-mono transition-colors"
              >
                4.500 kg
                <span className="block text-[9px] text-text-secondary font-sans">Full Bin</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Radio className="w-3.5 h-3.5" />}
            >
              Transmit Reading
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
