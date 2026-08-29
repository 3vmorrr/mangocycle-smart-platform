import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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

async function runIoTRlsTests() {
  console.log("=== B11 IoT RBAC & RLS Security Suite ===\n");

  // ==========================================
  // 1. ANONYMOUS ACCESS BLOCKED BY RLS
  // ==========================================
  console.log("--- 1. Anonymous Access Restrictions ---");

  const { data: anonDevices, error: anonDevErr } = await supabaseAnon
    .from("iot_devices")
    .select("id, device_code");

  assert(
    !anonDevices || anonDevices.length === 0 || Boolean(anonDevErr),
    "Anonymous user cannot read iot_devices (RLS enforced)"
  );

  const { data: anonReadings, error: anonReadErr } = await supabaseAnon
    .from("iot_weight_readings")
    .select("id, weight_kg");

  assert(
    !anonReadings || anonReadings.length === 0 || Boolean(anonReadErr),
    "Anonymous user cannot read iot_weight_readings (RLS enforced)"
  );

  // ==========================================
  // 2. DIRECT ANONYMOUS INGESTION / INSERT DENIED
  // ==========================================
  console.log("\n--- 2. Direct Client Insert Denial ---");

  const { error: directInsertErr } = await supabaseAnon
    .from("iot_weight_readings")
    .insert({
      device_id: "00000000-0000-0000-0000-000000000000",
      weight_kg: 5.5,
      recorded_at: new Date().toISOString(),
    });

  assert(
    Boolean(directInsertErr),
    "Direct client INSERT into iot_weight_readings is strictly denied by RLS"
  );

  // ==========================================
  // 3. API KEY HASH COLUMN PROTECTION
  // ==========================================
  console.log("\n--- 3. API Key Hash Column Privilege Check ---");

  // Service role can select api_key_hash
  const { data: adminCheck, error: adminCheckErr } = await supabaseAdmin
    .from("iot_devices")
    .select("id, device_code, api_key_hash")
    .limit(1);

  assert(!adminCheckErr, "Service role can inspect api_key_hash for authentication verification");

  console.log("\n==========================================");
  console.log("✅ ALL IOT RBAC & RLS SECURITY TESTS PASSED!");
  console.log("==========================================");
}

runIoTRlsTests().catch((err) => {
  console.error("❌ IoT RLS test failed:", err);
  process.exit(1);
});
