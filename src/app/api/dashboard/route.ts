import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DashboardData,
  DateRangeOption,
  WasteOverTimePoint,
  WasteBySourcePoint,
  WasteByTypePoint,
  BatchesByStagePoint,
} from "@/data/contracts/dashboard";
import { WasteType, WasteBatchListItem } from "@/data/contracts/waste-batch";
import { LaboratoryTestListItem, LabTestStatus } from "@/data/contracts/laboratory";
import { CANONICAL_PROCESSING_STAGES, BatchStatus } from "@/lib/constants/stages";

const querySchema = z.object({
  dateRange: z.enum(["all", "30d", "7d"]).default("all"),
});

const TYPE_CONFIGS: { type: WasteType; label: string }[] = [
  { type: "mango_peel", label: "Mango Peel" },
  { type: "mango_seed", label: "Mango Seed" },
  { type: "mixed_mango_waste", label: "Mixed Mango Waste" },
];

type RawWasteBatch = {
  id: string;
  batch_code: string;
  waste_type: string;
  source_id: string | null;
  weight_kg: number | string;
  collection_date: string;
  current_status: string;
  created_at: string;
  updated_at: string;
  source?: { name: string } | { name: string }[] | null;
};

type RawLabTest = {
  id: string;
  test_type: string;
  waste_batch_id: string | null;
  product_batch_id: string | null;
  test_date: string | null;
  status: string;
  result_summary: string | null;
  numeric_result: number | string | null;
  result_unit: string | null;
  created_at: string;
  updated_at: string;
  waste_batch?: { batch_code: string } | { batch_code: string }[] | null;
  product_batch?: { batch_code: string } | { batch_code: string }[] | null;
};

