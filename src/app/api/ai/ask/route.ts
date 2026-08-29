import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { askMangoCycleQuerySchema } from "@/lib/validators/ai";
import { runAskMangoCycleQuery } from "@/lib/ai/prompts/ask-mangocycle";

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    await requireMinimumRole("viewer");

    const body = await req.json();
    const validation = askMangoCycleQuerySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid question parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { question } = validation.data;
    const answer = await runAskMangoCycleQuery(supabase, question);

    return NextResponse.json(answer);
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
