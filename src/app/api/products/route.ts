import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { productBatchFormSchema } from "@/lib/validators/product-batch";
import {
  mapProductBatch,
  mapProductBatchListItem,
  mapLinkedWasteBatchSummary,
  DbProductBatchRow,
  DbLinkedWasteRow,
} from "@/lib/products/mapping";
import { LinkedWasteBatchSummary } from "@/data/contracts/product-batch";

const filtersSchema = z.object({
  search: z.string().max(200).default(""),
  status: z.enum(["in_production", "testing", "completed", "released", "rejected", "all"]).default("all"),
  productType: z.string().default("all"),
  labTestingStatus: z.enum(["pending", "in_progress", "passed", "failed", "not_applicable", "all"]).default("all"),
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
      .from("product_batches")
      .select(
        `
        id,
        batch_code,
        product_name,
        product_type,
        production_date,
        quantity_produced,
        unit,
        status,
        lab_testing_status,
        notes,
        created_by,
        created_at,
        updated_at,
        creator:profiles!product_batches_created_by_fkey(full_name)
      `,
        { count: "exact" }
      );

    if (parsed.status !== "all") query = query.eq("status", parsed.status);
    if (parsed.productType !== "all") query = query.eq("product_type", parsed.productType);
    if (parsed.labTestingStatus !== "all") query = query.eq("lab_testing_status", parsed.labTestingStatus);

    const safeSearch = parsed.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(`batch_code.ilike.%${safeSearch}%,product_name.ilike.%${safeSearch}%,product_type.ilike.%${safeSearch}%,notes.ilike.%${safeSearch}%`);
    }

    const { data: batchesData, count, error } = await query
      .order("production_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + parsed.pageSize - 1);

    if (error) throw new Error("Product batch list query failed.");
    const total = count ?? 0;
    const rawBatches = (batchesData ?? []) as unknown as DbProductBatchRow[];

    // Fetch linked waste batch codes for these product batches
    const productIds = rawBatches.map((b) => b.id);
    const linksMap: Record<string, string[]> = {};

    if (productIds.length > 0) {
      const { data: linksData } = await supabase
        .from("product_waste_links")
        .select(`
          product_batch_id,
          waste_batch:waste_batches!product_waste_links_waste_batch_id_fkey(batch_code)
        `)
        .in("product_batch_id", productIds);

      (linksData ?? []).forEach((row) => {
        const pId = row.product_batch_id;
        const wb = Array.isArray(row.waste_batch) ? row.waste_batch[0] : row.waste_batch;
        const code = wb?.batch_code;
        if (!linksMap[pId]) linksMap[pId] = [];
        if (code) linksMap[pId].push(code);
      });
    }

    const items = rawBatches.map((row) =>
      mapProductBatchListItem(row, linksMap[row.id] ?? [])
    );

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
    await requireMinimumRole("researcher");
    const input = productBatchFormSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.rpc("create_product_batch_with_links", {
      p_product_name: input.product_name,
      p_product_type: input.product_type || null,
      p_production_date: input.production_date || null,
      p_quantity_produced: input.quantity_produced ?? null,
      p_unit: input.unit || null,
      p_status: input.status || "in_production",
      p_notes: input.notes || null,
      p_waste_batch_ids: input.waste_batch_ids,
    });

    if (error || !data) {
      throw new Error(error?.message || "Failed to create product batch.");
    }

    const rawCreated = data as unknown as DbProductBatchRow;

    // Fetch linked waste batches
    const { data: linksData } = await supabase
      .from("product_waste_links")
      .select(`
        waste_batch_id,
        waste_batch:waste_batches!product_waste_links_waste_batch_id_fkey(
          id, batch_code, waste_type, source_id, weight_kg, collection_date, current_status,
          source:waste_sources(name)
        )
      `)
      .eq("product_batch_id", rawCreated.id);

    const linkedSummaries = ((linksData ?? []) as unknown as DbLinkedWasteRow[])
      .map(mapLinkedWasteBatchSummary)
      .filter((s): s is LinkedWasteBatchSummary => s !== null);

    return NextResponse.json(
      { product: mapProductBatch(rawCreated, linkedSummaries) },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
