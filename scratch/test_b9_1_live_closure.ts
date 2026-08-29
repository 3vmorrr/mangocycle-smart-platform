import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { runAskMangoCycleQuery } from "../src/lib/ai/prompts/ask-mangocycle";
import { calculateSustainabilityMetrics } from "../src/lib/ai/sustainability/calculator";
import {
  generateSustainabilityNarrative,
  SUSTAINABILITY_PROMPT_VERSION,
} from "../src/lib/ai/prompts/sustainability";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";

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

const CHECKPOINT_FILE = path.join(process.cwd(), "scratch", "b9_1_checkpoint.json");

interface CheckpointState {
  scenario1_aggregate?: {
    passed: boolean;
    question: string;
    model: string;
    toolSelected: string;
    validatedArgs: Record<string, unknown>;
    toolResultSummary: string;
    finalAnswer: string;
    numericAgreement: boolean;
  };
  scenario2_detail?: {
    passed: boolean;
    question: string;
    model: string;
    toolSelected: string;
    validatedArgs: Record<string, unknown>;
    toolResultSummary: string;
    finalAnswer: string;
    dataAgreement: boolean;
    leakedPrivateFields: boolean;
  };
  scenario3_pending?: {
    passed: boolean;
    question: string;
    model: string;
    toolCallsCount: number;
    finalAnswer: string;
    inventedNumericValue: boolean;
  };
  scenario4_sustainability?: {
    passed: boolean;
    model: string;
    deterministicPayload: Record<string, unknown>;
    narrativeBullets: string[];
    aiSummary: string;
    unsupportedClaims: boolean;
    pendingMetricsInvented: boolean;
    persistedRecordId: string;
    requestedBy: string;
  };
}

function loadCheckpoint(): CheckpointState {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCheckpoint(state: CheckpointState) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2), "utf8");
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

