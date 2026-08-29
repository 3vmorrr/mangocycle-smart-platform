"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SmartBinWeightChart } from "@/components/iot/SmartBinWeightChart";
import { SmartBinReadingHistory } from "@/components/iot/SmartBinReadingHistory";
import { SmartBinSimulatorModal } from "@/components/iot/SmartBinSimulatorModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { iotService } from "@/data/services";
import { IoTDevice, IoTReading, IoTWeightPoint } from "@/data/contracts/iot";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

export default function SmartBinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [device, setDevice] = useState<IoTDevice | null>(null);
  const [readings, setReadings] = useState<IoTReading[]>([]);
  const [trendData, setTrendData] = useState<IoTWeightPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const loadDeviceData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const dev = await iotService.getIoTDeviceById(id);
      if (!dev) {
        setError(`Smart Bin device "${id}" was not found.`);
        return;
      }
      setDevice(dev);

      const [readList, trend] = await Promise.all([
        iotService.getIoTReadings({ deviceId: dev.id }),
        iotService.getIoTWeightTrend(dev.id),
      ]);
      setReadings(readList);
      setTrendData(trend);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Smart Bin details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDeviceData();
  }, [loadDeviceData]);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading Smart Bin device telemetry..." />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="py-12">
        <ErrorState
          title="Smart Bin Not Found"
          message={error || "The requested IoT device does not exist."}
          onRetry={() => router.push("/iot")}
        />
      </div>
    );
  }

  const latestReadingKg = device.latestReadingKg ?? (readings[0]?.weightKg ?? 0);
  const latestReadingDate = device.latestReadingAt || (readings[0]?.recordedAt ?? device.lastSeenAt);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <PageHeader
        title={`${device.deviceCode} — ${device.name || "Smart Bin Station"}`}
        description="Simulated load cell sensor telemetry, recorded weight readings, and prototype communication status."
        breadcrumbs={[
          { label: "IoT Devices", href: "/iot" },
          { label: device.deviceCode },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/iot">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Back to IoT Devices
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSimulatorOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4 text-purple-200" />}
            >
              Simulate Reading
            </Button>
          </div>
        }
      />

      {/* 2. Status & Hardware Specifications Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Current Simulated Reading */}
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Current Simulated Reading
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold">
                Simulated Telemetry
              </span>
            </div>

            <div className="font-mono">
              <p className="text-3xl font-black text-primary">
                {formatWeightKg(latestReadingKg, "en-US", 3)}
              </p>
              <span className="text-[10px] text-text-secondary flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                <span>Last reading: {latestReadingDate ? formatDate(latestReadingDate, "en-US", { hour: "numeric", minute: "numeric", second: "numeric" }) : "No readings recorded"}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card B: Device Identity & Location */}
        <Card>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Device Location & Code
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  device.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-surface-secondary text-text-secondary border-border"
                }`}
              >
                {device.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span className="capitalize">{device.status}</span>
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <p className="font-semibold text-text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{device.location || "Unassigned Location"}</span>
              </p>
              <p className="text-[11px] text-text-secondary font-mono">
                Code: <strong>{device.deviceCode}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card C: Hardware Pipeline Specification */}
        <Card>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Hardware Protocol
              </span>
              <Cpu className="w-3.5 h-3.5 text-primary" />
            </div>

            <div className="space-y-1 text-[11px] text-text-secondary font-mono pt-1">
              <p>Sensor: <strong>Load Cell Strain Gauge</strong></p>
              <p>ADC: <strong>HX711 (24-bit)</strong></p>
              <p>Ingestion: <strong>HTTPS POST /api/iot/weight</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Weight Telemetry Chart */}
      <SmartBinWeightChart
        data={trendData}
        title={`Weight Telemetry History — ${device.deviceCode}`}
      />

      {/* 4. Device Reading History Table */}
      <SmartBinReadingHistory
        readings={readings}
        title={`Recorded Reading Log — ${device.deviceCode}`}
      />

      {/* 5. Simulator Modal */}
      <SmartBinSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        devices={[device]}
        selectedDevice={device}
        onReadingSimulated={loadDeviceData}
      />
    </div>
  );
}
