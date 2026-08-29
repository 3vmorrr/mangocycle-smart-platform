import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  mapWasteBatch,
  mapStageHistory,
  DbWasteBatchRow,
  DbStageHistoryRow,
} from "@/lib/waste/mapping";
import { CANONICAL_PROCESSING_STAGES } from "@/lib/constants/stages";

const stageOrderMap: Record<string, number> = {};
CANONICAL_PROCESSING_STAGES.forEach((s) => {
  stageOrderMap[s.id.toLowerCase()] = s.stageOrder;
  stageOrderMap[s.name.toLowerCase()] = s.stageOrder;
});

const rejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(1000, "Reason cannot exceed 1,000 characters"),
  notes: z.string().max(1000).nullable().optional(),
});

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("operator");
    const { id: idOrCode } = await context.params;
    const body = await request.json().catch(() => ({}));
    const input = rejectSchema.parse(body);

    const supabase = createServerSupabaseClient();

    let batchId = idOrCode;
    if (!isUuid(idOrCode)) {
      const { data: found } = await supabase
        .from("waste_batches")
        .select("id")
        .ilike("batch_code", idOrCode)
        .single();
      if (!found) {
        return NextResponse.json({ error: "Waste batch not found." }, { status: 404 });
      }
      batchId = found.id;
    }

    const { data: rejected, error: rejectError } = await supabase.rpc(
      "reject_waste_batch",
      {
        p_batch_id: batchId,
        p_reason: input.reason,
        p_notes: input.notes || null,
      }
    );

    if (rejectError || !rejected) {
      throw new Error(rejectError?.message || "Failed to reject batch.");
    }

    const { data: fullBatch, error: fetchError } = await supabase
      .from("waste_batches")
      .select(`
        id,
        batch_code,
        waste_type,
        source_id,
        weight_kg,
        collection_date,
        location,
        visual_condition,
        moisture_status,
        storage_duration_days,
        notes,
        current_status,
        created_by,
        created_at,
        updated_at,
        source:waste_sources(name),
        creator:profiles!waste_batches_created_by_fkey(full_name)
      `)
      .eq("id", batchId)
      .single();

    if (fetchError || !fullBatch) {
      throw new Error("Failed to load updated batch details.");
    }

    const { data: historyData } = await supabase
      .from("batch_stage_history")
      .select(`
        id,
        batch_id,
        stage_name,
        entered_at,
        notes,
        performed_by,
        created_at,
        performer:profiles!batch_stage_history_performed_by_fkey(full_name)
      `)
      .eq("batch_id", batchId)
      .order("entered_at", { ascending: true })
      .order("created_at", { ascending: true });

    const stageHistory = ((historyData ?? []) as unknown as DbStageHistoryRow[]).map((row) =>
      mapStageHistory(row, stageOrderMap)
    );

    return NextResponse.json({
      batch: mapWasteBatch(fullBatch as unknown as DbWasteBatchRow, stageHistory),
    });
  } catch (error) {
    return jsonError(error);
  }
}
