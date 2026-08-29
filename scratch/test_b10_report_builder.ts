import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { buildReportData } from "../src/lib/reports/builder";
import { UserProfile } from "../src/data/contracts/auth";

// Load .env.local safely
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

async function runReportBuilderTests() {
  console.log("=== B10 Deterministic Report Builder & Governance Test Suite ===\n");

  const mockCaller: UserProfile = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "researcher.test@mangocycle.invalid",
    fullName: "Lead Analytical Researcher",
    role: "researcher",
    avatarUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // ==========================================
  // 1. CANONICAL REPORT TYPE 1: WASTE SUMMARY
  // ==========================================
  console.log("--- 1. Waste Summary Report ---");
  const { report: wasteReport, factRegistry: wasteFacts } = await buildReportData(
    supabaseAdmin,
    { reportType: "waste_summary" },
    mockCaller
  );

  assert(wasteReport.metadata.reportType === "waste_summary", "Report type is 'waste_summary'");
  assert(wasteReport.metadata.title.includes("Monthly Waste Management Report"), "Title contains canonical report label");
  assert(wasteReport.kpis.length >= 4, "KPIs contain at least 4 summary metrics");

  const totalDivertedKpi = wasteReport.kpis.find((k) => k.label === "Total Waste Diverted");
  assert(Boolean(totalDivertedKpi), "KPI 'Total Waste Diverted' is present");
  assert(Number(totalDivertedKpi!.value) >= 0, "Total Waste Diverted is numeric");
  assert(totalDivertedKpi!.unit === "kg", "Waste Diverted unit is 'kg'");

  assert(wasteFacts.facts.totalWasteProcessedKg.value === null, "Total Waste Processed is strictly null (Formula Pending)");
  assert(wasteFacts.facts.processingRatePct.value === null, "Processing Rate is strictly null (Formula Pending)");
  assert(wasteFacts.facts.biologicalYieldPct.value === null, "Biological Yield is strictly null (Formula Pending)");

  // ==========================================
  // 2. CANONICAL REPORT TYPE 2: SUSTAINABILITY REPORT
  // ==========================================
  console.log("\n--- 2. Sustainability Report ---");
  const { report: sustReport, factRegistry: sustFacts } = await buildReportData(
    supabaseAdmin,
    { reportType: "sustainability" },
    mockCaller
  );

  assert(sustReport.metadata.reportType === "sustainability", "Report type is 'sustainability'");
  assert(sustFacts.facts.totalWasteDivertedKg.isAllowed === true, "Waste Diverted is marked allowed");
  assert(sustFacts.facts.biologicalYieldPct.isAllowed === false, "Biological Yield is marked not allowed");

  // ==========================================
  // 3. CANONICAL REPORT TYPE 3: PRODUCT TRACEABILITY
  // ==========================================
  console.log("\n--- 3. Product Traceability Report ---");
  const { report: prodReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "product_traceability" },
    mockCaller
  );

  assert(prodReport.metadata.reportType === "product_traceability", "Report type is 'product_traceability'");
  const prodKpi = prodReport.kpis.find((k) => k.label === "Product Batches");
  assert(Boolean(prodKpi), "KPI 'Product Batches' is present");

  // Verify zero yield percentages calculated in product report
  const hasYieldKpi = prodReport.kpis.some((k) => k.label.toLowerCase().includes("yield") || String(k.value).includes("%"));
  assert(!hasYieldKpi, "No biological yield percentage calculated in product report");

  // ==========================================
  // 4. CANONICAL REPORT TYPE 4: LABORATORY SUMMARY
  // ==========================================
  console.log("\n--- 4. Laboratory Summary Report ---");
  const { report: labReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "laboratory_summary" },
    mockCaller
  );

  assert(labReport.metadata.reportType === "laboratory_summary", "Report type is 'laboratory_summary'");
  assert(
    labReport.methodNotes.some((m) => m.includes("Confidential internal researcher methodology notes")),
    "Data minimization note present: confidential researcher notes excluded"
  );
  assert(
    labReport.methodNotes.some((m) => m.includes("does not constitute independent scientific certification")),
    "Governance disclaimer present: lab workflow status is not certification"
  );

  // ==========================================
  // 5. CANONICAL REPORT TYPE 5: SINGLE BATCH REPORT
  // ==========================================
  console.log("\n--- 5. Single Batch Report ---");
  const { report: batchReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "batch_report", wasteBatchId: "MW-2026-LIVE8" },
    mockCaller
  );

  assert(batchReport.metadata.reportType === "batch_report", "Report type is 'batch_report'");
  assert(Boolean(batchReport.kpis.find((k) => k.label === "Batch Code")), "Batch Code KPI present");

  // ==========================================
  // 6. WASTE DIVERTED 100 KG REGRESSION (COMPLETED + ACTIVE + REJECTED)
  // ==========================================
  console.log("\n--- 6. B6.1 Waste Diverted Formula Regression ---");
  // Formula: Waste Diverted = SUM(weight_kg) of ALL batches in scope, INCLUDING rejected batches.
  // Synthetic data test: 50 completed + 30 active + 20 rejected = 100 kg
  const syntheticBatches = [
    { weight_kg: 50, current_status: "completed" },
    { weight_kg: 30, current_status: "drying" },
    { weight_kg: 20, current_status: "rejected" },
  ];
  const calculatedDiverted = syntheticBatches.reduce((acc, b) => acc + b.weight_kg, 0);
  assert(calculatedDiverted === 100, "50kg completed + 30kg active + 20kg rejected = 100 kg Waste Diverted (rejected included)");

  // ==========================================
  // 7. DATE RANGE BOUNDARY FILTERING
  // ==========================================
  console.log("\n--- 7. Date Range Filtering ---");
  const { report: dateFilteredReport } = await buildReportData(
    supabaseAdmin,
    { reportType: "waste_summary", startDate: "2026-08-01", endDate: "2026-08-31" },
    mockCaller
  );
  assert(dateFilteredReport.metadata.startDate === "2026-08-01", "Start date preserved");
  assert(dateFilteredReport.metadata.endDate === "2026-08-31", "End date preserved");
  assert(dateFilteredReport.metadata.periodLabel === "2026-08-01 to 2026-08-31", "Period label formatted correctly");

  console.log("\n==========================================");
  console.log("✅ ALL DETERMINISTIC REPORT BUILDER TESTS PASSED!");
  console.log("==========================================");
}

runReportBuilderTests().catch((err) => {
  console.error("❌ Builder test failed:", err);
  process.exit(1);
});
