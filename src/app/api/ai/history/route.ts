import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const profile = await requireMinimumRole("viewer");

    let query = supabase
      .from("ai_analysis_records")
      .select(`
        id,
        analysis_type,
        waste_batch_id,
        product_batch_id,
        input_reference,
        prompt_version,
        model,
        input_data,
        output_data,
        status,
        human_reviewed,
        requested_by,
        created_at,
        waste_batches (batch_code),
        product_batches (batch_code),
        profiles:requested_by (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    // If viewer or operator, only show own records unless researcher+
    if (profile.role === "viewer" || profile.role === "operator") {
      query = query.eq("requested_by", profile.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || []).map((row) => {
      const wasteBatch = row.waste_batches as unknown as { batch_code: string } | null;
      const productBatch = row.product_batches as unknown as { batch_code: string } | null;
      const requester = row.profiles as unknown as { full_name: string } | null;

      return {
        id: row.id,
        analysisType: row.analysis_type,
        wasteBatchId: row.waste_batch_id,
        wasteBatchCode: wasteBatch?.batch_code || null,
        productBatchId: row.product_batch_id,
        productBatchCode: productBatch?.batch_code || null,
        inputReference: row.input_reference,
        promptVersion: row.prompt_version,
        model: row.model,
        inputData: row.input_data,
        outputData: row.output_data,
        status: row.status,
        humanReviewed: row.human_reviewed,
        requestedBy: row.requested_by,
        requesterName: requester?.full_name || null,
        createdAt: row.created_at,
        updatedAt: row.created_at,
      };
    });

    return NextResponse.json(items);
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
