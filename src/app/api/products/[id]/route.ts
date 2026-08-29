import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { productBatchFormSchema } from "@/lib/validators/product-batch";
import {
  mapProductBatch,
  mapLinkedWasteBatchSummary,
  DbProductBatchRow,
  DbLinkedWasteRow,
} from "@/lib/products/mapping";
import { LinkedWasteBatchSummary } from "@/data/contracts/product-batch";

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

    let query = supabase
      .from("product_batches")
      .select(`
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
      `);

    if (isUuid(idOrCode)) {
      query = query.eq("id", idOrCode);
    } else {
      query = query.ilike("batch_code", idOrCode);
    }

    const { data: batchData, error: batchError } = await query.single();

    if (batchError || !batchData) {
      return NextResponse.json({ error: `Product batch "${idOrCode}" not found.` }, { status: 404 });
    }

    const rawBatch = batchData as unknown as DbProductBatchRow;

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
      .eq("product_batch_id", rawBatch.id);

    const linkedSummaries = ((linksData ?? []) as unknown as DbLinkedWasteRow[])
      .map(mapLinkedWasteBatchSummary)
      .filter((s): s is LinkedWasteBatchSummary => s !== null);

    return NextResponse.json({ product: mapProductBatch(rawBatch, linkedSummaries) });
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
    await requireMinimumRole("researcher");
    const { id: idOrCode } = await context.params;
    const body = await request.json();
    const updateInput = productBatchFormSchema.partial().parse(body);

    const supabase = createServerSupabaseClient();

    // Resolve UUID if batch_code passed
    let productId = idOrCode;
    if (!isUuid(idOrCode)) {
      const { data: found } = await supabase
        .from("product_batches")
        .select("id")
        .ilike("batch_code", idOrCode)
        .single();
      if (!found) {
        return NextResponse.json({ error: "Product batch not found." }, { status: 404 });
      }
      productId = found.id;
    }

    const { data: updated, error: updateError } = await supabase.rpc(
      "update_product_batch_with_links",
      {
        p_product_id: productId,
        p_product_name: updateInput.product_name || null,
        p_product_type: updateInput.product_type || null,
        p_production_date: updateInput.production_date || null,
        p_quantity_produced: updateInput.quantity_produced ?? null,
        p_unit: updateInput.unit || null,
        p_status: updateInput.status || null,
        p_lab_testing_status: typeof body?.lab_testing_status === "string" ? body.lab_testing_status : null,
        p_notes: updateInput.notes || null,
        p_waste_batch_ids: updateInput.waste_batch_ids || null,
      }
    );

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to update product batch.");
    }

    // Fetch full enriched product with creator and links
    const { data: fullProduct, error: fetchError } = await supabase
      .from("product_batches")
      .select(`
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
      `)
      .eq("id", productId)
      .single();

    if (fetchError || !fullProduct) {
      throw new Error("Failed to load updated product details.");
    }

    const { data: linksData } = await supabase
      .from("product_waste_links")
      .select(`
        waste_batch_id,
        waste_batch:waste_batches!product_waste_links_waste_batch_id_fkey(
          id, batch_code, waste_type, source_id, weight_kg, collection_date, current_status,
          source:waste_sources(name)
        )
      `)
      .eq("product_batch_id", productId);

    const linkedSummaries = ((linksData ?? []) as unknown as DbLinkedWasteRow[])
      .map(mapLinkedWasteBatchSummary)
      .filter((s): s is LinkedWasteBatchSummary => s !== null);

    return NextResponse.json({
      product: mapProductBatch(fullProduct as unknown as DbProductBatchRow, linkedSummaries),
    });
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

    let query = supabase.from("product_batches").delete();
    if (isUuid(idOrCode)) {
      query = query.eq("id", idOrCode);
    } else {
      query = query.ilike("batch_code", idOrCode);
    }

    const { error } = await query;
    if (error) throw new Error(error.message || "Failed to delete product batch.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
