import {
  validateNarrativeAgainstFacts,
  buildDeterministicReportNarrative,
} from "../src/lib/ai/prompts/report-narrator";
import { ReportFactRegistry } from "../src/lib/reports/builder";
import { ReportData } from "../src/data/contracts/report";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

function runAiNarratorTests() {
  console.log("=== B10 AI Narrator, Fact Registry & Numeric Integrity Test Suite ===\n");

  const registry: ReportFactRegistry = {
    facts: {
      totalWasteDivertedKg: {
        metric: "totalWasteDivertedKg",
        value: 50,
        unit: "kg",
        isAllowed: true,
        allowedContexts: ["waste diverted", "intake mass", "collected waste"],
      },
      intakeBatches: {
        metric: "intakeBatches",
        value: 1,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["intake batches", "recorded lots"],
      },
      completedLifecycles: {
        metric: "completedLifecycles",
        value: 0,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["completed batches"],
      },
      activeBatches: {
        metric: "activeBatches",
        value: 1,
        unit: "count",
        isAllowed: true,
        allowedContexts: ["active batches"],
      },
      totalWasteProcessedKg: {
        metric: "totalWasteProcessedKg",
        value: null,
        isAllowed: false,
        allowedContexts: [],
      },
      processingRatePct: {
        metric: "processingRatePct",
        value: null,
        isAllowed: false,
        allowedContexts: [],
      },
      biologicalYieldPct: {
        metric: "biologicalYieldPct",
        value: null,
        isAllowed: false,
        allowedContexts: [],
      },
    },
  };

  // ==========================================
  // 1. REJECTION OF UNAUTHORIZED PERCENTAGES (e.g. 50% processing rate)
  // ==========================================
  console.log("--- 1. Percentage & Rate Integrity ---");

  const percentageAdversarial = validateNarrativeAgainstFacts(
    "The plant achieved a 50% processing rate for the collected batch.",
    ["50% processing rate observed."],
    registry
  );
  assert(
    percentageAdversarial.valid === false,
    `Rejected '50% processing rate' even though 50 is in payload (${percentageAdversarial.reason})`
  );

  const yieldAdversarial = validateNarrativeAgainstFacts(
    "Biological yield was calculated at 85%.",
    ["85% yield achieved."],
    registry
  );
  assert(
    yieldAdversarial.valid === false,
    `Rejected '85% biological yield' (${yieldAdversarial.reason})`
  );

  // ==========================================
  // 2. REJECTION OF CONTEXT MISMATCH (e.g. 50 kg processed)
  // ==========================================
  console.log("\n--- 2. Metric Context Binding ---");

  const processedAdversarial = validateNarrativeAgainstFacts(
    "The platform reports 50 kg processed during this cycle.",
    ["50 kg processed into final products."],
    registry
  );
  assert(
    processedAdversarial.valid === false,
    `Rejected '50 kg processed' when processed is pending (${processedAdversarial.reason})`
  );

  // ==========================================
  // 3. REJECTION OF INVENTED NUMBERS (e.g. 42 batches)
  // ==========================================
  console.log("\n--- 3. Invented Numbers Detection ---");

  const inventedNumberAdversarial = validateNarrativeAgainstFacts(
    "The facility processed 42 batches with high efficiency.",
    ["42 batches recorded."],
    registry
  );
  assert(
    inventedNumberAdversarial.valid === false,
    `Rejected invented number '42' not in fact registry (${inventedNumberAdversarial.reason})`
  );

  // ==========================================
  // 4. REJECTION OF ALL 10 PROHIBITED CLAIMS
  // ==========================================
  console.log("\n--- 4. Semantic Governance Prohibited Claims ---");

  const prohibitedPhrases = [
    "Prevented 150 kg of CO2 equivalent emissions.",
    "Delivered a substantial carbon benefit to operations.",
    "Maintained a smaller carbon footprint across the lifecycle.",
    "Saved natural resources by valorizing mango waste.",
    "Resulted in reduced water consumption during washing.",
    "Achieved reduced energy consumption in drying ovens.",
    "Provided a direct financial benefit to local stakeholders.",
    "Delivered $1,200 in cost savings for farmers.",
    "Equivalent to an environmental equivalent of 200 trees planted.",
    "Favorable climate impact equivalent across the community.",
  ];

  for (const phrase of prohibitedPhrases) {
    const res = validateNarrativeAgainstFacts(phrase, [phrase], registry);
    assert(
      res.valid === false,
      `Prohibited claim strictly rejected: "${phrase.substring(0, 35)}..." (${res.reason})`
    );
  }

  // ==========================================
  // 5. VALID FACTUAL NARRATIVE PASSES CLEANLY
  // ==========================================
  console.log("\n--- 5. Valid Narrative Approval ---");

  const validNarrative = validateNarrativeAgainstFacts(
    "During this period, 50 kg of mango waste was recorded in the platform.",
    [
      "50 kg of organic waste diverted across 1 intake batch.",
      "1 active batch is currently in intermediate processing.",
    ],
    registry
  );
  assert(validNarrative.valid === true, "Valid factual narrative containing authorized metrics passes validation cleanly");

  // ==========================================
  // 6. DETERMINISTIC FALLBACK GENERATION
  // ==========================================
  console.log("\n--- 6. Deterministic Fallback Synthesis ---");

  const mockReport: ReportData = {
    metadata: {
      id: "rep-1",
      title: "Monthly Waste Management Report — All Recorded Time",
      reportType: "waste_summary",
      reportTypeLabel: "Monthly Waste Management Report",
      generatedAt: new Date().toISOString(),
      periodLabel: "All Recorded Time",
      startDate: null,
      endDate: null,
      generatedByName: "Lead Analytical Researcher",
      isDemoData: false,
    },
    kpis: [
      { label: "Total Waste Diverted", value: 50, unit: "kg" },
      { label: "Intake Batches", value: 1 },
      { label: "Completed Lifecycles", value: 0 },
      { label: "Active in Pipeline", value: 1 },
    ],
    methodNotes: [],
  };

  const fallback = buildDeterministicReportNarrative(mockReport, registry);
  assert(fallback.isAiGenerated === false, "Fallback is marked isAiGenerated: false");
  assert(fallback.bulletPoints.length >= 2, "Fallback synthesized at least 2 structured bullet points");
  assert(fallback.bulletPoints[0].includes("50 kg"), "Fallback includes verified 50 kg diverted metric");
  assert(fallback.summary.includes("Formula-pending metrics remain excluded"), "Fallback includes governance disclaimer");

  console.log("\n==========================================");
  console.log("✅ ALL AI NARRATOR & FACT REGISTRY TESTS PASSED!");
  console.log("==========================================");
}

runAiNarratorTests();
