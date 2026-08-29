import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Computes a SHA-256 hash of the device API key.
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey.trim()).digest("hex");
}

/**
 * Generates a cryptographically secure device API key and its SHA-256 hash.
 * Plaintext key is displayed/returned ONCE during provisioning and NEVER persisted in DB.
 */
export function generateDeviceApiKey(): { apiKey: string; apiKeyHash: string } {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const apiKey = `mc_iot_${randomBytes}`;
  const apiKeyHash = hashApiKey(apiKey);
  return { apiKey, apiKeyHash };
}

/**
 * Performs constant-time comparison of supplied key hash with stored hash.
 */
export function verifyApiKey(suppliedKey: string, storedHash: string): boolean {
  if (!suppliedKey || !storedHash) return false;
  const suppliedHash = hashApiKey(suppliedKey);
  const suppliedBuf = Buffer.from(suppliedHash, "hex");
  const storedBuf = Buffer.from(storedHash, "hex");

  if (suppliedBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(suppliedBuf, storedBuf);
}

export interface AuthenticatedDevice {
  id: string;
  deviceCode: string;
  name: string | null;
  location: string | null;
  isActive: boolean;
}

export interface DeviceAuthResult {
  authenticated: boolean;
  statusCode: number;
  errorMessage?: string;
  device?: AuthenticatedDevice;
}

/**
 * Authenticates an IoT device request via Bearer token and device code.
 * Defends against device enumeration by normalizing unknown-device and wrong-secret to HTTP 401.
 */
export async function authenticateDeviceRequest(
  supabase: SupabaseClient,
  deviceCode: string,
  authHeader: string | null
): Promise<DeviceAuthResult> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: "Missing or invalid Authorization header. Expected 'Bearer <key>'",
    };
  }

  const suppliedKey = authHeader.substring(7).trim();
  if (!suppliedKey) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: "Invalid device credentials",
    };
  }

  const { data: device, error } = await supabase
    .from("iot_devices")
    .select("id, device_code, name, location, api_key_hash, is_active")
    .eq("device_code", deviceCode.trim())
    .maybeSingle();

  if (error) {
    return {
      authenticated: false,
      statusCode: 500,
      errorMessage: "Database lookup error during device authentication",
    };
  }

  // Defend against device enumeration: unknown device returns same 401 as invalid credentials
  if (!device) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: "Invalid device credentials",
    };
  }

  if (!device.is_active) {
    return {
      authenticated: false,
      statusCode: 403,
      errorMessage: "Device is disabled / inactive",
    };
  }

  const isKeyValid = verifyApiKey(suppliedKey, device.api_key_hash);
  if (!isKeyValid) {
    return {
      authenticated: false,
      statusCode: 401,
      errorMessage: "Invalid device credentials",
    };
  }

  return {
    authenticated: true,
    statusCode: 200,
    device: {
      id: device.id,
      deviceCode: device.device_code,
      name: device.name,
      location: device.location,
      isActive: device.is_active,
    },
  };
}
