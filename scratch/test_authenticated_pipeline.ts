import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import {
  WASTE_ANALYZER_SYSTEM_PROMPT,
  WASTE_ANALYZER_PROMPT_VERSION,
  buildWasteAnalyzerUserPrompt,
} from "../src/lib/ai/prompts/waste-analyzer";
import { validateAndSanitizeWasteAnalysis } from "../src/lib/ai/validators/waste-analyzer";
import { wasteImageUploadSchema } from "../src/lib/validators/ai";

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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey);

async function runAuthenticatedTest() {
  console.log("=== Phase B8.2: Real Authenticated Operator Live Test ===");

  // 1. Create or ensure Active Operator User in Supabase Auth
  const operatorEmail = "b8.operator.live@mangocycle.invalid";
  const operatorPassword = "OperatorLivePassword123!";

  console.log("1. Setting up authenticated Operator user in Supabase...");
  let userId: string;

  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = userList?.users?.find((u) => u.email === operatorEmail);

  if (existingUser) {
    userId = existingUser.id;
    console.log(`   Found existing operator user: ${userId}`);
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: operatorEmail,
      password: operatorPassword,
      email_confirm: true,
      user_metadata: { full_name: "B8 Live Operator" },
    });
    if (createErr || !newUser?.user) {
      throw new Error(`Failed to create operator user: ${createErr?.message}`);
    }
    userId = newUser.user.id;
    console.log(`   Created new operator user: ${userId}`);
  }

  // Ensure profile has role='operator' and is_active=true
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: operatorEmail,
      role: "operator",
      full_name: "B8 Live Operator",
      is_active: true,
      updated_at: new Date().toISOString(),
    });

  if (profileErr) {
    throw new Error(`Failed to set operator profile: ${profileErr.message}`);
  }

  // 2. Sign in as Operator through real Supabase Auth
  console.log("2. Signing in as Operator to establish real authenticated session...");
  const { data: authSession, error: signInErr } = await supabaseUserClient.auth.signInWithPassword({
    email: operatorEmail,
    password: operatorPassword,
  });

  if (signInErr || !authSession?.session) {
    throw new Error(`Sign-in failed: ${signInErr?.message}`);
  }

  const { data: authData, error: authUserErr } = await supabaseUserClient.auth.getUser();
  if (authUserErr || !authData?.user) {
    throw new Error("Failed to verify authenticated user context.");
  }

  console.log(`   Authenticated User Context Verified: ID = ${authData.user.id}`);

  // Verify profile via authenticated client (RLS checks profile select)
  const { data: operatorProfile, error: profileFetchErr } = await supabaseUserClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (profileFetchErr || !operatorProfile) {
    throw new Error(`Failed to load operator profile via RLS: ${profileFetchErr?.message}`);
  }

  console.log(`   Profile verified via RLS: Role = ${operatorProfile.role}, Active = ${operatorProfile.is_active}`);
  if (operatorProfile.role !== "operator" || !operatorProfile.is_active) {
    throw new Error("User does not have active operator role!");
  }

  // 3. Ensure test waste batch exists
  let { data: batches } = await supabaseAdmin.from("waste_batches").select("id, batch_code, waste_type").limit(1);
  let testBatch = batches?.[0] || null;

  if (!testBatch) {
    let { data: sources } = await supabaseAdmin.from("waste_sources").select("id").limit(1);
    let sourceId = sources?.[0]?.id;
    if (!sourceId) {
      const { data: newSrc } = await supabaseAdmin
        .from("waste_sources")
        .insert({
          name: "B8 Verified Farm",
          source_type: "farm",
          location: "Sector 8",
          contact_info: "farm@example.invalid",
        })
        .select("id")
        .single();
      sourceId = newSrc?.id;
    }

    const { data: newB } = await supabaseAdmin
      .from("waste_batches")
      .insert({
        batch_code: "MW-2026-B82",
        waste_type: "mango_peel",
        source_id: sourceId,
        weight_kg: 50.0,
        collection_date: new Date().toISOString().split("T")[0],
        current_status: "collected",
      })
      .select("id, batch_code, waste_type")
      .single();
    testBatch = newB;
  }

  if (!testBatch) {
    throw new Error("testBatch could not be loaded or created");
  }

  // 4. Load real mango waste image & validate parameters
  const imageBuffer = fs.readFileSync("scratch/test_mango_peel.jpg");
  const imageBase64 = imageBuffer.toString("base64");

  const validation = wasteImageUploadSchema.safeParse({
    fileSize: imageBuffer.length,
    mimeType: "image/jpeg",
  });
  if (!validation.success) {
    throw new Error("Image validation failed.");
  }
  console.log(`3. Image parameters validated (Size: ${imageBuffer.length} bytes, MIME: image/jpeg)`);

  // 5. Call Real Gemini Provider (Model: gemini-3.6-flash)
  const provider = new GeminiProvider();
  const userPrompt = buildWasteAnalyzerUserPrompt({
    wasteBatchCode: testBatch.batch_code,
    wasteTypeHint: testBatch.waste_type,
  });

  console.log("4. Executing real Gemini multimodal vision analysis (Model: gemini-3.6-flash)...");
  const aiResult = await provider.analyzeImage({
    systemPrompt: WASTE_ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    imageMimeType: "image/jpeg",
    imageBase64,
  });

  console.log(`   Gemini analysis received (Model: ${aiResult.model})`);

  // 6. Validate & Sanitize Analysis Output
  const structuredAnalysis = validateAndSanitizeWasteAnalysis(
    aiResult.rawContent,
    aiResult.model
  );
  console.log("5. Validated and sanitized analysis output DTO.");

  // 7. Persist to public.ai_analysis_records VIA AUTHENTICATED OPERATOR CLIENT (RLS INSERT)
  console.log("6. Inserting record via Authenticated Client (testing RLS INSERT policy)...");
  const insertPayload = {
    analysis_type: "visual_assessment",
    waste_batch_id: testBatch.id,
    input_reference: "mango_peel_sample.jpg",
    prompt_version: WASTE_ANALYZER_PROMPT_VERSION,
    model: aiResult.model,
    input_data: {
      imageName: "mango_peel_sample.jpg",
      imageSize: imageBuffer.length,
      imageMime: "image/jpeg",
      wasteBatchCode: testBatch.batch_code,
    },
    output_data: structuredAnalysis as unknown as Record<string, unknown>,
    status: "completed",
    human_reviewed: false,
    requested_by: authData.user.id, // Strictly populated from authenticated caller ID
  };

  const { data: insertedRecord, error: insertError } = await supabaseUserClient
    .from("ai_analysis_records")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError || !insertedRecord) {
    throw new Error(`Authenticated RLS insert failed: ${insertError?.message}`);
  }

  console.log(`7. Successfully persisted record ID: ${insertedRecord.id}`);

  // 8. Read back record VIA AUTHENTICATED OPERATOR CLIENT (testing RLS SELECT_OWN policy)
  console.log("8. Reading back record via Authenticated Client (testing RLS SELECT_OWN policy)...");
  const { data: fetchedRecord, error: fetchError } = await supabaseUserClient
    .from("ai_analysis_records")
    .select("id, analysis_type, waste_batch_id, prompt_version, model, status, requested_by, created_at")
    .eq("id", insertedRecord.id)
    .single();

  if (fetchError || !fetchedRecord) {
    throw new Error(`Authenticated RLS select failed: ${fetchError?.message}`);
  }

  console.log("\n=== PERSISTED RECORD VERIFICATION ===");
  console.log(`- Record ID: ${fetchedRecord.id}`);
  console.log(`- Model: ${fetchedRecord.model}`);
  console.log(`- Prompt Version: ${fetchedRecord.prompt_version}`);
  console.log(`- Status: ${fetchedRecord.status}`);
  console.log(`- Waste Batch ID: ${fetchedRecord.waste_batch_id}`);
  console.log(`- requested_by: ${fetchedRecord.requested_by}`);
  console.log(`- Authenticated Caller User ID: ${authData.user.id}`);

  if (!fetchedRecord.requested_by) {
    throw new Error("CRITICAL FAILURE: requested_by is NULL!");
  }

  if (fetchedRecord.requested_by !== authData.user.id) {
    throw new Error(`CRITICAL FAILURE: requested_by (${fetchedRecord.requested_by}) !== authenticated caller (${authData.user.id})`);
  }

  console.log("\n✅ PROOF: requested_by strictly matches the authenticated Operator caller ID!");
  console.log("✅ AUTHENTICATION & PERSISTENCE VERIFICATION PASSED 100%!");
}

runAuthenticatedTest().catch((err) => {
  console.error("❌ Authenticated test failed:", err);
  process.exit(1);
});
