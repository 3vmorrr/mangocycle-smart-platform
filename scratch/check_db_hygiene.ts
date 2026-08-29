import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkHygiene() {
  const tables = [
    "profiles",
    "waste_sources",
    "waste_batches",
    "batch_stage_history",
    "product_batches",
    "product_waste_links",
    "laboratory_tests",
    "laboratory_attachments",
    "iot_devices",
    "iot_weight_readings",
    "ai_analysis_records",
    "audit_logs",
    "app_settings",
  ];

  console.log("=== MangoCycle Database Hygiene Audit ===");
  for (const t of tables) {
    const { count, error } = await supabaseAdmin.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`${t}: ERROR (${error.message})`);
    } else {
      console.log(`${t}: ${count} rows`);
    }
  }
}

checkHygiene().catch(console.error);
