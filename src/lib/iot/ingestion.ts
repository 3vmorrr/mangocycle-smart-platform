import { SupabaseClient } from "@supabase/supabase-js";
import { authenticateDeviceRequest } from "./auth";
import { checkDeviceRateLimit } from "./rate-limiter";
import { iotWeightPayloadSchema, validateTimestampTolerance } from "../validators/iot";

export interface IoTIngestionResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Core business logic for IoT weight ingestion.
 */
export async function processIoTWeightIngestion(
  supabase: SupabaseClient,
  rawBody: unknown,
  authHeader: string | null
): Promise<IoTIngestionResult> {
  // 1. Validate payload schema with Zod
  const parsed = iotWeightPayloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: "Invalid payload format", details: parsed.error.format() },
    };
  }

  const { device_id, weight_kg, timestamp } = parsed.data;

  // 2. Check rate limit for this device (60 req/min/device)
  const rateLimit = checkDeviceRateLimit(device_id);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: {
        error: "Rate limit exceeded. Maximum 60 requests per minute.",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds || 60),
      },
    };
  }

  // 3. Authenticate device credentials (Header: Authorization: Bearer <key>)
  const authResult = await authenticateDeviceRequest(supabase, device_id, authHeader);

  if (!authResult.authenticated || !authResult.device) {
    return {
      status: authResult.statusCode,
      body: { error: authResult.errorMessage || "Device authentication failed" },
    };
  }

  // 4. Validate timestamp tolerance (±5 minutes of server time)
  const timestampCheck = validateTimestampTolerance(timestamp, 5);
  if (!timestampCheck.valid) {
    return {
      status: 400,
      body: { error: `Invalid measurement timestamp: ${timestampCheck.reason}` },
    };
  }

  const device = authResult.device;
  const receivedAt = new Date().toISOString();

  // 5. Insert verified telemetry reading
  const { data: reading, error: insertErr } = await supabase
    .from("iot_weight_readings")
    .insert({
      device_id: device.id,
      weight_kg,
      recorded_at: timestamp,
    })
    .select("id")
    .single();

  if (insertErr || !reading) {
    console.error("Failed to insert IoT reading:", insertErr);
    return {
      status: 500,
      body: { error: "Failed to persist sensor reading" },
    };
  }

  // 6. Update device last_seen_at
  await supabase
    .from("iot_devices")
    .update({ last_seen_at: receivedAt, updated_at: receivedAt })
    .eq("id", device.id);

  // 7. Return canonical success response
  return {
    status: 200,
    body: {
      success: true,
      reading_id: reading.id,
      device_code: device.deviceCode,
      weight_kg,
      recorded_at: timestamp,
      received_at: receivedAt,
    },
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  };
}
