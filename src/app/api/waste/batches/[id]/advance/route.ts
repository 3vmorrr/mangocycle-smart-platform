import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stageAdvanceSchema } from "@/lib/validators/waste-batch";
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
    const input = stageAdvanceSchema.parse(body);

    const supabase = createServerSupabaseClient();

    // Resolve UUID if batch_code passed
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

    const { data: advanced, error: advanceError } = await supabase.rpc(
      "advance_waste_batch_stage",
      {
        p_batch_id: batchId,
        p_notes: input.notes || null,
      }
    );

    if (advanceError || !advanced) {
      throw new Error(advanceError?.message || "Failed to advance stage.");
    }

    // Fetch full enriched batch with relations
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
