import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import {
  generateDeviceApiKey,
  hashApiKey,
  verifyApiKey,
} from "../src/lib/iot/auth";
import { checkDeviceRateLimit } from "../src/lib/iot/rate-limiter";
import {
  iotWeightPayloadSchema,
  validateTimestampTolerance,
} from "../src/lib/validators/iot";

// Load .env.local safely
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runIoTIngestionTests() {
  console.log("=== B11 IoT Ingestion & Cryptographic Auth Test Suite ===\n");

  // ==========================================
  // 1. CRYPTOGRAPHIC KEY GENERATION & VERIFICATION
  // ==========================================
  console.log("--- 1. Cryptographic Key Hashing & Verification ---");
  const { apiKey, apiKeyHash } = generateDeviceApiKey();
  assert(apiKey.startsWith("mc_iot_"), "API key begins with 'mc_iot_' prefix");
  assert(apiKeyHash.length === 64, "API key hash is 64-char SHA-256 hex digest");
  assert(apiKey !== apiKeyHash, "Raw key is distinct from stored hash");

  const isSelfValid = verifyApiKey(apiKey, apiKeyHash);
  assert(isSelfValid === true, "Valid API key matches stored hash via constant-time comparison");

  const isTamperedInvalid = verifyApiKey(apiKey + "_tampered", apiKeyHash);
  assert(isTamperedInvalid === false, "Tampered API key correctly rejected");

  const isWrongKeyInvalid = verifyApiKey("mc_iot_wrong_key_1234567890abcdef", apiKeyHash);
  assert(isWrongKeyInvalid === false, "Wrong API key correctly rejected");

  // ==========================================
  // 2. PAYLOAD SCHEMA VALIDATION (ZOD)
  // ==========================================
  console.log("\n--- 2. Ingestion Payload Schema Validation ---");

  // Valid payload
  const validPayload = {
    device_id: "BIN-001",
    weight_kg: 0.735,
    timestamp: new Date().toISOString(),
  };
  const validRes = iotWeightPayloadSchema.safeParse(validPayload);
  assert(validRes.success === true, "Valid payload passes schema validation");

  // Negative weight rejected
  const negPayload = { device_id: "BIN-001", weight_kg: -5.0, timestamp: new Date().toISOString() };
  assert(iotWeightPayloadSchema.safeParse(negPayload).success === false, "Negative weight rejected");

  // Exceeds 1000 kg capacity rejected
  const overPayload = { device_id: "BIN-001", weight_kg: 1050, timestamp: new Date().toISOString() };
  assert(iotWeightPayloadSchema.safeParse(overPayload).success === false, "Weight exceeding 1000 kg capacity rejected");

  // Non-number weight rejected
  const strWeightPayload = { device_id: "BIN-001", weight_kg: "not-a-number", timestamp: new Date().toISOString() };
  assert(iotWeightPayloadSchema.safeParse(strWeightPayload).success === false, "String weight rejected");

  // Invalid timestamp format rejected
  const badTimePayload = { device_id: "BIN-001", weight_kg: 12.5, timestamp: "2026-08-29 14:00" };
  assert(iotWeightPayloadSchema.safeParse(badTimePayload).success === false, "Non-ISO timestamp format rejected");

  // ==========================================
  // 3. TIMESTAMP TOLERANCE WINDOW (±5 MIN)
  // ==========================================
  console.log("\n--- 3. Timestamp Tolerance Window Check ---");

  const nowIso = new Date().toISOString();
  assert(validateTimestampTolerance(nowIso, 5).valid === true, "Current timestamp is within ±5 min tolerance");

  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  assert(validateTimestampTolerance(twoMinAgo, 5).valid === true, "2-minute-old timestamp is within ±5 min tolerance");

  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  assert(validateTimestampTolerance(tenMinAgo, 5).valid === false, "10-minute-old timestamp is rejected (outside tolerance)");

  const futureTenMin = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  assert(validateTimestampTolerance(futureTenMin, 5).valid === false, "Future timestamp (+10 min) is rejected (outside tolerance)");

  // ==========================================
  // 4. RATE LIMITER (60 REQ/MIN/DEVICE)
  // ==========================================
  console.log("\n--- 4. Device Rate Limiter Check ---");

  const testDevice = `TEST-BIN-${Date.now()}`;
  for (let i = 1; i <= 60; i++) {
    const rl = checkDeviceRateLimit(testDevice);
    assert(rl.allowed === true, `Request #${i} allowed within window`);
  }

  const overflowReq = checkDeviceRateLimit(testDevice);
  assert(overflowReq.allowed === false, "Request #61 rejected with 429 rate limit");
  assert(Number(overflowReq.retryAfterSeconds) > 0, "Rate limiter returns positive retryAfterSeconds");

  console.log("\n==========================================");
  console.log("✅ ALL IOT INGESTION & CRYPTO TESTS PASSED!");
  console.log("==========================================");
}

runIoTIngestionTests().catch((err) => {
  console.error("❌ IoT test failed:", err);
  process.exit(1);
});
