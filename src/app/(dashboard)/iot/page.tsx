"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SmartBinCard } from "@/components/iot/SmartBinCard";
import { SmartBinReadingHistory } from "@/components/iot/SmartBinReadingHistory";
import { SmartBinSimulatorModal } from "@/components/iot/SmartBinSimulatorModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { iotService } from "@/data/services";
import { IoTDevice, IoTReading } from "@/data/contracts/iot";

export default function IoTOverviewPage() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [readings, setReadings] = useState<IoTReading[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [selectedDeviceForSim, setSelectedDeviceForSim] = useState<IoTDevice | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devList, readList] = await Promise.all([
        iotService.getIoTDevices(),
        iotService.getIoTReadings({ limit: 10 }),
      ]);
      setDevices(devList);
      setReadings(readList);
    } catch {
      // non-blocking
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCount = devices.filter((d) => d.status === "active" || d.status === "idle").length;
  const offlineCount = devices.filter((d) => d.status === "offline" || d.status === "inactive").length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <PageHeader
        title="IoT Smart Bins"
        description="Hardware-assisted weight measurement stations with load cells and ESP32 microcontrollers. IoT is an optional, non-blocking telemetry enhancement."
        breadcrumbs={[{ label: "IoT Devices" }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedDeviceForSim(null);
              setIsSimulatorOpen(true);
            }}
            leftIcon={<Sparkles className="w-4 h-4 text-purple-200" />}
          >
            Simulate ESP32 Reading
          </Button>
        }
      />

      {/* 2. Hardware Architecture Infographic Strip */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-text-primary">
                Smart Bin Physical & Ingestion Pipeline
              </h2>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
              Prototype Demonstration Feed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">1. Waste Intake</span>
              <span className="text-text-secondary">Load Cell Basin</span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">2. HX711 ADC</span>
              <span className="text-text-secondary">24-Bit Amplifier</span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">3. ESP32</span>
              <span className="text-text-secondary">Median Filter</span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">4. HTTPS / Wi-Fi</span>
              <span className="text-text-secondary">TLS 1.2+ POST</span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">5. Ingestion API</span>
              <span className="text-text-secondary">Key Hash & Zod</span>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-border space-y-0.5">
              <span className="font-bold text-text-primary block">6. Platform UI</span>
              <span className="text-text-secondary">Optional Link</span>
            </div>
          </div>

          <p className="text-[10px] text-text-secondary">
            <strong>Non-Negotiable Architecture:</strong> If the ESP32, Wi-Fi, or load cell sensor fails, manual weight entry in Waste Batch Creation remains 100% operational.
          </p>
        </CardContent>
      </Card>

      {/* 3. Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">
            Configured Stations
          </span>
          <p className="font-mono font-extrabold text-xl text-text-primary">
            {devices.length}
          </p>
          <span className="text-[10px] text-text-secondary block">Registered Smart Bins</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">
            Active Stations
          </span>
          <p className="font-mono font-extrabold text-xl text-emerald-600">
            {activeCount}
          </p>
          <span className="text-[10px] text-text-secondary block">Transmitting telemetry</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">
            Offline Stations
          </span>
          <p className="font-mono font-extrabold text-xl text-text-secondary">
            {offlineCount}
          </p>
          <span className="text-[10px] text-text-secondary block">Standby / Unreachable</span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
          <span className="text-[10px] uppercase font-bold text-primary block">
            Recent Telemetry
          </span>
          <p className="font-mono font-extrabold text-xl text-primary">
            {readings.length}
          </p>
          <span className="text-[10px] text-text-secondary block">Recorded weight samples</span>
        </div>
      </div>

      {/* 4. Registered Devices Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-text-primary">Registered Smart Bin Stations</h2>
            <p className="text-xs text-text-secondary">
              Simulated monitoring and prototype management of load cell stations
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingState message="Loading Smart Bin stations..." />
          </div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-xs text-text-secondary">
              No Smart Bin devices registered. Manual weight entry is active across the platform.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <SmartBinCard
                key={device.id}
                device={device}
                onSimulateReading={(dev) => {
                  setSelectedDeviceForSim(dev);
                  setIsSimulatorOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Global Recent Readings Feed */}
      <SmartBinReadingHistory
        readings={readings}
        title="Recorded Simulated Reading Telemetry Feed"
      />

      {/* 6. Simulator Modal */}
      <SmartBinSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        devices={devices}
        selectedDevice={selectedDeviceForSim}
        onReadingSimulated={loadData}
      />
    </div>
  );
}
