import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { ASK_MANGOCYCLE_TOOLS } from "../src/lib/ai/tools/definitions";
import { executeTool, ToolExecutionError } from "../src/lib/ai/tools/executor";

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

async function runToolTests() {
  console.log("=== Ask MangoCycle Tools Security & Execution Test Suite ===");

  // 1. Tool Allowlist count & no SQL tools
  assert(ASK_MANGOCYCLE_TOOLS.length === 10, "Exactly 10 tools in allowlist");
  const toolNames = ASK_MANGOCYCLE_TOOLS.map((t) => t.name);
  assert(!toolNames.includes("query_database"), "No query_database tool");
  assert(!toolNames.includes("run_sql"), "No run_sql tool");
  assert(!toolNames.includes("execute_query"), "No execute_query tool");
  assert(!toolNames.includes("delete_batch"), "No mutation tool");

  // 2. Unknown tool rejection
  try {
    await executeTool(supabaseAdmin, "run_sql", { query: "SELECT * FROM profiles" });
    assert(false, "Unknown tool should have failed");
  } catch (err: unknown) {
    assert(err instanceof ToolExecutionError, "Unknown tool throws ToolExecutionError");
  }

  // 3. Invalid tool arguments rejection
  try {
    await executeTool(supabaseAdmin, "get_total_waste", { period: "invalid-period" });
    assert(false, "Invalid period should have failed");
  } catch (err: unknown) {
    assert(err instanceof ToolExecutionError, "Invalid argument throws ToolExecutionError");
  }

  // 4. Test get_total_waste execution
  const resTotal = await executeTool(supabaseAdmin, "get_total_waste", { period: "all" });
  assert(typeof resTotal.total_waste_kg === "number", "get_total_waste returns numeric total_waste_kg");
  assert(typeof resTotal.batch_count === "number", "get_total_waste returns numeric batch_count");

  // 5. Test get_dashboard_metrics canonical values & pending metrics
  const resMetrics = await executeTool(supabaseAdmin, "get_dashboard_metrics", {});
  assert(typeof resMetrics.total_waste_collected_kg === "number", "Dashboard metrics has total_waste_collected_kg");
  assert(typeof resMetrics.waste_diverted_kg === "number", "Dashboard metrics has waste_diverted_kg");
  assert(resMetrics.total_waste_processed_kg === null, "Total Waste Processed is null (Formula Pending)");
  assert(resMetrics.processing_rate_pct === null, "Processing Rate is null (Formula Pending)");
  assert(resMetrics.biological_yield_pct === null, "Biological Yield is null (Formula Pending)");

  // 6. Test get_recent_lab_results privacy check (no researcher_notes)
  const resLab = await executeTool(supabaseAdmin, "get_recent_lab_results", { limit: 5 });
  assert(Array.isArray(resLab.tests), "Lab results returns array of tests");
  if (Array.isArray(resLab.tests) && resLab.tests.length > 0) {
    const firstTest = resLab.tests[0] as Record<string, unknown>;
    assert(!("researcher_notes" in firstTest), "researcher_notes is stripped from tool output");
    assert(!("storage_path" in firstTest), "storage_path is stripped from tool output");
  }

  // 7. Test get_batch_details non-existent batch
  const resNonExistent = await executeTool(supabaseAdmin, "get_batch_details", { batch_code: "MW-9999-NONEXISTENT" });
  assert(resNonExistent.found === false, "Non-existent batch returns found=false");

  console.log("\nResults: All 12/12 tool executor test cases PASSED!");
}

runToolTests().catch((err) => {
  console.error("Tool tests failed:", err);
  process.exit(1);
});
