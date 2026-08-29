import { SupabaseClient } from "@supabase/supabase-js";
import {
  ReportParameters,
  ReportData,
  ReportMetadata,
  ReportKPI,
  WasteReportRow,
  ProductReportRow,
  LabReportRow,
  ReportChartPoint,
  ReportType,
} from "@/data/contracts/report";
import { WasteType } from "@/data/contracts/waste-batch";
import { UserProfile } from "@/data/contracts/auth";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  waste_summary: "Monthly Waste Management Report",
  sustainability: "Sustainability & Circular Impact Report",
  product_traceability: "Product Traceability & Formulation Report",
  laboratory_summary: "Laboratory Testing Summary Report",
  batch_report: "Waste Batch Lifecycle Report",
};

export const WASTE_TYPE_DISPLAY: Record<WasteType, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed / Kernel",
  mixed_mango_waste: "Mixed Mango Byproducts",
};

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_production: "In Production",
  completed: "Completed",
  quarantine: "In Quarantine",
  released: "Released for Distribution",
};

export const LAB_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Testing",
  passed: "Workflow Status: Passed",
  failed: "Workflow Status: Failed",
  not_required: "Not Required",
};

export interface AuthorizedFact {
  metric: string;
  value: number | string | null;
  unit?: string;
  isAllowed: boolean;
  allowedContexts: string[];
}

export interface ReportFactRegistry {
  facts: Record<string, AuthorizedFact>;
}

