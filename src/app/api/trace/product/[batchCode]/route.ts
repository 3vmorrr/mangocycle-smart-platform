import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/auth/http";
import {
  PublicProductTraceability,
  PublicProductWasteSource,
} from "@/data/contracts/traceability";
import { WasteType } from "@/data/contracts/waste-batch";
import { ProductStatus, LabTestingStatus } from "@/data/contracts/product-batch";
import { STAGE_NAME_MAP, BatchStatus } from "@/lib/constants/stages";

const WASTE_TYPE_DISPLAY: Record<WasteType, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Mango Waste",
};

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  in_production: "In Production",
  testing: "Laboratory Testing",
  completed: "Completed",
  released: "Released for Distribution",
  rejected: "Rejected",
};

const LAB_STATUS_LABELS: Record<LabTestingStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  passed: "Passed",
  failed: "Failed",
  not_applicable: "Not Applicable",
};

const PRODUCT_CODE_REGEX = /^BF-\d{4}-\d{3}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ batchCode: string }> }
) {
  try {
    const { batchCode: rawParam } = await context.params;
    const rawCode = rawParam?.trim();
    if (!rawCode || !PRODUCT_CODE_REGEX.test(rawCode)) {
      return NextResponse.json(
        { error: "Invalid product batch code format. Expected format: BF-YYYY-NNN" },
        { status: 400 }
      );
    }

    const batchCode = rawCode.toUpperCase();
    const supabase = createAdminSupabaseClient();

    // 1. Query Product Batch by canonical public code
    const { data: product, error: productError } = await supabase
      .from("product_batches")
      .select(`
        id,
        batch_code,
        product_name,
        product_type,
        production_date,
        status,
        lab_testing_status,
        created_at,
        updated_at
      `)
      .eq("batch_code", batchCode)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: `Product batch "${batchCode}" not found.` },
        { status: 404 }
      );
    }

    // 2. Query Linked Waste Batches via product_waste_links
    const { data: linkData } = await supabase
      .from("product_waste_links")
      .select(`
        waste_batch:waste_batches(
          id,
          batch_code,
          waste_type,
          weight_kg,
          collection_date,
          current_status,
          source:waste_sources(name)
        )
      `)
      .eq("product_batch_id", product.id);

    type RawProductWasteLink = {
      waste_batch: {
        id: string;
        batch_code: string;
        waste_type: string;
        weight_kg: number | string;
        collection_date: string | null;
        current_status: string;
        source: { name: string } | { name: string }[] | null;
      } | {
        id: string;
        batch_code: string;
        waste_type: string;
        weight_kg: number | string;
        collection_date: string | null;
        current_status: string;
        source: { name: string } | { name: string }[] | null;
      }[] | null;
    };

    const sourceWasteBatches: PublicProductWasteSource[] = [];
    if (linkData) {
      ((linkData as unknown) as RawProductWasteLink[]).forEach((item) => {
        const wb = Array.isArray(item.waste_batch)
          ? item.waste_batch[0]
          : item.waste_batch;
        if (wb && wb.batch_code) {
          const wasteType = (wb.waste_type || "mango_peel") as WasteType;
          const currentStatus = (wb.current_status || "completed") as BatchStatus;
          const rawSource = wb.source as { name: string } | { name: string }[] | null;
          const sourceName = Array.isArray(rawSource)
            ? rawSource[0]?.name
            : rawSource?.name || "Registered Source";

          sourceWasteBatches.push({
            batchCode: wb.batch_code,
            wasteType,
            wasteTypeLabel: WASTE_TYPE_DISPLAY[wasteType] || wasteType,
            sourceName,
            weightKg: Number(wb.weight_kg) || 0,
            collectionDate: wb.collection_date || "",
            currentStatus,
            currentStatusLabel: STAGE_NAME_MAP[currentStatus] || currentStatus,
            traceUrl: `/trace/waste/${wb.batch_code}`,
          });
        }
      });
    }

    const totalWasteUsedKg = sourceWasteBatches.reduce(
      (acc, wb) => acc + wb.weightKg,
      0
    );
    const distinctSources = new Set(sourceWasteBatches.map((wb) => wb.sourceName));

    const processingJourneySummary = [
      "Waste Collection & Registration",
      "Sorting & Quality Inspection",
      "Washing & Preparation",
      "Drying & Moisture Control",
      "Grinding to Particle Matrix",
      "Biological Extraction",
      "Formulation & Synthesis",
      "Laboratory Quality Testing",
      "Batch Traceability Completion",
    ];

    const status = product.status as ProductStatus;
    const labTestingStatus = (product.lab_testing_status || "pending") as LabTestingStatus;

    // 3. Construct Public DTO (Strict Allowlist, Fail Closed on commercial quantity/unit)
    const publicDto: PublicProductTraceability = {
      batchCode: product.batch_code,
      productName: product.product_name,
      productType: product.product_type || null,
      productionDate: product.production_date || null,
      quantityProduced: null, // Fail-closed per 12-PRODUCT-TRACEABILITY.md §5.5 & open decision
      unit: null, // Fail-closed per 12-PRODUCT-TRACEABILITY.md §5.5 & open decision
      status,
      statusLabel: PRODUCT_STATUS_LABELS[status] || status,
      labTestingStatus,
      labTestingStatusLabel: LAB_STATUS_LABELS[labTestingStatus] || labTestingStatus,
      sourceWasteBatches,
      totalWasteUsedKg: Number(totalWasteUsedKg.toFixed(2)),
      processingJourneySummary,
      sustainability: {
        totalWasteDivertedKg: Number(totalWasteUsedKg.toFixed(2)),
        sourceCount: distinctSources.size,
        summary: `Formulated from ${sourceWasteBatches.length} recorded agricultural waste batch(es), diverting ${totalWasteUsedKg.toFixed(2)} kg of organic waste into bio-based products.`,
      },
      recordTimestamp: product.updated_at || product.created_at,
    };

    return NextResponse.json(publicDto);
  } catch (error) {
    return jsonError(error);
  }
}
