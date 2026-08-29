import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { evaluateProcessingRules } from "@/lib/ai/rules/processing-advisor";
import {
  PROCESSING_ADVISOR_PROMPT_VERSION,
  PROCESSING_ADVISOR_SYSTEM_PROMPT,
  buildProcessingAdvisorUserPrompt,
} from "@/lib/ai/prompts/processing-advisor";
import { buildAdvisorResponse } from "@/lib/ai/validators/processing-advisor";
import { getAIProvider } from "@/lib/ai/provider-factory";
import { WasteType } from "@/data/contracts/waste-batch";

const requestSchema = z.object({
  batchId: z.string().min(1, "Batch identifier is required"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const profile = await requireMinimumRole("operator");

    const body = await req.json();
    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { batchId } = parsedBody.data;

    // Load waste batch by ID or batch_code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchId);
    const query = supabase.from("waste_batches").select("*");
    if (isUuid) {
      query.eq("id", batchId);
    } else {
      query.eq("batch_code", batchId);
    }

    const { data: batch, error: batchError } = await query.single();
    if (batchError || !batch) {
      return NextResponse.json(
        { error: `Waste batch '${batchId}' not found.` },
        { status: 404 }
      );
    }

    // 1. Run Deterministic Scientific Rule Engine
    const ruleEvaluation = evaluateProcessingRules({
      id: batch.id,
      batchCode: batch.batch_code,
      wasteType: batch.waste_type as WasteType,
      currentStatus: batch.current_status,
      moistureStatus: batch.moisture_status,
      visualCondition: batch.visual_condition,
      collectionDate: batch.collection_date,
    });

    // 2. Obtain AI narrative explanation from Gemini
    let aiExplanationRaw: string | null = null;
    let modelName = process.env.GEMINI_VISION_MODEL || process.env.AI_MODEL || "gemini-3.6-flash";

    try {
      const provider = getAIProvider();
      const userPrompt = buildProcessingAdvisorUserPrompt(ruleEvaluation);

      // Standard text/multimodal request using transparent 1x1 GIF for unified interface
      const placeholderImgBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      const aiResult = await provider.analyzeImage({
        systemPrompt: PROCESSING_ADVISOR_SYSTEM_PROMPT,
        userPrompt,
        imageMimeType: "image/gif",
        imageBase64: placeholderImgBase64,
        temperature: 0.2,
      });

      aiExplanationRaw = aiResult.rawContent;
      modelName = aiResult.model;
    } catch (aiErr: unknown) {
      console.warn("AI explanation generation failed (degrading to deterministic rules):", aiErr);
      // Graceful fallback: Rule engine remains fully authoritative
    }

    // 3. Assemble and validate final response
    const advisorResponse = buildAdvisorResponse(ruleEvaluation, aiExplanationRaw, modelName);

    // 4. Persist analysis record in public.ai_analysis_records
    try {
      await supabase.from("ai_analysis_records").insert({
        analysis_type: "processing_advice",
        waste_batch_id: batch.id,
        input_reference: batch.batch_code,
        prompt_version: PROCESSING_ADVISOR_PROMPT_VERSION,
        model: modelName,
        input_data: {
          batch_id: batch.id,
          batch_code: batch.batch_code,
          current_status: batch.current_status,
          waste_type: batch.waste_type,
          moisture_status: batch.moisture_status,
          visual_condition: batch.visual_condition,
        },
        output_data: advisorResponse as unknown as Record<string, unknown>,
        status: "completed",
        human_reviewed: false,
        requested_by: profile.id,
      });
    } catch (persistErr) {
      console.error("Failed to persist processing advice record:", persistErr);
    }

    // 5. Authoritative Server Audit Log per 27-AUDIT-LOGGING.md
    try {
      const { recordAuditLog } = await import("@/lib/audit/logger");
      await recordAuditLog({
        actorId: profile.id,
        action: "ai.analysis_requested",
        entityType: "ai_analysis",
        entityId: batch.id,
        afterValue: {
          analysis_type: "processing_advice",
          model: modelName,
          waste_batch_code: batch.batch_code,
        },
      });
    } catch (auditErr) {
      console.error("Failed to write audit log for processing advisor:", auditErr);
    }

    return NextResponse.json(advisorResponse);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Unauthorized") || err.message.includes("Active account required")) {
        return NextResponse.json({ error: err.message }, { status: 401 });
      }
      if (err.message.includes("Insufficient permissions")) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
