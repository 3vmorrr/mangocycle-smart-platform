import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { generateReportParamsSchema } from "@/lib/validators/report";
import { buildReportData } from "@/lib/reports/builder";
import { generateReportNarrative } from "@/lib/ai/prompts/report-narrator";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const profile = await requireMinimumRole("researcher");

    const body = await req.json();
    const parsed = generateReportParamsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 1. Build deterministic report data & fact registry from database
    const { report, factRegistry } = await buildReportData(supabase, parsed.data, profile);

    // 2. Optional AI Narrative Generation (Gemini 3.6 Flash with Fact Validation)
    if (parsed.data.includeAiNarrative !== false) {
      const narrativeResult = await generateReportNarrative(report, factRegistry);
      report.aiNarrative = {
        summary: narrativeResult.summary,
        bulletPoints: narrativeResult.bulletPoints,
        model: narrativeResult.model,
        generatedAt: narrativeResult.generatedAt,
      };
    }

    // 3. Return canonical ReportData DTO (Stateless On-Demand Response)
    return NextResponse.json(report);
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
      { error: err instanceof Error ? err.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
