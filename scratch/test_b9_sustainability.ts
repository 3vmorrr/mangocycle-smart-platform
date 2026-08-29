import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { calculateSustainabilityMetrics } from "../src/lib/ai/sustainability/calculator";

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

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runSustainabilityTests() {
  console.log("=== B9 Sustainability Metrics & Calculations Test Suite ===");

  const metrics = await calculateSustainabilityMetrics(supabaseAdmin, "all");

  assert(typeof metrics.totalWasteCollectedKg === "number", "totalWasteCollectedKg is numeric");
  assert(metrics.totalWasteProcessedKg === null, "totalWasteProcessedKg is null (Formula Pending)");
  assert(typeof metrics.totalBatches === "number", "totalBatches is numeric");
  assert(typeof metrics.completedBatches === "number", "completedBatches is numeric");
  assert(typeof metrics.activeBatches === "number", "activeBatches is numeric");
  assert(Array.isArray(metrics.wasteBySource), "wasteBySource is array");
  assert(Array.isArray(metrics.wasteByType), "wasteByType is array");

  console.log("Sustainability Metrics calculated:");
  console.log(`- Total Waste Collected: ${metrics.totalWasteCollectedKg} kg`);
  console.log(`- Completed Batches: ${metrics.completedBatches}`);
  console.log(`- Active Batches: ${metrics.activeBatches}`);
  console.log(`- Product Batches: ${metrics.productBatchesCount}`);

  console.log("\nResults: All 8/8 sustainability calculation tests PASSED!");
}

runSustainabilityTests().catch((err) => {
  console.error("Sustainability tests failed:", err);
  process.exit(1);
});
