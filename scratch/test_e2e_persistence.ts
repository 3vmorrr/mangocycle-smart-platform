import fs from "fs";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import {
  WASTE_ANALYZER_SYSTEM_PROMPT,
  WASTE_ANALYZER_PROMPT_VERSION,
  buildWasteAnalyzerUserPrompt,
} from "../src/lib/ai/prompts/waste-analyzer";
import { validateAndSanitizeWasteAnalysis } from "../src/lib/ai/validators/waste-analyzer";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE config");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function runE2EPersistenceTest() {
  console.log("=== Phase B8.1: Full Real Pipeline + Supabase Persistence Test ===");

  // 1. Load image
  const imageBuffer = fs.readFileSync("scratch/test_mango_peel.jpg");
  const imageBase64 = imageBuffer.toString("base64");

  // 2. Fetch or create a test waste batch on mangocycle-dev for linkage
  let { data: batches } = await supabaseAdmin
    .from("waste_batches")
    .select("id, batch_code, waste_type, current_status")
    .limit(1);

  let testBatch = batches?.[0] || null;

  if (!testBatch) {
    console.log("No existing waste batch found, creating test batch fixture...");
    // Ensure test source
    let { data: sources } = await supabaseAdmin.from("waste_sources").select("id").limit(1);
    let sourceId = sources?.[0]?.id;
    if (!sourceId) {
      const { data: newSource } = await supabaseAdmin
        .from("waste_sources")
        .insert({
          name: "B8 Live Test Farm",
          source_type: "farm",
          location: "Sector 8",
          contact_info: "b8@example.invalid",
        })
        .select("id")
        .single();
      sourceId = newSource?.id;
    }

    const { data: newBatch, error: createBatchErr } = await supabaseAdmin
      .from("waste_batches")
      .insert({
        batch_code: "MW-2026-LIVE8",
        waste_type: "mango_peel",
        source_id: sourceId,
        weight_kg: 50.0,
        collection_date: new Date().toISOString().split("T")[0],
        current_status: "collected",
      })
      .select("id, batch_code, waste_type, current_status")
      .single();

    if (createBatchErr || !newBatch) {
      throw new Error(`Failed to create test batch: ${createBatchErr?.message}`);
    }
    testBatch = newBatch;
  }

  console.log(`1. Target Waste Batch: ${testBatch.batch_code} (Status: ${testBatch.current_status})`);

  // 3. Fetch an existing user profile (or null for system test)
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, role, full_name")
    .limit(1);

  const testUser = profiles?.[0] || null;
  console.log(`2. Requesting User ID: ${testUser?.id || "anonymous-test"}`);

  // 4. Call Real Gemini Provider (Model: gemini-3.7-flash)
  const provider = new GeminiProvider();
  const userPrompt = buildWasteAnalyzerUserPrompt({
    wasteBatchCode: testBatch.batch_code,
    wasteTypeHint: testBatch.waste_type,
  });

  console.log("3. Executing live Gemini multimodal request with gemini-3.7-flash...");
  const rawResult = await provider.analyzeImage({
    systemPrompt: WASTE_ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    imageMimeType: "image/jpeg",
    imageBase64,
  });

  // 5. Validate & Sanitize Output
  const structuredAnalysis = validateAndSanitizeWasteAnalysis(
    rawResult.rawContent,
    rawResult.model
  );
  console.log("4. Validated and sanitized analysis result.");

  // 6. Persist to public.ai_analysis_records on mangocycle-dev
  console.log("5. Persisting to public.ai_analysis_records on mangocycle-dev...");
  const insertPayload = {
    analysis_type: "visual_assessment",
    waste_batch_id: testBatch.id,
    input_reference: "test_mango_peel.jpg",
    prompt_version: WASTE_ANALYZER_PROMPT_VERSION,
    model: rawResult.model,
    input_data: {
      imageName: "test_mango_peel.jpg",
      imageSize: imageBuffer.length,
      imageMime: "image/jpeg",
      wasteBatchCode: testBatch.batch_code,
    },
    output_data: structuredAnalysis as unknown as Record<string, unknown>,
    status: "completed",
    human_reviewed: false,
    requested_by: testUser?.id || null,
  };

  const { data: record, error: insertErr } = await supabaseAdmin
    .from("ai_analysis_records")
    .insert(insertPayload)
    .select()
    .single();

  if (insertErr || !record) {
    throw new Error(`Failed to insert record: ${insertErr?.message}`);
  }

  console.log(`6. Successfully persisted AI analysis record ID: ${record.id}`);
  console.log(`   Model: ${record.model}`);
  console.log(`   Prompt Version: ${record.prompt_version}`);
  console.log(`   Status: ${record.status}`);
  console.log(`   Waste Batch ID: ${record.waste_batch_id}`);

  // 7. Verify Batch status remained unchanged (NO side-effects)
  const { data: verifyBatch } = await supabaseAdmin
    .from("waste_batches")
    .select("current_status")
    .eq("id", testBatch.id)
    .single();

  if (verifyBatch?.current_status !== testBatch.current_status) {
    throw new Error("Workflow side-effect detected: waste batch status was altered!");
  }
  console.log("7. Verified zero workflow side-effects: batch status unchanged.");

  // 8. Verify No Secrets Stored
  const stringifiedRecord = JSON.stringify(record);
  if (
    stringifiedRecord.includes("AQ.Ab") ||
    stringifiedRecord.includes("GEMINI_API_KEY") ||
    stringifiedRecord.includes("Bearer") ||
    stringifiedRecord.includes("sk-")
  ) {
    throw new Error("Secret leak detected in database record!");
  }
  console.log("8. Verified zero credentials/secrets in persisted record.");

  console.log("\n🎉 END-TO-END REAL GEMINI AI INTEGRATION AND PERSISTENCE VERIFIED!");
}

runE2EPersistenceTest().catch((err) => {
  console.error("❌ E2E Persistence test failed:", err);
  process.exit(1);
});
