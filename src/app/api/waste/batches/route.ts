import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wasteBatchFormSchema } from "@/lib/validators/waste-batch";
import { mapWasteBatch, mapWasteBatchListItem, DbWasteBatchRow } from "@/lib/waste/mapping";
import { BATCH_STATUS_VALUES } from "@/lib/constants/stages";

const filtersSchema = z.object({
  status: z.enum([...BATCH_STATUS_VALUES, "all"] as const).default("all"),
  wasteType: z.enum(["mango_peel", "mango_seed", "mixed_mango_waste", "all"]).default("all"),
  sourceId: z.string().default("all"),
  search: z.string().max(200).default(""),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(request: NextRequest) {
  try {
    await requireMinimumRole("viewer");
    const parsed = filtersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const supabase = createServerSupabaseClient();
    const from = (parsed.page - 1) * parsed.pageSize;

    let query = supabase
      .from("waste_batches")
      .select(
        `
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
        source:waste_sources(name)
      `,
        { count: "exact" }
      );

    if (parsed.status !== "all") query = query.eq("current_status", parsed.status);
    if (parsed.wasteType !== "all") query = query.eq("waste_type", parsed.wasteType);
    if (parsed.sourceId !== "all") query = query.eq("source_id", parsed.sourceId);
    if (parsed.dateFrom) query = query.gte("collection_date", parsed.dateFrom);
    if (parsed.dateTo) query = query.lte("collection_date", parsed.dateTo);

    const safeSearch = parsed.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(`batch_code.ilike.%${safeSearch}%,notes.ilike.%${safeSearch}%,location.ilike.%${safeSearch}%`);
    }

    const { data, count, error } = await query
      .order("collection_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + parsed.pageSize - 1);

    if (error) throw new Error("Waste batch list query failed.");
    const total = count ?? 0;
    const items = ((data ?? []) as unknown as DbWasteBatchRow[]).map(mapWasteBatchListItem);

    return NextResponse.json({
      items,
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: Math.ceil(total / parsed.pageSize) || 1,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("operator");
    const input = wasteBatchFormSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.rpc("create_waste_batch", {
      p_waste_type: input.waste_type,
      p_source_id: input.source_id || null,
      p_weight_kg: input.weight_kg,
      p_collection_date: input.collection_date,
      p_location: input.location || null,
      p_visual_condition: input.visual_condition || null,
      p_moisture_status: input.moisture_status || null,
      p_storage_duration_days: input.storage_duration_days ?? 0,
      p_notes: input.notes || null,
    });

    if (error || !data) {
      throw new Error(error?.message || "Failed to create waste batch.");
    }

    return NextResponse.json({ batch: mapWasteBatch(data as unknown as DbWasteBatchRow) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
