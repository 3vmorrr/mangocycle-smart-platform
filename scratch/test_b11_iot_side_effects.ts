import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { buildReportData } from "../src/lib/reports/builder";
import { UserProfile } from "../src/data/contracts/auth";

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

async function runSideEffectTests() {
  console.log("=== B11 IoT Decoupling & Manual Fallback Test Suite ===\n");

  const mockCaller: UserProfile = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "researcher.test@mangocycle.invalid",
    fullName: "Lead Analytical Researcher",
    role: "researcher",
    avatarUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Initial State Check: Compute baseline Waste Diverted from deterministic builder
  console.log("1. Computing baseline Waste Diverted...");
  const { report: initialReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "waste_summary" },
    mockCaller
  );
  const initialDivertedKpi = initialReport.kpis.find((k) => k.label === "Total Waste Diverted");
  const initialDivertedValue = Number(initialDivertedKpi?.value || 0);
  console.log(`   Baseline Waste Diverted: ${initialDivertedValue} kg`);

  // 2. Insert Synthetic IoT Telemetry Reading (e.g. 99.999 kg on a dummy device)
  console.log("\n2. Inserting isolated IoT telemetry reading (99.999 kg)...");
  // Check if a dummy device exists or create a transient one
  let testDeviceId: string;
  const { data: existingDev } = await supabaseAdmin
    .from("iot_devices")
    .select("id")
    .eq("device_code", "BIN-SIDE-EFFECT-TEST")
    .maybeSingle();

  if (existingDev) {
    testDeviceId = existingDev.id;
  } else {
    const { data: newDev, error: devErr } = await supabaseAdmin
      .from("iot_devices")
      .insert({
        device_code: "BIN-SIDE-EFFECT-TEST",
        name: "Side Effect Test Bin",
        api_key_hash: "0000000000000000000000000000000000000000000000000000000000000000",
        is_active: true,
      })
      .select("id")
      .single();
    if (devErr || !newDev) throw new Error(`Failed to create test device: ${devErr?.message}`);
    testDeviceId = newDev.id;
  }

  const { data: reading, error: readErr } = await supabaseAdmin
    .from("iot_weight_readings")
    .insert({
      device_id: testDeviceId,
      weight_kg: 99.999,
      recorded_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (readErr || !reading) throw new Error(`Failed to insert test reading: ${readErr?.message}`);
  console.log(`   Inserted telemetry reading ${reading.id} (weight: 99.999 kg)`);

  // 3. Verify Baseline Waste Diverted Remains Exactly Identical
  console.log("\n3. Verifying Waste Diverted after IoT telemetry insert...");
  const { report: afterReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "waste_summary" },
    mockCaller
  );
  const afterDivertedKpi = afterReport.kpis.find((k) => k.label === "Total Waste Diverted");
  const afterDivertedValue = Number(afterDivertedKpi?.value || 0);

  assert(
    afterDivertedValue === initialDivertedValue,
    `Waste Diverted remains strictly ${initialDivertedValue} kg (IoT 99.999 kg did NOT mutate operational metrics)`
  );

  // 4. Verify existing waste batch weights were NOT mutated
  console.log("\n4. Verifying waste_batches table integrity...");
  const { data: batches } = await supabaseAdmin
    .from("waste_batches")
    .select("batch_code, weight_kg");

  assert(
    !batches?.some((b) => Number(b.weight_kg) === 99.999),
    "Zero waste_batches rows were mutated by IoT telemetry"
  );

  // Clean up transient reading
  await supabaseAdmin.from("iot_weight_readings").delete().eq("id", reading.id);
  await supabaseAdmin.from("iot_devices").delete().eq("id", testDeviceId);

  console.log("\n==========================================");
  console.log("✅ ALL IOT DECOUPLING & SIDE EFFECT TESTS PASSED!");
  console.log("==========================================");
}

runSideEffectTests().catch((err) => {
  console.error("❌ Side effect test failed:", err);
  process.exit(1);
});