export async function buildReportData(
  supabase: SupabaseClient,
  params: ReportParameters,
  caller: UserProfile
): Promise<{ report: ReportData; factRegistry: ReportFactRegistry }> {
  const generatedAt = new Date().toISOString();
  const id = `rep-${Date.now()}`;
  const typeLabel = REPORT_TYPE_LABELS[params.reportType] || params.reportType;

  // 1. Build Period Label
  let periodLabel = "All Recorded Time";
  if (params.startDate && params.endDate) {
    periodLabel = `${params.startDate} to ${params.endDate}`;
  } else if (params.startDate) {
    periodLabel = `Since ${params.startDate}`;
  } else if (params.endDate) {
    periodLabel = `Up to ${params.endDate}`;
  }

  const metadata: ReportMetadata = {
    id,
    title: `${typeLabel} — ${periodLabel}`,
    reportType: params.reportType,
    reportTypeLabel: typeLabel,
    generatedAt,
    periodLabel,
    startDate: params.startDate || null,
    endDate: params.endDate || null,
    generatedByName: caller.fullName || "Authorized Researcher",
    isDemoData: false,
  };

  const kpis: ReportKPI[] = [];
  const methodNotes: string[] = [
    "Report generated on-demand from deterministic MangoCycle database repositories without manual value overrides.",
    "Total Waste Processed formula, Processing Rate, and Biological Yield ratio are currently awaiting authoritative definition by the scientific team and are omitted.",
    "Date-filtered reporting intervals match strictly on recorded controlling dates (collection_date for waste, production_date for products, test_date for lab assays). Records missing a controlling date are excluded from specific interval queries.",
  ];

  const facts: Record<string, AuthorizedFact> = {
    totalWasteProcessedKg: { metric: "totalWasteProcessedKg", value: null, isAllowed: false, allowedContexts: [] },
    processingRatePct: { metric: "processingRatePct", value: null, isAllowed: false, allowedContexts: [] },
    biologicalYieldPct: { metric: "biologicalYieldPct", value: null, isAllowed: false, allowedContexts: [] },
  };

  let wasteRows: WasteReportRow[] | undefined;
  let productRows: ProductReportRow[] | undefined;
  let labRows: LabReportRow[] | undefined;
  let distributionByType: ReportChartPoint[] | undefined;
  let distributionBySource: ReportChartPoint[] | undefined;

  // ==========================================
  // TYPE 1: WASTE SUMMARY & TYPE 2: SUSTAINABILITY
  // ==========================================
  if (params.reportType === "waste_summary" || params.reportType === "sustainability") {
    let wasteQuery = supabase
      .from("waste_batches")
      .select(`
        id,
        batch_code,
        waste_type,
        weight_kg,
        collection_date,
        current_status,
        waste_sources (name, source_type, location)
      `)
      .order("collection_date", { ascending: false });

    if (params.startDate) {
      wasteQuery = wasteQuery.gte("collection_date", params.startDate);
    }
    if (params.endDate) {
      wasteQuery = wasteQuery.lte("collection_date", params.endDate);
    }

    const { data: rawWaste, error: wasteErr } = await wasteQuery;
    if (wasteErr) throw new Error(`Failed to query waste batches: ${wasteErr.message}`);

    const batches = rawWaste || [];

    // CANONICAL B6.1 Waste Diverted Semantics:
    // SUM intake weight_kg of ALL batches in scope, INCLUDING rejected batches.
    const totalDivertedKg = Number(
      batches.reduce((sum, b) => sum + Number(b.weight_kg || 0), 0).toFixed(2)
    );
    const completedBatches = batches.filter((b) => b.current_status === "completed").length;
    const activeBatches = batches.filter(
      (b) => b.current_status !== "completed" && b.current_status !== "rejected"
    ).length;

    kpis.push(
      {
        label: "Total Waste Diverted",
        value: totalDivertedKg,
        unit: "kg",
        subtext: "Total intake mass diverted from disposal (including rejected lots)",
      },
      {
        label: "Intake Batches",
        value: batches.length,
        subtext: "Recorded agricultural waste lots in scope",
      },
      {
        label: "Completed Lifecycles",
        value: completedBatches,
        subtext: "Fully processed batches",
      },
      {
        label: "Active in Pipeline",
        value: activeBatches,
        subtext: "Intermediate processing lots",
      }
    );

    facts.totalWasteDivertedKg = {
      metric: "totalWasteDivertedKg",
      value: totalDivertedKg,
      unit: "kg",
      isAllowed: true,
      allowedContexts: ["waste diverted", "intake mass", "collected waste"],
    };
    facts.intakeBatches = {
      metric: "intakeBatches",
      value: batches.length,
      unit: "count",
      isAllowed: true,
      allowedContexts: ["intake batches", "recorded lots", "waste batches"],
    };
    facts.completedLifecycles = {
      metric: "completedLifecycles",
      value: completedBatches,
      unit: "count",
      isAllowed: true,
      allowedContexts: ["completed batches", "processed lifecycles"],
    };
    facts.activeBatches = {
      metric: "activeBatches",
      value: activeBatches,
      unit: "count",
      isAllowed: true,
      allowedContexts: ["active batches", "in processing", "pipeline lots"],
    };

    wasteRows = batches.map((b) => {
      const src = b.waste_sources as unknown as { name?: string } | null;
      return {
        batchCode: b.batch_code,
        wasteType: b.waste_type,
        wasteTypeLabel: WASTE_TYPE_DISPLAY[b.waste_type as WasteType] || b.waste_type,
        sourceName: src?.name || "Unassigned Source",
        weightKg: Number(b.weight_kg || 0),
        collectionDate: b.collection_date,
        currentStatus: b.current_status,
        currentStatusLabel: b.current_status,
        stageCount: 1,
      };
    });

    // Distributions
    const typeTotals: Record<string, number> = {};
    const sourceTotals: Record<string, number> = {};

    batches.forEach((b) => {
      const src = b.waste_sources as unknown as { name?: string } | null;
      const srcName = src?.name || "Other / Unassigned";
      const w = Number(b.weight_kg || 0);

      typeTotals[b.waste_type] = (typeTotals[b.waste_type] || 0) + w;
      sourceTotals[srcName] = (sourceTotals[srcName] || 0) + w;
    });

    distributionByType = Object.entries(typeTotals).map(([type, weight]) => ({
      name: WASTE_TYPE_DISPLAY[type as WasteType] || type,
      value: Number(weight.toFixed(2)),
    }));

    distributionBySource = Object.entries(sourceTotals).map(([name, weight]) => ({
      name,
      value: Number(weight.toFixed(2)),
    }));
  }

  // ==========================================
  // TYPE 3: PRODUCT TRACEABILITY (OR SUSTAINABILITY)
  // ==========================================
  if (params.reportType === "product_traceability" || params.reportType === "sustainability") {
    let productQuery = supabase
      .from("product_batches")
      .select(`
        id,
        batch_code,
        product_name,
        product_type,
        quantity_produced,
        unit,
        status,
        production_date,
        lab_testing_status,
        product_waste_links (
          waste_batches (batch_code)
        )
      `)
      .order("created_at", { ascending: false });

    if (params.startDate) {
      productQuery = productQuery.gte("production_date", params.startDate);
    }
    if (params.endDate) {
      productQuery = productQuery.lte("production_date", params.endDate);
    }
    if (params.productBatchId) {
      productQuery = productQuery.eq("id", params.productBatchId);
    }

    const { data: rawProducts, error: prodErr } = await productQuery;
    if (prodErr) throw new Error(`Failed to query products: ${prodErr.message}`);

    const products = rawProducts || [];
    const passedLabTestingCount = products.filter((p) => p.lab_testing_status === "passed").length;

    let totalLinkedWasteBatchesCount = 0;
    productRows = products.map((p) => {
      const links = (p.product_waste_links as unknown as Array<{ waste_batches?: { batch_code?: string } }>) || [];
      const wasteCodes = links.map((l) => l.waste_batches?.batch_code || "").filter(Boolean);
      totalLinkedWasteBatchesCount += wasteCodes.length;

      return {
        batchCode: p.batch_code,
        productName: p.product_name,
        productType: p.product_type || null,
        productionDate: p.production_date || null,
        quantityProduced: p.quantity_produced !== null ? Number(p.quantity_produced) : null,
        unit: p.unit || null,
        status: p.status,
        statusLabel: PRODUCT_STATUS_LABELS[p.status] || p.status,
        labTestingStatus: p.lab_testing_status || "pending",
        labTestingStatusLabel: LAB_STATUS_LABELS[p.lab_testing_status || "pending"] || (p.lab_testing_status || "Pending"),
        linkedWasteCount: wasteCodes.length,
        linkedWasteCodes: wasteCodes,
      };
    });

    if (params.reportType === "product_traceability") {
      kpis.push(
        {
          label: "Product Batches",
          value: products.length,
          subtext: "Finished bio-formulations in scope",
        },
        {
          label: "Passed Lab Testing",
          value: passedLabTestingCount,
          subtext: "Batches with recorded lab_testing_status = passed",
        },
        {
          label: "Upstream Waste Batches",
          value: totalLinkedWasteBatchesCount,
          subtext: "Linked agricultural waste inputs",
        }
      );

      facts.productBatchesCount = {
        metric: "productBatchesCount",
        value: products.length,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["product batches", "bio-formulations"],
      };
      facts.passedLabTestingCount = {
        metric: "passedLabTestingCount",
        value: passedLabTestingCount,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["passed lab testing", "tested batches"],
      };
      facts.totalLinkedWasteBatchesCount = {
        metric: "totalLinkedWasteBatchesCount",
        value: totalLinkedWasteBatchesCount,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["upstream waste batches", "linked waste lots"],
      };
    }
  }

  // ==========================================
  // TYPE 4: LABORATORY SUMMARY
  // ==========================================
  if (params.reportType === "laboratory_summary") {
    let labQuery = supabase
      .from("laboratory_tests")
      .select(`
        id,
        test_type,
        status,
        test_date,
        numeric_result,
        result_unit,
        result_summary,
        waste_batches (batch_code),
        product_batches (batch_code)
      `)
      .order("created_at", { ascending: false });

    if (params.startDate) {
      labQuery = labQuery.gte("test_date", params.startDate);
    }
    if (params.endDate) {
      labQuery = labQuery.lte("test_date", params.endDate);
    }

    const { data: rawLab, error: labErr } = await labQuery;
    if (labErr) throw new Error(`Failed to query laboratory tests: ${labErr.message}`);

    const labTests = rawLab || [];
    const completedAssays = labTests.filter((t) => t.status === "completed").length;
    const inProgressAssays = labTests.filter((t) => t.status === "in_progress").length;

    kpis.push(
      {
        label: "Laboratory Assays",
        value: labTests.length,
        subtext: "Recorded analytical assays in scope",
      },
      {
        label: "Completed Assays",
        value: completedAssays,
        subtext: "Concluded characterization protocols",
      },
      {
        label: "In Progress",
        value: inProgressAssays,
        subtext: "Active laboratory assays",
      }
    );

    facts.totalLabAssays = {
      metric: "totalLabAssays",
      value: labTests.length,
      unit: "count",
      isAllowed: true,
      allowedContexts: ["laboratory assays", "analytical tests"],
    };
    facts.completedAssays = {
      metric: "completedAssays",
      value: completedAssays,
      unit: "count",
      isAllowed: true,
      allowedContexts: ["completed assays", "finished tests"],
    };

    labRows = labTests.map((t) => {
      const waste = t.waste_batches as unknown as { batch_code?: string } | null;
      const prod = t.product_batches as unknown as { batch_code?: string } | null;
      const targetCode = prod?.batch_code || waste?.batch_code || "Unassigned Target";
      const targetType: "waste" | "product" | "unassigned" = prod?.batch_code
        ? "product"
        : waste?.batch_code
        ? "waste"
        : "unassigned";

      return {
        testType: t.test_type,
        targetBatchCode: targetCode,
        targetBatchType: targetType,
        testDate: t.test_date || null,
        status: t.status,
        numericResultFormatted:
          t.numeric_result !== null && t.numeric_result !== undefined
            ? `${t.numeric_result} ${t.result_unit || ""}`.trim()
            : null,
        resultSummary: t.result_summary || null,
      };
    });

    methodNotes.push(
      "Confidential internal researcher methodology notes and raw binary spectrometer spectrum attachments are excluded from standard reports."
    );
    methodNotes.push(
      "Laboratory testing status reflects recorded platform workflow state ('passed' status) and does not constitute independent scientific certification or efficacy guarantee."
    );
  }

  // ==========================================
  // TYPE 5: SINGLE BATCH REPORT
  // ==========================================
  if (params.reportType === "batch_report") {
    let batchQuery = supabase
      .from("waste_batches")
      .select(`
        id,
        batch_code,
        waste_type,
        weight_kg,
        collection_date,
        current_status,
        moisture_status,
        visual_condition,
        waste_sources (name, source_type, location),
        batch_stage_history (stage_name, entered_at)
      `);

    if (params.wasteBatchId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.wasteBatchId.trim());
      if (isUuid) {
        batchQuery = batchQuery.eq("id", params.wasteBatchId.trim());
      } else {
        batchQuery = batchQuery.eq("batch_code", params.wasteBatchId.trim());
      }
    } else {
      batchQuery = batchQuery.limit(1);
    }

    const { data: rawSingle, error: singleErr } = await batchQuery;
    if (singleErr) throw new Error(`Failed to query waste batch: ${singleErr.message}`);

    const targetBatch = rawSingle?.[0];
    if (targetBatch) {
      const src = targetBatch.waste_sources as unknown as { name?: string } | null;
      const weightKg = Number(targetBatch.weight_kg || 0);

      kpis.push(
        {
          label: "Batch Code",
          value: targetBatch.batch_code,
          subtext: "Intake Identifier",
        },
        {
          label: "Recorded Mass",
          value: weightKg,
          unit: "kg",
          subtext: "Intake weight diverted from disposal",
        },
        {
          label: "Current Stage",
          value: targetBatch.current_status,
          subtext: "Lifecycle Status",
        },
        {
          label: "Intake Date",
          value: targetBatch.collection_date,
          subtext: "Registered on",
        }
      );

      facts.batchWeightKg = {
        metric: "batchWeightKg",
        value: weightKg,
        unit: "kg",
        isAllowed: true,
        allowedContexts: ["recorded mass", "intake weight", "batch weight"],
      };

      const history = (targetBatch.batch_stage_history as unknown as Array<{ stage: string; entered_at: string }>) || [];

      wasteRows = [
        {
          batchCode: targetBatch.batch_code,
          wasteType: targetBatch.waste_type,
          wasteTypeLabel: WASTE_TYPE_DISPLAY[targetBatch.waste_type as WasteType] || targetBatch.waste_type,
          sourceName: src?.name || "Unassigned",
          weightKg,
          collectionDate: targetBatch.collection_date,
          currentStatus: targetBatch.current_status,
          currentStatusLabel: targetBatch.current_status,
          stageCount: history.length > 0 ? history.length : 1,
        },
      ];
    }
  }

  const report: ReportData = {
    metadata,
    kpis,
    wasteRows,
    productRows,
    labRows,
    distributionByType,
    distributionBySource,
    methodNotes,
  };

  return {
    report,
    factRegistry: { facts },
  };
}
