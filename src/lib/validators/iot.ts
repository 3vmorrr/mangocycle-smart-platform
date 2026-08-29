import { z } from "zod";

/**
 * Ingestion Payload Schema per 24-API-SPECIFICATION.md §9.1
 */
export const iotWeightPayloadSchema = z.object({
  device_id: z.string().min(1).max(50),
  weight_kg: z
    .number({ invalid_type_error: "weight_kg must be a valid number" })
    .min(0, "Weight must be non-negative (>= 0 kg)")
    .max(1000, "Weight cannot exceed 1000 kg capacity")
    .refine((val) => !isNaN(val) && isFinite(val), "weight_kg must be a finite number"),
  timestamp: z
    .string({ invalid_type_error: "timestamp must be a valid ISO 8601 string" })
    .datetime({ message: "timestamp must be a valid ISO 8601 datetime format (e.g. 2026-01-15T14:30:00Z)" }),
});

export type IoTWeightPayload = z.infer<typeof iotWeightPayloadSchema>;

/**
 * Validates timestamp tolerance within ±5 minutes of server time.
 * Per 24-API-SPECIFICATION.md §9.1 step 6 & 22-IOT-ARCHITECTURE.md §5.
 */
export function validateTimestampTolerance(
  timestampIso: string,
  toleranceMinutes: number = 5
): { valid: boolean; reason?: string } {
  const measurementTime = new Date(timestampIso).getTime();
  const serverTime = Date.now();
  const diffMinutes = Math.abs(serverTime - measurementTime) / (60 * 1000);

  if (diffMinutes > toleranceMinutes) {
    return {
      valid: false,
      reason: `Timestamp delta (${diffMinutes.toFixed(1)} min) exceeds allowable tolerance of ±${toleranceMinutes} minutes`,
    };
  }

  return { valid: true };
}

/**
 * Schema for device provisioning by Admin
 */
export const provisionDeviceSchema = z.object({
  device_code: z
    .string()
    .min(3, "Device code must be at least 3 characters")
    .max(50, "Device code must be at most 50 characters")
    .regex(/^[A-Z0-9_-]+$/, "Device code must contain only uppercase alphanumeric characters, dashes, or underscores"),
  name: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(100).optional(),
});

/**
 * Schema for UI simulator modal
 */
export const simulateReadingSchema = z.object({
  deviceId: z.string().min(1, "Device is required"),
  weightKg: z
    .number({ invalid_type_error: "Weight must be a number" })
    .min(0.001, "Weight must be greater than 0")
    .max(1000, "Weight exceeds capacity (1000 kg)"),
  recordedAt: z.string().optional(),
});