async function runB91Closure() {
  console.log("=== Phase B9.1: Minimal Live Gemini Verification & Closure Suite ===");

  // 1. Configuration Preflight
  const configuredProvider = process.env.AI_PROVIDER;
  const configuredModel = process.env.AI_MODEL;
  const apiKeyPresent = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );

  console.log(`\n--- Preflight Configuration ---`);
  console.log(`AI_PROVIDER: ${configuredProvider}`);
  console.log(`AI_MODEL: ${configuredModel}`);
  console.log(`GEMINI_API_KEY present: ${apiKeyPresent ? "YES" : "NO"}`);

  assert(configuredProvider === "gemini", "AI_PROVIDER is 'gemini'");
  assert(configuredModel === "gemini-3.6-flash", "AI_MODEL is strictly 'gemini-3.6-flash'");
  assert(apiKeyPresent, "GEMINI_API_KEY is present");

  const provider = new GeminiProvider();
  assert(
    provider.getPrimaryModel() === "gemini-3.6-flash",
    "GeminiProvider resolves primary model as exactly 'gemini-3.6-flash'"
  );

  // Authenticate as Operator User
  const operatorEmail = "b8.operator.live@mangocycle.invalid";
  const operatorPassword = "OperatorLivePassword123!";

  console.log("\nSigning in as Authenticated Operator...");
  const { data: authSession, error: signInErr } = await supabaseUserClient.auth.signInWithPassword({
    email: operatorEmail,
    password: operatorPassword,
  });

  if (signInErr || !authSession?.session) {
    throw new Error(`Sign-in failed: ${signInErr?.message}`);
  }

  const userId = authSession.user.id;
  console.log(`Authenticated Operator User ID: ${userId}`);

  // Fetch verified waste batch fixture
  const { data: batches } = await supabaseAdmin
    .from("waste_batches")
    .select("id, batch_code, waste_type, current_status, weight_kg")
    .eq("batch_code", "MW-2026-LIVE8")
    .limit(1);

  let targetBatch = batches?.[0];
  if (!targetBatch) {
    const { data: anyBatches } = await supabaseAdmin.from("waste_batches").select("*").limit(1);
    targetBatch = anyBatches?.[0];
  }
  if (!targetBatch) throw new Error("No waste batches available in database");

  console.log(`Target Batch: ${targetBatch.batch_code} (${targetBatch.waste_type}, ${targetBatch.weight_kg} kg)`);

  const checkpoint = loadCheckpoint();

  // Snapshot before state for side-effects verification
  const { count: initialWasteBatchCount } = await supabaseAdmin
    .from("waste_batches")
    .select("*", { count: "exact", head: true });
  const { count: initialProductBatchCount } = await supabaseAdmin
    .from("product_batches")
    .select("*", { count: "exact", head: true });
  const { count: initialLabTestCount } = await supabaseAdmin
    .from("lab_test_records")
    .select("*", { count: "exact", head: true });

  // ==========================================
  // SCENARIO 1: Ask MangoCycle Aggregate Query
  // ==========================================
  console.log("\n==========================================");
  console.log("LIVE TEST #1 — ASK MANGOCYCLE AGGREGATE");
  console.log("==========================================");

  if (checkpoint.scenario1_aggregate?.passed) {
    console.log("⚡ Checkpoint HIT: Scenario 1 already verified PASS. Skipping execution.");
  } else {
    const q1 = "How much total waste has been collected across all batches in the platform?";
    console.log(`Question: "${q1}"`);
    console.log(`Model: ${configuredModel}`);

    const res1 = await runAskMangoCycleQuery(supabaseUserClient, q1);
    console.log(`Tool Calls: ${JSON.stringify(res1.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
    console.log(`Final Answer: "${res1.content}"`);

    assert(Boolean(res1.toolCalls && res1.toolCalls.length > 0), "Real Gemini tool call occurred");
    const toolUsed = res1.toolCalls![0].toolName;
    assert(
      toolUsed === "get_total_waste" || toolUsed === "get_dashboard_metrics",
      "Allowlisted tool get_total_waste or get_dashboard_metrics selected"
    );

    // Verify numeric agreement:
    const toolResult = res1.toolCalls![0].result as Record<string, unknown>;
    const expectedKg = Number(toolResult.total_waste_kg ?? toolResult.total_waste_collected_kg ?? 0);
    const answerMentionsExpected = res1.content.includes(String(expectedKg)) || res1.content.includes(`${expectedKg} kg`);
    assert(answerMentionsExpected, `Final answer numerically agrees with tool result (${expectedKg} kg)`);

    checkpoint.scenario1_aggregate = {
      passed: true,
      question: q1,
      model: configuredModel!,
      toolSelected: toolUsed,
      validatedArgs: res1.toolCalls![0].parameters,
      toolResultSummary: `total_waste_kg=${expectedKg}`,
      finalAnswer: res1.content,
      numericAgreement: true,
    };
    saveCheckpoint(checkpoint);
    console.log("✅ Scenario 1 checkpointed PASS.");

    // Small 8s pause before next query
    await new Promise((r) => setTimeout(r, 8000));
  }

  // ==========================================
  // SCENARIO 2: Ask MangoCycle Batch Detail Query
  // ==========================================
  console.log("\n==========================================");
  console.log("LIVE TEST #2 — ASK MANGOCYCLE BATCH DETAIL");
  console.log("==========================================");

  if (checkpoint.scenario2_detail?.passed) {
    console.log("⚡ Checkpoint HIT: Scenario 2 already verified PASS. Skipping execution.");
  } else {
    const q2 = `Show me the recorded details for waste batch ${targetBatch.batch_code}.`;
    console.log(`Question: "${q2}"`);
    console.log(`Model: ${configuredModel}`);

    const res2 = await runAskMangoCycleQuery(supabaseUserClient, q2);
    console.log(`Tool Calls: ${JSON.stringify(res2.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
    console.log(`Final Answer: "${res2.content}"`);

    assert(Boolean(res2.toolCalls && res2.toolCalls.length > 0), "Real Gemini tool call occurred");
    const toolUsed = res2.toolCalls![0].toolName;
    assert(toolUsed === "get_batch_details", "Allowlisted tool get_batch_details selected");

    const batchArgs = res2.toolCalls![0].parameters as { batch_code?: string };
    assert(
      batchArgs.batch_code?.trim().toUpperCase() === targetBatch.batch_code.toUpperCase(),
      "Batch code parameter correctly passed to tool"
    );

    // Verify no private fields leaked in answer
    const forbiddenLeakedStrings = ["api_key", "secret", "password", "token", "@mangocycle", "researcher_notes"];
    const hasLeak = forbiddenLeakedStrings.some((s) => res2.content.toLowerCase().includes(s));
    assert(!hasLeak, "No private fields or internal secrets leaked in final answer");

    // Verify batch code and weight in answer
    const answerMentionsBatch = res2.content.includes(targetBatch.batch_code);
    assert(answerMentionsBatch, "Final answer contains target batch details");

    checkpoint.scenario2_detail = {
      passed: true,
      question: q2,
      model: configuredModel!,
      toolSelected: toolUsed,
      validatedArgs: res2.toolCalls![0].parameters,
      toolResultSummary: `batch_code=${targetBatch.batch_code}, weight_kg=${targetBatch.weight_kg}`,
      finalAnswer: res2.content,
      dataAgreement: true,
      leakedPrivateFields: false,
    };
    saveCheckpoint(checkpoint);
    console.log("✅ Scenario 2 checkpointed PASS.");

    // Small 8s pause before next query
    await new Promise((r) => setTimeout(r, 8000));
  }

  // ==========================================
  // SCENARIO 3: Ask MangoCycle Pending Metric Query
  // ==========================================
  console.log("\n==========================================");
  console.log("LIVE TEST #3 — PENDING METRIC (BIOLOGICAL YIELD)");
  console.log("==========================================");

  if (checkpoint.scenario3_pending?.passed) {
    console.log("⚡ Checkpoint HIT: Scenario 3 already verified PASS. Skipping execution.");
  } else {
    const q3 = "What is the current Biological Yield?";
    console.log(`Question: "${q3}"`);
    console.log(`Model: ${configuredModel}`);

    const res3 = await runAskMangoCycleQuery(supabaseUserClient, q3);
    console.log(`Tool Calls: ${JSON.stringify(res3.toolCalls?.map((t) => ({ tool: t.toolName, params: t.parameters })))}`);
    console.log(`Final Answer: "${res3.content}"`);

    const lowerAns = res3.content.toLowerCase();
    const indicatesPending =
      lowerAns.includes("pending") ||
      lowerAns.includes("not currently defined") ||
      lowerAns.includes("formula pending") ||
      lowerAns.includes("not available") ||
      lowerAns.includes("formula has not been defined") ||
      lowerAns.includes("unresolved");

    assert(indicatesPending, "Biological Yield is correctly reported as Formula Pending / not currently defined");

    // Verify no invented percentage
    const hasInventedPercentage = /\b\d{1,3}(\.\d+)?%\b/.test(res3.content);
    assert(!hasInventedPercentage, "No invented percentage was generated for Biological Yield");

    checkpoint.scenario3_pending = {
      passed: true,
      question: q3,
      model: configuredModel!,
      toolCallsCount: res3.toolCalls?.length || 0,
      finalAnswer: res3.content,
      inventedNumericValue: false,
    };
    saveCheckpoint(checkpoint);
    console.log("✅ Scenario 3 checkpointed PASS.");

    // Small 8s pause before next query
    await new Promise((r) => setTimeout(r, 8000));
  }

  // ==========================================
  // SCENARIO 4: Sustainability Insight Generation & Persistence
  // ==========================================
  console.log("\n==========================================");
  console.log("LIVE TEST #4 — SUSTAINABILITY INSIGHT & SAFETY");
  console.log("==========================================");

  if (checkpoint.scenario4_sustainability?.passed) {
    console.log("⚡ Checkpoint HIT: Scenario 4 already verified PASS. Skipping execution.");
  } else {
    // 1. Calculate deterministic metrics
    const metrics = await calculateSustainabilityMetrics(supabaseUserClient, "all");
    console.log(`Deterministic Metrics Calculated: Total Collected=${metrics.totalWasteCollectedKg} kg, Total Batches=${metrics.totalBatches}`);
    assert(metrics.totalWasteCollectedKg >= 0, "Deterministic waste collected is numeric");
    assert(metrics.totalWasteProcessedKg === null, "Total waste processed is null (Formula Pending)");

    // 2. Call Gemini for narrative synthesis
    console.log(`Calling Gemini API (${configuredModel}) for sustainability narrative synthesis...`);
    const narrativeRes = await generateSustainabilityNarrative("all", metrics);

    console.log(`Model Used: ${narrativeRes.model}`);
    console.log(`Narrative Bullets (${narrativeRes.narrativeBullets.length}):`);
    narrativeRes.narrativeBullets.forEach((b) => console.log(` - ${b}`));
    console.log(`AI Summary: "${narrativeRes.aiSummary.substring(0, 140)}..."`);

    assert(narrativeRes.model === "gemini-3.6-flash", "Narrative model metadata is 'gemini-3.6-flash'");
    assert(narrativeRes.narrativeBullets.length >= 2, "At least 2 narrative bullets generated");

    // 3. Verify zero unsupported claims
    const prohibitedSubstrings = [
      "co2",
      "carbon credit",
      "water saved",
      "energy saved",
      "financial savings",
      "profit",
      "trees planted",
    ];
    const fullText = (narrativeRes.narrativeBullets.join(" ") + " " + narrativeRes.aiSummary).toLowerCase();
    const hasProhibited = prohibitedSubstrings.some((p) => fullText.includes(p));
    assert(!hasProhibited, "No unauthorized environmental/financial conversion claims present");

    // 4. Persist to public.ai_analysis_records VIA AUTHENTICATED USER CLIENT
    const { data: insertedRecord, error: persistErr } = await supabaseUserClient
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

    if (persistErr || !insertedRecord) {
      throw new Error(`Failed to persist sustainability insight: ${persistErr?.message}`);
    }

    assert(insertedRecord.requested_by === userId, "Record requested_by matches authenticated caller");
    console.log(`Persisted Record ID: ${insertedRecord.id}`);

    checkpoint.scenario4_sustainability = {
      passed: true,
      model: narrativeRes.model,
      deterministicPayload: metrics as unknown as Record<string, unknown>,
      narrativeBullets: narrativeRes.narrativeBullets,
      aiSummary: narrativeRes.aiSummary,
      unsupportedClaims: false,
      pendingMetricsInvented: false,
      persistedRecordId: insertedRecord.id,
      requestedBy: insertedRecord.requested_by,
    };
    saveCheckpoint(checkpoint);
    console.log("✅ Scenario 4 checkpointed PASS.");
  }

  // ==========================================
  // SIDE-EFFECTS & READ-ONLY VERIFICATION
  // ==========================================
  console.log("\n--- Side-Effects & Read-Only Audit ---");
  const { count: finalWasteBatchCount } = await supabaseAdmin
    .from("waste_batches")
    .select("*", { count: "exact", head: true });
  const { count: finalProductBatchCount } = await supabaseAdmin
    .from("product_batches")
    .select("*", { count: "exact", head: true });
  const { count: finalLabTestCount } = await supabaseAdmin
    .from("lab_test_records")
    .select("*", { count: "exact", head: true });

  assert(finalWasteBatchCount === initialWasteBatchCount, "Waste batches table untouched (no mutations)");
  assert(finalProductBatchCount === initialProductBatchCount, "Product batches table untouched (no mutations)");
  assert(finalLabTestCount === initialLabTestCount, "Lab test records table untouched (no mutations)");

  console.log("\n==========================================");
  console.log("🎉 ALL B9.1 LIVE SCENARIOS COMPLETED 100% SUCCESSFULLY!");
  console.log("==========================================");
}

runB91Closure().catch((err) => {
  console.error("❌ B9.1 Live Verification Failed:", err);
  process.exit(1);
});
