import { BaseEntity } from "./types";

export type IoTDeviceStatus = "active" | "idle" | "offline" | "inactive";

export interface IoTDevice extends BaseEntity {
  deviceCode: string;
  name: string | null;
  location: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  latestReadingKg?: number | null;
  latestReadingAt?: string | null;
  status: IoTDeviceStatus;
}

export interface IoTReading extends BaseEntity {
  deviceId: string;
  deviceCode: string;
  weightKg: number;
  recordedAt: string;
  source: "simulated" | "hardware_prototype";
}

export interface IoTReadingFilter {
  deviceId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface SimulateReadingInput {
  deviceId: string;
  weightKg: number;
  recordedAt?: string;
}

export interface IoTWeightPoint {
  timestamp: string;
  weightKg: number;
  deviceCode: string;
}
