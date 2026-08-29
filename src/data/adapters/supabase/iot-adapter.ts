import {
  IoTDevice,
  IoTReading,
  IoTReadingFilter,
  SimulateReadingInput,
  IoTWeightPoint,
} from "@/data/contracts/iot";
import { apiRequest } from "./http";

export const supabaseIoTAdapter = {
  async getIoTDevices(): Promise<IoTDevice[]> {
    return apiRequest<IoTDevice[]>("/api/iot/devices");
  },

  async getIoTDeviceById(idOrCode: string): Promise<IoTDevice | null> {
    const devices = await this.getIoTDevices();
    return (
      devices.find((d) => d.id === idOrCode || d.deviceCode.toLowerCase() === idOrCode.toLowerCase()) || null
    );
  },

  async getIoTReadings(filter?: IoTReadingFilter): Promise<IoTReading[]> {
    const params = new URLSearchParams();
    if (filter?.deviceId) params.set("deviceId", filter.deviceId);
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.startDate) params.set("startDate", filter.startDate);
    if (filter?.endDate) params.set("endDate", filter.endDate);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<IoTReading[]>(`/api/iot/readings${queryString}`);
  },

  async getLatestReadingForDevice(deviceIdOrCode: string): Promise<IoTReading | null> {
    const device = await this.getIoTDeviceById(deviceIdOrCode);
    if (!device) return null;

    const readings = await this.getIoTReadings({ deviceId: device.id, limit: 1 });
    return readings[0] || null;
  },

  async getIoTWeightTrend(deviceIdOrCode?: string): Promise<IoTWeightPoint[]> {
    let deviceId: string | undefined;
    if (deviceIdOrCode) {
      const device = await this.getIoTDeviceById(deviceIdOrCode);
      deviceId = device?.id || deviceIdOrCode;
    }

    const readings = await this.getIoTReadings({
      deviceId,
      limit: 20,
    });

    return readings
      .map((r) => ({
        timestamp: r.recordedAt,
        weightKg: r.weightKg,
        deviceCode: r.deviceCode,
      }))
      .reverse();
  },

  async simulateIoTReading(input: SimulateReadingInput): Promise<IoTReading> {
    const device = await this.getIoTDeviceById(input.deviceId);
    const deviceCode = device?.deviceCode || "SIM-BIN-001";
    const now = input.recordedAt || new Date().toISOString();

    return {
      id: `sim-${Date.now()}`,
      deviceId: input.deviceId,
      deviceCode,
      weightKg: input.weightKg,
      recordedAt: now,
      source: "simulated",
      createdAt: now,
      updatedAt: now,
    };
  },
};
