import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { generateDeviceApiKey } from "../src/lib/iot/auth";
import { processIoTWeightIngestion } from "../src/lib/iot/ingestion";

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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runB11_1Verification() {
  console.log("=== B11.1 Targeted IoT Security & Governance Verification Suite ===\n");

  const testDeviceCode = "BIN-B11-1-TEST";
  const { apiKey, apiKeyHash } = generateDeviceApiKey();

  // Provision test device
  await supabaseAdmin
    .from("iot_devices")
    .upsert({
      device_code: testDeviceCode,
      name: "B11.1 Security Test Bin",
      api_key_hash: apiKeyHash,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "device_code" });

  const { data: dev } = await supabaseAdmin
    .from("iot_devices")
    .select("id")
    .eq("device_code", testDeviceCode)
    .single();

  const testDeviceId = dev!.id;

  // ==========================================
  // 1. EXACT IDENTICAL DUPLICATE PAYLOAD TEST
  // ==========================================
  console.log("--- 1. Identical Duplicate Payload Test (Replay Behavior) ---");

  // Clean initial readings for this test device
  await supabaseAdmin.from("iot_weight_readings").delete().eq("device_id", testDeviceId);

  const duplicatePayload = {
    device_id: testDeviceCode,
    weight_kg: 0.850,
    timestamp: new Date().toISOString(),
  };
  const authHeader = `Bearer ${apiKey}`;

  // First request
  const firstRes = await processIoTWeightIngestion(supabaseAdmin, duplicatePayload, authHeader);
  assert(firstRes.status === 200, `First request returned HTTP 200 (received ${firstRes.status})`);

  const { count: countAfterFirst } = await supabaseAdmin
    .from("iot_weight_readings")
    .select("id", { count: "exact", head: true })
    .eq("device_id", testDeviceId);

  assert(countAfterFirst === 1, `Rows inserted after first request: ${countAfterFirst}`);

  // Second identical request
  const secondRes = await processIoTWeightIngestion(supabaseAdmin, duplicatePayload, authHeader);
  assert(secondRes.status === 200, `Second duplicate request returned HTTP 200 (received ${secondRes.status})`);

  const { count: countAfterSecond } = await supabaseAdmin
    .from("iot_weight_readings")
    .select("id", { count: "exact", head: true })
    .eq("device_id", testDeviceId);

  assert(countAfterSecond === 2, `Rows inserted after second duplicate request: ${countAfterSecond}`);
  console.log("   -> PROVEN: Replay protection is NOT implemented. Duplicate identical payload creates TWO distinct readings.");

  // ==========================================
  // 2. DEVICE ENUMERATION NORMALIZATION TEST
  // ==========================================
  console.log("\n--- 2. Device Enumeration Normalization Test ---");

  const wrongSecretRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: testDeviceCode, weight_kg: 1.0, timestamp: new Date().toISOString() },
    "Bearer mc_iot_wrong_secret_12345"
  );
  assert(wrongSecretRes.status === 401, `Wrong secret returned HTTP 401 (status: ${wrongSecretRes.status})`);
  assert(
    (wrongSecretRes.body as { error?: string }).error === "Invalid device credentials",
    `Wrong secret error body: "${(wrongSecretRes.body as { error?: string }).error}"`
  );

  const unknownDeviceRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: "BIN-COMPLETELY-NONEXISTENT", weight_kg: 1.0, timestamp: new Date().toISOString() },
    "Bearer mc_iot_some_secret_12345"
  );
  assert(unknownDeviceRes.status === 401, `Unknown device returned HTTP 401 (status: ${unknownDeviceRes.status})`);
  assert(
    (unknownDeviceRes.body as { error?: string }).error === "Invalid device credentials",
    `Unknown device error body: "${(unknownDeviceRes.body as { error?: string }).error}"`
  );

  assert(
    wrongSecretRes.status === unknownDeviceRes.status &&
      (wrongSecretRes.body as { error?: string }).error === (unknownDeviceRes.body as { error?: string }).error,
    "Device enumeration defense PROVEN: wrong-secret and unknown-device produce IDENTICAL HTTP 401 responses"
  );

  // ==========================================
  // 3. API KEY HASH DIRECT ACCESS ATTEMPT (POSTGREST RLS)
  // ==========================================
  console.log("\n--- 3. API Key Hash Column Direct Protection Check ---");

  const { data: anonAttempt, error: anonErr } = await supabaseAnon
    .from("iot_devices")
    .select("id, device_code, api_key_hash");

  assert(
    !anonAttempt || anonAttempt.length === 0 || Boolean(anonErr),
    "Anonymous PostgREST query cannot retrieve api_key_hash"
  );

  // Clean up test fixture
  await supabaseAdmin.from("iot_weight_readings").delete().eq("device_id", testDeviceId);
  await supabaseAdmin.from("iot_devices").delete().eq("id", testDeviceId);

  console.log("\n==========================================");
  console.log("✅ ALL B11.1 TARGETED VERIFICATIONS PASSED!");
  console.log("==========================================");
}

runB11_1Verification().catch((err) => {
  console.error("❌ B11.1 verification failed:", err);
  process.exit(1);
});
