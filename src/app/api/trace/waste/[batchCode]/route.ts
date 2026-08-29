import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/auth/http";
import {
  PublicWasteTraceability,
  PublicStageEvent,
} from "@/data/contracts/traceability";
import { WasteType } from "@/data/contracts/waste-batch";
import {
  CANONICAL_PROCESSING_STAGES,
  STAGE_NAME_MAP,
  BatchStatus,
} from "@/lib/constants/stages";

const WASTE_TYPE_DISPLAY: Record<WasteType, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Mango Waste",
};

const WASTE_CODE_REGEX = /^MW-\d{4}-\d{3}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ batchCode: string }> }
) {
  try {
    const { batchCode: rawParam } = await context.params;
    const rawCode = rawParam?.trim();
    if (!rawCode || !WASTE_CODE_REGEX.test(rawCode)) {
      return NextResponse.json(
        { error: "Invalid waste batch code format. Expected format: MW-YYYY-NNN" },
        { status: 400 }
      );
    }

    const batchCode = rawCode.toUpperCase();
    const supabase = createAdminSupabaseClient();

    // 1. Query Waste Batch by canonical public code
    const { data: batch, error: batchError } = await supabase
      .from("waste_batches")
      .select(`
        id,
        batch_code,
        waste_type,
        weight_kg,
        collection_date,
        location,
        current_status,
        created_at,
        updated_at,
        source:waste_sources(name)
      `)
      .eq("batch_code", batchCode)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: `Waste batch "${batchCode}" not found.` },
        { status: 404 }
      );
    }

    // 2. Query Stage History (chronological, no performed_by or internal notes)
    const { data: historyData } = await supabase
      .from("batch_stage_history")
      .select("stage_name, entered_at")
      .eq("batch_id", batch.id)
      .order("entered_at", { ascending: true });

    // Map stages to canonical timeline
    const stageHistory = historyData ?? [];
    const publicTimeline: PublicStageEvent[] = CANONICAL_PROCESSING_STAGES.map(
      (canonicalStage, index) => {
        const historyMatch = stageHistory.find(
          (h) =>
            h.stage_name?.toLowerCase() === canonicalStage.id.toLowerCase() ||
            h.stage_name?.toLowerCase() === canonicalStage.name.toLowerCase()
        );

        const isCompleted =
          batch.current_status === "completed" ||
          (stageHistory.some(
            (h) =>
              h.stage_name?.toLowerCase() === canonicalStage.id.toLowerCase() ||
              h.stage_name?.toLowerCase() === canonicalStage.name.toLowerCase()
          ) &&
            batch.current_status !== canonicalStage.id);

        const isCurrent = batch.current_status === canonicalStage.id;

        return {
          stageName: canonicalStage.name,
          stageOrder: index + 1,
          enteredAt: historyMatch?.entered_at || batch.created_at,
          isCompleted,
          isCurrent,
        };
      }
    );

    // 3. Query Linked Products (public BF codes only)
    const { data: linkData } = await supabase
      .from("product_waste_links")
      .select("product_batch:product_batches(batch_code)")
      .eq("waste_batch_id", batch.id);

    type RawLinkItem = {
      product_batch: { batch_code: string } | { batch_code: string }[] | null;
    };

    const linkedProductBatchCodes: string[] = [];
    if (linkData) {
      ((linkData as unknown) as RawLinkItem[]).forEach((item) => {
        const pb = Array.isArray(item.product_batch)
          ? item.product_batch[0]
          : item.product_batch;
        if (pb?.batch_code) {
          linkedProductBatchCodes.push(pb.batch_code);
        }
      });
    }

    // Safe Source Name projection (no private contact information)
    const rawSource = batch.source as { name: string } | { name: string }[] | null;
    const sourceName = Array.isArray(rawSource)
      ? rawSource[0]?.name
      : rawSource?.name || "Registered Source";

    const wasteType = batch.waste_type as WasteType;
    const currentStatus = batch.current_status as BatchStatus;
    const currentStatusLabel =
      STAGE_NAME_MAP[batch.current_status] || batch.current_status;

    // 4. Construct Public DTO (Strict Allowlist)
    const publicDto: PublicWasteTraceability = {
      batchCode: batch.batch_code,
      wasteType,
      wasteTypeLabel: WASTE_TYPE_DISPLAY[wasteType] || wasteType,
      sourceName,
      weightKg: Number(batch.weight_kg),
      collectionDate: batch.collection_date,
      location: batch.location || null,
      currentStatus,
      currentStatusLabel,
      timeline: publicTimeline,
      linkedProductBatchCodes,
      linkedProductBatchCode:
        linkedProductBatchCodes.length > 0 ? linkedProductBatchCodes[0] : null,
      sustainability: {
        wasteDivertedKg: Number(batch.weight_kg),
        summary:
          "100% of recorded material diverted from agricultural disposal into circular value recovery.",
      },
      recordTimestamp: batch.updated_at || batch.created_at,
    };

    return NextResponse.json(publicDto);
  } catch (error) {
    return jsonError(error);
  }
}
