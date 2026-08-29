import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { jsonError, assertSameOrigin } from "@/lib/auth/http";
import { wasteImageUploadSchema } from "@/lib/validators/ai";
import { getMultimodalAIProvider } from "@/lib/ai/provider-factory";
import {
  WASTE_ANALYZER_SYSTEM_PROMPT,
  WASTE_ANALYZER_PROMPT_VERSION,
  buildWasteAnalyzerUserPrompt,
} from "@/lib/ai/prompts/waste-analyzer";
import { validateAndSanitizeWasteAnalysis } from "@/lib/ai/validators/waste-analyzer";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const profile = await requireMinimumRole("operator");

    const body = await request.json();
    const {
      imageName,
      imageSize,
      imageMime,
      imageDataUrl,
      imageBase64: rawBase64,
      wasteBatchId,
    } = body;

    // 1. Validate image metadata
    const validation = wasteImageUploadSchema.safeParse({
      fileSize: imageSize,
      mimeType: imageMime,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid image file parameters." },
        { status: 400 }
      );
    }

    // 2. Extract base64 image data
    let base64Data = rawBase64 || "";
    if (!base64Data && typeof imageDataUrl === "string") {
      const match = imageDataUrl.match(/^data:[^;]+;base64,(.+)$/);
      base64Data = match ? match[1] : imageDataUrl;
    }

    if (!base64Data || typeof base64Data !== "string") {
      return NextResponse.json(
        { error: "Image data is required for visual assessment." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    let wasteBatchContext: { batch_code: string; waste_type: string } | null = null;

    // 3. Validate target Waste Batch if provided
    if (wasteBatchId) {
      const { data: batch, error: batchError } = await supabase
        .from("waste_batches")
        .select("id, batch_code, waste_type")
        .eq("id", wasteBatchId)
        .single();

      if (batchError || !batch) {
        return NextResponse.json(
          { error: "Associated waste batch not found." },
          { status: 404 }
        );
      }
      wasteBatchContext = batch;
    }

    // 4. Call Multimodal AI Provider
    const provider = getMultimodalAIProvider();
    const userPrompt = buildWasteAnalyzerUserPrompt({
      wasteBatchCode: wasteBatchContext?.batch_code,
      wasteTypeHint: wasteBatchContext?.waste_type,
    });

    const aiResult = await provider.analyzeImage({
      systemPrompt: WASTE_ANALYZER_SYSTEM_PROMPT,
      userPrompt,
      imageMimeType: imageMime,
      imageBase64: base64Data,
    });

    // 5. Validate structured response & enforce deterministic scientific safety rules
    const structuredAnalysis = validateAndSanitizeWasteAnalysis(
      aiResult.rawContent,
      aiResult.model
    );

    // 6. Persist AI Analysis Record in public.ai_analysis_records
    await supabase.from("ai_analysis_records").insert({
      analysis_type: "visual_assessment",
      waste_batch_id: wasteBatchId || null,
      input_reference: imageName || "upload.jpg",
      prompt_version: WASTE_ANALYZER_PROMPT_VERSION,
      model: aiResult.model,
      input_data: {
        imageName,
        imageSize,
        imageMime,
        wasteBatchCode: wasteBatchContext?.batch_code || null,
      },
      output_data: structuredAnalysis as unknown as Record<string, unknown>,
      status: "completed",
      human_reviewed: false,
      requested_by: profile.id,
    });

    // 7. Authoritative Server Audit Log per 27-AUDIT-LOGGING.md (no raw image or prompts logged)
    const { recordAuditLog } = await import("@/lib/audit/logger");
    await recordAuditLog({
      actorId: profile.id,
      action: "ai.analysis_requested",
      entityType: "ai_analysis",
      entityId: wasteBatchId || null,
      afterValue: {
        analysis_type: "visual_assessment",
        model: aiResult.model,
        waste_batch_code: wasteBatchContext?.batch_code || null,
      },
    });

    return NextResponse.json(structuredAnalysis);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("AI provider")) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return jsonError(error);
  }
}
