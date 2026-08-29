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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runLiveIoTAcceptance() {
  console.log("=== B11 Live IoT Ingestion Acceptance Test Suite ===\n");

  const testDeviceCode = "BIN-001";
  const { apiKey, apiKeyHash } = generateDeviceApiKey();

  // 1. Provision / Ensure Test Device Exists in Database
  console.log("1. Provisioning Test Smart Bin Device fixture in remote DB...");
  const { data: existingDevice } = await supabaseAdmin
    .from("iot_devices")
    .select("id")
    .eq("device_code", testDeviceCode)
    .maybeSingle();

  let testDeviceId: string;
  if (existingDevice) {
    testDeviceId = existingDevice.id;
    await supabaseAdmin
      .from("iot_devices")
      .update({
        api_key_hash: apiKeyHash,
        is_active: true,
        name: "Main Research Bin Alpha",
        location: "Bio-Processing Lab Station 1",
      })
      .eq("id", testDeviceId);
    console.log(`   Updated existing device '${testDeviceCode}' with new verification key hash`);
  } else {
    const { data: newDev, error: devErr } = await supabaseAdmin
      .from("iot_devices")
      .insert({
        device_code: testDeviceCode,
        name: "Main Research Bin Alpha",
        location: "Bio-Processing Lab Station 1",
        api_key_hash: apiKeyHash,
        is_active: true,
      })
      .select("id")
      .single();

    if (devErr || !newDev) throw new Error(`Failed to create test device: ${devErr?.message}`);
    testDeviceId = newDev.id;
    console.log(`   Created test device '${testDeviceCode}' (${testDeviceId})`);
  }

  // 2. Scenario A: Real Valid Authenticated Telemetry Ingestion (0.735 kg)
  console.log("\n2. Scenario A: Valid Authenticated Ingestion (0.735 kg)...");
  const validTimestamp = new Date().toISOString();
  const validPayload = {
    device_id: testDeviceCode,
    weight_kg: 0.735,
    timestamp: validTimestamp,
  };
  const validAuthHeader = `Bearer ${apiKey}`;

  const validRes = await processIoTWeightIngestion(supabaseAdmin, validPayload, validAuthHeader);
  assert(validRes.status === 200, `Ingestion returned HTTP 200 (received ${validRes.status})`);

  const validBody = validRes.body as { success: boolean; reading_id: string; weight_kg: number; device_code: string };
  assert(validBody.success === true, "Response contains success: true");
  assert(Boolean(validBody.reading_id), `Reading ID returned: ${validBody.reading_id}`);
  assert(validBody.weight_kg === 0.735, "Returned weight_kg is 0.735");
  assert(validBody.device_code === testDeviceCode, `Device code matches '${testDeviceCode}'`);

  // Verify telemetry row actually exists in PostgreSQL
  const { data: dbReading, error: dbReadErr } = await supabaseAdmin
    .from("iot_weight_readings")
    .select("id, device_id, weight_kg, recorded_at")
    .eq("id", validBody.reading_id)
    .single();

  assert(Boolean(dbReading) && !dbReadErr, "Reading persisted successfully in remote PostgreSQL table");
  assert(Number(dbReading!.weight_kg) === 0.735, "Persisted weight_kg is strictly 0.735 kg");
  assert(dbReading!.device_id === testDeviceId, "Reading correctly bound to device foreign key");

  // 3. Scenario B: Invalid Device Secret (Wrong API Key)
  console.log("\n3. Scenario B: Invalid Device Secret Ingestion Attempt...");
  const initialReadingsCount = (await supabaseAdmin.from("iot_weight_readings").select("id", { count: "exact", head: true })).count || 0;

  const badAuthRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: testDeviceCode, weight_kg: 1.5, timestamp: new Date().toISOString() },
    "Bearer mc_iot_completely_invalid_secret_key_12345"
  );
  assert(badAuthRes.status === 401, `Invalid secret rejected with HTTP 401 (received ${badAuthRes.status})`);

  const afterBadAuthCount = (await supabaseAdmin.from("iot_weight_readings").select("id", { count: "exact", head: true })).count || 0;
  assert(afterBadAuthCount === initialReadingsCount, "Zero telemetry rows created after invalid secret attempt");

  // 4. Scenario C: Unknown Device Ingestion Attempt
  console.log("\n4. Scenario C: Unknown Device Ingestion Attempt...");
  const unknownDevRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: "BIN-UNKNOWN-999", weight_kg: 2.0, timestamp: new Date().toISOString() },
    validAuthHeader
  );
  assert(unknownDevRes.status === 404, `Unknown device rejected with HTTP 404 (received ${unknownDevRes.status})`);

  // 5. Scenario D: Disabled / Inactive Device Ingestion Attempt
  console.log("\n5. Scenario D: Disabled / Inactive Device Ingestion Attempt...");
  // Temporarily disable device
  await supabaseAdmin.from("iot_devices").update({ is_active: false }).eq("id", testDeviceId);

  const disabledDevRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: testDeviceCode, weight_kg: 3.2, timestamp: new Date().toISOString() },
    validAuthHeader
  );
  assert(disabledDevRes.status === 403, `Disabled device rejected with HTTP 403 (received ${disabledDevRes.status})`);

  // Re-enable device
  await supabaseAdmin.from("iot_devices").update({ is_active: true }).eq("id", testDeviceId);

  // 6. Scenario E: Malformed Payload Validation
  console.log("\n6. Scenario E: Malformed & Out-of-Bounds Payload Ingestion Attempts...");

  // Negative weight
  const negRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: testDeviceCode, weight_kg: -1.0, timestamp: new Date().toISOString() },
    validAuthHeader
  );
  assert(negRes.status === 400, "Negative weight rejected with HTTP 400");

  // Out-of-range timestamp (15 minutes in the past)
  const staleTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const staleRes = await processIoTWeightIngestion(
    supabaseAdmin,
    { device_id: testDeviceCode, weight_kg: 1.0, timestamp: staleTime },
    validAuthHeader
  );
  assert(staleRes.status === 400, "Stale timestamp (>5 min) rejected with HTTP 400");

  console.log("\n==========================================");
  console.log("✅ B11 LIVE IOT INGESTION ACCEPTANCE PASSED!");
  console.log("==========================================");
}

runLiveIoTAcceptance().catch((err) => {
  console.error("❌ Live acceptance test failed:", err);
  process.exit(1);
});
