import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { calculateSustainabilityMetrics } from "@/lib/ai/sustainability/calculator";
import {
  generateSustainabilityNarrative,
  SUSTAINABILITY_PROMPT_VERSION,
} from "@/lib/ai/prompts/sustainability";

const requestSchema = z.object({
  period: z.string().optional().default("all"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const profile = await requireMinimumRole("viewer");

    const body = await req.json().catch(() => ({}));
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { period } = validation.data;

    // 1. Calculate deterministic metrics from database
    const metrics = await calculateSustainabilityMetrics(supabase, period);

    // 2. Generate narrative interpretation with Gemini
    const insightResponse = await generateSustainabilityNarrative(period, metrics);

    // 3. Persist analysis record
    try {
      await supabase.from("ai_analysis_records").insert({
        analysis_type: "sustainability_insights",
        input_reference: period,
        prompt_version: SUSTAINABILITY_PROMPT_VERSION,
        model: insightResponse.model,
        input_data: { period, metrics: metrics as unknown as Record<string, unknown> },
        output_data: insightResponse as unknown as Record<string, unknown>,
        status: "completed",
        human_reviewed: false,
        requested_by: profile.id,
      });
    } catch (persistErr) {
      console.error("Failed to persist sustainability insight record:", persistErr);
    }

    // 4. Authoritative Server Audit Log per 27-AUDIT-LOGGING.md
    try {
      const { recordAuditLog } = await import("@/lib/audit/logger");
      await recordAuditLog({
        actorId: profile.id,
        action: "ai.analysis_requested",
        entityType: "ai_analysis",
        entityId: null,
        afterValue: {
          analysis_type: "sustainability_insights",
          period,
          model: insightResponse.model,
        },
      });
    } catch (auditErr) {
      console.error("Failed to write audit log for sustainability insights:", auditErr);
    }

    return NextResponse.json(insightResponse);
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
