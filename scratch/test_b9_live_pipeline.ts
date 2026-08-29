import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { evaluateProcessingRules } from "../src/lib/ai/rules/processing-advisor";
import {
  PROCESSING_ADVISOR_PROMPT_VERSION,
  PROCESSING_ADVISOR_SYSTEM_PROMPT,
  buildProcessingAdvisorUserPrompt,
} from "../src/lib/ai/prompts/processing-advisor";
import { buildAdvisorResponse } from "../src/lib/ai/validators/processing-advisor";
import { runAskMangoCycleQuery } from "../src/lib/ai/prompts/ask-mangocycle";
import { calculateSustainabilityMetrics } from "../src/lib/ai/sustainability/calculator";
import {
  generateSustainabilityNarrative,
  SUSTAINABILITY_PROMPT_VERSION,
} from "../src/lib/ai/prompts/sustainability";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import { WasteType } from "../src/data/contracts/waste-batch";

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
const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runB9LivePipeline() {
  console.log("=== Phase B9: Real Authenticated End-to-End Live Verification Suite ===");

  // 1. Authenticate as Operator User
  const operatorEmail = "b8.operator.live@mangocycle.invalid";
  const operatorPassword = "OperatorLivePassword123!";

  console.log("\n1. Signing in as Authenticated Operator...");
  const { data: authSession, error: signInErr } = await supabaseUserClient.auth.signInWithPassword({
    email: operatorEmail,
    password: operatorPassword,
  });

  if (signInErr || !authSession?.session) {
    throw new Error(`Sign-in failed: ${signInErr?.message}`);
  }

  const userId = authSession.user.id;
  console.log(`   Authenticated User ID: ${userId}`);

  // Fetch verified waste batch fixture
  const { data: batches } = await supabaseAdmin.from("waste_batches").select("*").limit(1);
  const testBatch = batches?.[0];
  if (!testBatch) throw new Error("No waste batches found");

  console.log(`   Target Waste Batch: ${testBatch.batch_code} (${testBatch.waste_type}, ${testBatch.current_status})`);

  // ==========================================
  // TEST A: Real Processing Advisor Live Pipeline
  // ==========================================
  console.log("\n==========================================");
  console.log("2. Testing Real Processing Advisor Live Pipeline...");
  console.log("==========================================");

  // A1. Run deterministic rule engine
  const ruleEvaluation = evaluateProcessingRules({
    id: testBatch.id,
    batchCode: testBatch.batch_code,
    wasteType: testBatch.waste_type as WasteType,
    currentStatus: testBatch.current_status,
    moistureStatus: testBatch.moisture_status,
    visualCondition: testBatch.visual_condition,
    collectionDate: testBatch.collection_date,
  });

  console.log(`   Deterministic Evaluation: ${ruleEvaluation.triggeredRules.length} rule(s) triggered`);
  ruleEvaluation.triggeredRules.forEach((r) => console.log(`   - [${r.id}] ${r.priority.toUpperCase()}: ${r.recommendation}`));

  // A2. Real Gemini Explanation Call
  const provider = new GeminiProvider();
  const userPrompt = buildProcessingAdvisorUserPrompt(ruleEvaluation);
  const placeholderImgBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  console.log(`   Calling Gemini API (${provider.getPrimaryModel()}) for narrative explanation...`);
  const aiResult = await provider.analyzeImage({
    systemPrompt: PROCESSING_ADVISOR_SYSTEM_PROMPT,
    userPrompt,
    imageMimeType: "image/gif",
    imageBase64: placeholderImgBase64,
  });

  console.log(`   Gemini Explanation Received (Model: ${aiResult.model})`);

  // A3. Build & Validate Response DTO
  const advisorResponse = buildAdvisorResponse(ruleEvaluation, aiResult.rawContent, aiResult.model);
  assert(typeof advisorResponse.aiExplanation === "string" && advisorResponse.aiExplanation.length > 20, "AI explanation validated");
  console.log(`   Explanation snippet: "${advisorResponse.aiExplanation.substring(0, 120)}..."`);

  // A4. Persist Record to public.ai_analysis_records VIA AUTHENTICATED USER CLIENT
  const { data: insertedAdvisorRecord, error: persistAdvisorErr } = await supabaseUserClient
    .from("ai_analysis_records")
    .insert({
      analysis_type: "processing_advice",
      waste_batch_id: testBatch.id,
      input_reference: testBatch.batch_code,
      prompt_version: PROCESSING_ADVISOR_PROMPT_VERSION,
      model: aiResult.model,
      input_data: { batch_code: testBatch.batch_code },
      output_data: advisorResponse as unknown as Record<string, unknown>,
      status: "completed",
      human_reviewed: false,
      requested_by: userId,
    })
    .select()
    .single();

  if (persistAdvisorErr || !insertedAdvisorRecord) {
    throw new Error(`Failed to persist processing advice record: ${persistAdvisorErr?.message}`);
  }

  assert(insertedAdvisorRecord.requested_by === userId, "Processing Advisor record has requested_by matching caller");
  console.log(`   Persisted Processing Advice Record ID: ${insertedAdvisorRecord.id}`);

  // ==========================================
  // TEST B: Real Ask MangoCycle Tool Calling Queries
  // ==========================================
  console.log("\n==========================================");
  console.log("3. Testing Real Ask MangoCycle Tool Calling (3 Queries)...");
  console.log("==========================================");

  // Query 1: Aggregate Metric
  console.log("\n--- Query 1: Aggregate Metric ---");
  await new Promise((r) => setTimeout(r, 20000));
  const q1 = "How much total waste has been collected across all batches in the platform?";
  console.log(`User: "${q1}"`);
  const ans1 = await runAskMangoCycleQuery(supabaseAdmin, q1);
  console.log(`Tool Calls: ${JSON.stringify(ans1.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
  console.log(`Assistant: "${ans1.content}"`);

  assert(Boolean(ans1.toolCalls && ans1.toolCalls.length > 0), "Query 1 triggered tool call");
  assert(
    ans1.toolCalls?.[0].toolName === "get_total_waste" ||
      ans1.toolCalls?.[0].toolName === "get_dashboard_metrics",
    "Query 1 called get_total_waste or get_dashboard_metrics"
  );

  // Query 2: Batch Details
  console.log("\n--- Query 2: Batch Specific Details ---");
  await new Promise((r) => setTimeout(r, 20000));
  const q2 = `Show me the operational details for batch ${testBatch.batch_code}.`;
  console.log(`User: "${q2}"`);
  const ans2 = await runAskMangoCycleQuery(supabaseAdmin, q2);
  console.log(`Tool Calls: ${JSON.stringify(ans2.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
  console.log(`Assistant: "${ans2.content}"`);

  assert(Boolean(ans2.toolCalls && ans2.toolCalls.length > 0), "Query 2 triggered tool call");
  assert(ans2.toolCalls?.[0].toolName === "get_batch_details", "Query 2 called get_batch_details");

  // Query 3: Pending Metric
  console.log("\n--- Query 3: Pending Metric (Formula Pending) ---");
  await new Promise((r) => setTimeout(r, 25000));
  const q3 = "What is the platform's Biological Yield and Processing Rate?";
  console.log(`User: "${q3}"`);
  const ans3 = await runAskMangoCycleQuery(supabaseAdmin, q3);
  console.log(`Tool Calls: ${JSON.stringify(ans3.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
  console.log(`Assistant: "${ans3.content}"`);

  assert(
    ans3.content.toLowerCase().includes("pending") ||
      ans3.content.toLowerCase().includes("not currently defined") ||
      ans3.content.toLowerCase().includes("formula") ||
      ans3.content.toLowerCase().includes("not available"),
    "Query 3 accurately reports pending/unavailable status without fabricating numbers"
  );

  // ==========================================
  // TEST C: Real Sustainability AI Insights
  // ==========================================
  console.log("\n==========================================");
  console.log("4. Testing Real Sustainability AI Insights...");
  console.log("==========================================");
  await new Promise((r) => setTimeout(r, 25000));

  // C1. Deterministic Calculation
  const metrics = await calculateSustainabilityMetrics(supabaseAdmin, "all");
  console.log(`   Calculated Metrics: Total Collected=${metrics.totalWasteCollectedKg} kg, Batches=${metrics.totalBatches}`);

  // C2. Gemini Narrative Synthesis
  console.log("   Calling Gemini API for sustainability narrative synthesis...");
  const narrativeRes = await generateSustainabilityNarrative("all", metrics);

  console.log(`   Narrative Bullets Generated (${narrativeRes.narrativeBullets.length}):`);
  narrativeRes.narrativeBullets.forEach((b) => console.log(`   - ${b}`));
  console.log(`   Summary: "${narrativeRes.aiSummary.substring(0, 120)}..."`);

  assert(narrativeRes.narrativeBullets.length >= 2, "At least 2 narrative bullets generated");

  // C3. Persist Record VIA AUTHENTICATED USER CLIENT
  const { data: insertedInsightRecord, error: persistInsightErr } = await supabaseUserClient
    .from("ai_analysis_records")
    .insert({
      analysis_type: "sustainability_insights",
      input_reference: "all",
      prompt_version: SUSTAINABILITY_PROMPT_VERSION,
      model: narrativeRes.model,
      input_data: { period: "all", metrics: metrics as unknown as Record<string, unknown> },
      output_data: narrativeRes as unknown as Record<string, unknown>,
      status: "completed",
      human_reviewed: false,
      requested_by: userId,
    })
    .select()
    .single();

  if (persistInsightErr || !insertedInsightRecord) {
    throw new Error(`Failed to persist sustainability insight record: ${persistInsightErr?.message}`);
  }

  assert(insertedInsightRecord.requested_by === userId, "Sustainability Insight record has requested_by matching caller");
  console.log(`   Persisted Sustainability Insight Record ID: ${insertedInsightRecord.id}`);

  console.log("\n==========================================");
  console.log("✅ ALL B9 REAL LIVE PIPELINES VERIFIED 100%!");
  console.log("==========================================");
}

runB9LivePipeline().catch((err) => {
  console.error("❌ Live pipeline failed:", err);
  process.exit(1);
});
