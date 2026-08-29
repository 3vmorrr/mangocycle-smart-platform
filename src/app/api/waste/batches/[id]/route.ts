import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wasteBatchFormSchema } from "@/lib/validators/waste-batch";
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireMinimumRole("viewer");
    const { id: idOrCode } = await context.params;
    const supabase = createServerSupabaseClient();

    let batchQuery = supabase
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
      `);

    if (isUuid(idOrCode)) {
      batchQuery = batchQuery.eq("id", idOrCode);
    } else {
      batchQuery = batchQuery.ilike("batch_code", idOrCode);
    }

    const { data: batchData, error: batchError } = await batchQuery.single();

    if (batchError || !batchData) {
      return NextResponse.json({ error: `Waste batch "${idOrCode}" not found.` }, { status: 404 });
    }

    const rawBatch = batchData as unknown as DbWasteBatchRow;

    // Load stage history for this batch
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
      .eq("batch_id", rawBatch.id)
      .order("entered_at", { ascending: true })
      .order("created_at", { ascending: true });

    const stageHistory = ((historyData ?? []) as unknown as DbStageHistoryRow[]).map((row) =>
      mapStageHistory(row, stageOrderMap)
    );

    return NextResponse.json({ batch: mapWasteBatch(rawBatch, stageHistory) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("operator");
    const { id: idOrCode } = await context.params;
    const body = await request.json();
    const updateInput = wasteBatchFormSchema.partial().parse(body);

    const supabase = createServerSupabaseClient();

    // Verify batch exists and is not completed or rejected
    let lookupQuery = supabase.from("waste_batches").select("id,current_status");
    if (isUuid(idOrCode)) {
      lookupQuery = lookupQuery.eq("id", idOrCode);
    } else {
      lookupQuery = lookupQuery.ilike("batch_code", idOrCode);
    }
    const { data: existing, error: lookupError } = await lookupQuery.single();
    if (lookupError || !existing) {
      return NextResponse.json({ error: "Waste batch not found." }, { status: 404 });
    }

    if (existing.current_status === "completed" || existing.current_status === "rejected") {
      return NextResponse.json(
        { error: "Cannot modify a completed or rejected batch." },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {};
    if (updateInput.waste_type !== undefined) payload.waste_type = updateInput.waste_type;
    if (updateInput.source_id !== undefined) payload.source_id = updateInput.source_id || null;
    if (updateInput.weight_kg !== undefined) payload.weight_kg = updateInput.weight_kg;
    if (updateInput.collection_date !== undefined) payload.collection_date = updateInput.collection_date;
    if (updateInput.location !== undefined) payload.location = updateInput.location || null;
    if (updateInput.visual_condition !== undefined) payload.visual_condition = updateInput.visual_condition || null;
    if (updateInput.moisture_status !== undefined) payload.moisture_status = updateInput.moisture_status || null;
    if (updateInput.storage_duration_days !== undefined) payload.storage_duration_days = updateInput.storage_duration_days ?? 0;
    if (updateInput.notes !== undefined) payload.notes = updateInput.notes || null;
    payload.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("waste_batches")
      .update(payload)
      .eq("id", existing.id)
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
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to update waste batch.");
    }

    // Load history
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
      .eq("batch_id", existing.id)
      .order("entered_at", { ascending: true })
      .order("created_at", { ascending: true });

    const stageHistory = ((historyData ?? []) as unknown as DbStageHistoryRow[]).map((row) =>
      mapStageHistory(row, stageOrderMap)
    );

    return NextResponse.json({ batch: mapWasteBatch(updated as unknown as DbWasteBatchRow, stageHistory) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("admin");
    const { id: idOrCode } = await context.params;
    const supabase = createServerSupabaseClient();

    let query = supabase.from("waste_batches").delete();
    if (isUuid(idOrCode)) {
      query = query.eq("id", idOrCode);
    } else {
      query = query.ilike("batch_code", idOrCode);
    }

    const { error } = await query;
    if (error) throw new Error(error.message || "Failed to delete waste batch.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