export async function GET(request: NextRequest) {
  try {
    await requireMinimumRole("viewer");
    const parsed = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const dateRange: DateRangeOption = parsed.dateRange;
    const supabase = createServerSupabaseClient();

    let dateFrom: string | null = null;
    const now = new Date();
    if (dateRange === "7d") {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    } else if (dateRange === "30d") {
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    }

    // 1. Fetch Waste Batches in scope
    let wasteQuery = supabase
      .from("waste_batches")
      .select(`
        id,
        batch_code,
        waste_type,
        source_id,
        weight_kg,
        collection_date,
        current_status,
        created_at,
        updated_at,
        source:waste_sources(name)
      `)
      .order("collection_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (dateFrom) {
      wasteQuery = wasteQuery.gte("collection_date", dateFrom);
    }

    const { data: wasteData, error: wasteError } = await wasteQuery;
    if (wasteError) throw new Error("Failed to load waste batch metrics.");
    const wasteBatches = (wasteData ?? []) as unknown as RawWasteBatch[];

    // 2. Fetch Product Batches in scope
    let productQuery = supabase
      .from("product_batches")
      .select("id, batch_code, product_name, production_date, status, created_at");

    if (dateFrom) {
      productQuery = productQuery.gte("production_date", dateFrom);
    }

    const { data: productData, error: productError } = await productQuery;
    if (productError) throw new Error("Failed to load product batch metrics.");
    const productBatches = productData ?? [];

    // 3. Fetch Recent Laboratory Activity (top 5, excluding private researcher notes)
    const { data: labData } = await supabase
      .from("laboratory_tests")
      .select(`
        id,
        test_type,
        waste_batch_id,
        product_batch_id,
        test_date,
        status,
        result_summary,
        numeric_result,
        result_unit,
        created_at,
        updated_at,
        waste_batch:waste_batches!laboratory_tests_waste_batch_id_fkey(batch_code),
        product_batch:product_batches!laboratory_tests_product_batch_id_fkey(batch_code)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    const labTests = (labData ?? []) as unknown as RawLabTest[];

    // 4. Calculate Core Metrics deterministically
    let totalWasteKg = 0;
    let completedCount = 0;
    let activeCount = 0;
    let divertedWasteKg = 0;

    const sourceMap: Record<string, number> = {};
    const timeMap: Record<string, { weight: number; count: number }> = {};
    const typeWeights: Record<string, { weight: number; count: number }> = {
      mango_peel: { weight: 0, count: 0 },
      mango_seed: { weight: 0, count: 0 },
      mixed_mango_waste: { weight: 0, count: 0 },
    };
    const stageCounts: Record<string, number> = {};
    CANONICAL_PROCESSING_STAGES.forEach((s) => {
      stageCounts[s.id] = 0;
    });

    wasteBatches.forEach((b) => {
      const weight = Number(b.weight_kg) || 0;
      totalWasteKg += weight;

      if (b.current_status === "completed") {
        completedCount += 1;
      }
      if (b.current_status !== "completed" && b.current_status !== "rejected") {
        activeCount += 1;
      }
      // Waste Diverted: waste entering the system = diverted from disposal per 11-WASTE-TRACEABILITY.md §5
      divertedWasteKg += weight;

      // Waste by Source
      const sourceName = Array.isArray(b.source)
        ? b.source[0]?.name
        : b.source?.name || (b.source_id ? "Unknown Source" : "Unassigned Source");
      sourceMap[sourceName] = (sourceMap[sourceName] || 0) + weight;

      // Waste over Time (by collection_date)
      const cDate = b.collection_date || b.created_at?.split("T")[0] || "Unknown Date";
      if (!timeMap[cDate]) {
        timeMap[cDate] = { weight: 0, count: 0 };
      }
      timeMap[cDate].weight += weight;
      timeMap[cDate].count += 1;

      // Waste by Type
      if (typeWeights[b.waste_type]) {
        typeWeights[b.waste_type].weight += weight;
        typeWeights[b.waste_type].count += 1;
      }

      // Stage Distribution
      if (stageCounts[b.current_status] !== undefined) {
        stageCounts[b.current_status] += 1;
      }
    });

    // 5. Structure Chart Series
    const wasteBySource: WasteBySourcePoint[] = Object.entries(sourceMap).map(
      ([sourceName, weight]) => ({
        sourceName,
        weightKg: Number(weight.toFixed(2)),
        percentage: totalWasteKg > 0 ? Math.round((weight / totalWasteKg) * 100) : 0,
      })
    );

    const wasteOverTime: WasteOverTimePoint[] = Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        weightKg: Number(val.weight.toFixed(2)),
        batchCount: val.count,
      }));

    const wasteByType: WasteByTypePoint[] = TYPE_CONFIGS.map(({ type, label }) => ({
      wasteType: type,
      label,
      weightKg: Number((typeWeights[type]?.weight || 0).toFixed(2)),
      batchCount: typeWeights[type]?.count || 0,
    }));

    const batchesByStage: BatchesByStagePoint[] = CANONICAL_PROCESSING_STAGES.map(
      (stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        count: stageCounts[stage.id] || 0,
      })
    );

    const recentBatches: WasteBatchListItem[] = wasteBatches.slice(0, 5).map((b) => ({
      id: b.id,
      batchCode: b.batch_code,
      wasteType: b.waste_type as WasteType,
      sourceName: Array.isArray(b.source)
        ? b.source[0]?.name
        : b.source?.name || (b.source_id ? "Unknown Source" : "Unassigned Source"),
      weightKg: Number(b.weight_kg) || 0,
      collectionDate: b.collection_date,
      currentStatus: b.current_status as BatchStatus,
      updatedAt: b.updated_at,
    }));

    const recentLabActivity: LaboratoryTestListItem[] = labTests.map((t) => {
      const wb = Array.isArray(t.waste_batch) ? t.waste_batch[0] : t.waste_batch;
      const pb = Array.isArray(t.product_batch) ? t.product_batch[0] : t.product_batch;

      let targetBatchCode = "Unassigned";
      let targetBatchType: "waste" | "product" | "unassigned" = "unassigned";
      let targetBatchId: string | null = null;

      if (t.product_batch_id) {
        targetBatchType = "product";
        targetBatchId = t.product_batch_id;
        targetBatchCode = pb?.batch_code ?? "Product Batch";
      } else if (t.waste_batch_id) {
        targetBatchType = "waste";
        targetBatchId = t.waste_batch_id;
        targetBatchCode = wb?.batch_code ?? "Waste Batch";
      }

      let numericResultFormatted: string | null = null;
      if (t.numeric_result !== null && t.numeric_result !== undefined) {
        numericResultFormatted = t.result_unit
          ? `${t.numeric_result} ${t.result_unit}`
          : `${t.numeric_result}`;
      }

      return {
        id: t.id,
        testType: t.test_type,
        targetBatchCode,
        targetBatchType,
        targetBatchId,
        testDate: t.test_date,
        status: t.status as LabTestStatus,
        numericResultFormatted,
        resultSummary: t.result_summary,
        attachmentCount: 0,
        updatedAt: t.updated_at,
      };
    });

    const responsePayload: DashboardData = {
      metrics: {
        totalWasteCollectedKg: Number(totalWasteKg.toFixed(2)),
        totalWasteProcessedKg: null, // Formula Pending per scientific governance
        totalWasteBatchesCount: wasteBatches.length,
        activeBatchesCount: activeCount,
        completedBatchesCount: completedCount,
        productBatchesCount: productBatches.length,
        divertedWasteKg: Number(divertedWasteKg.toFixed(2)),
        processingEfficiencyRate: null, // Formula Pending per scientific governance
      },
      wasteOverTime,
      wasteBySource,
      wasteByType,
      batchesByStage,
      recentBatches,
      batchesRequiringAttention: [], // Clean empty array; zero invented thresholds
      recentLabActivity,
      aiInsights: {
        title: "AI Sustainability Intelligence",
        summary:
          "Automated valorization efficiency and sustainability insights will be computed once the AI Processing Advisor is connected in Phase B8/B9.",
        keyPoints: [
          "Waste intake chain-of-custody recorded on remote Supabase database.",
          "Deterministic mass metrics calculated in real-time.",
          "Advanced AI optimization models scheduled for activation.",
        ],
        generatedAt: new Date().toISOString(),
        period:
          dateRange === "7d"
            ? "Past 7 Days"
            : dateRange === "30d"
            ? "Past 30 Days"
            : "All Time",
      },
      smartBins: [], // Prototype/simulation only until B11
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    return jsonError(error);
  }
}
