import { validateAndSanitizeWasteAnalysis } from "../src/lib/ai/validators/waste-analyzer";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

console.log("=== AI Scientific Safety & Validator Test Suite ===");

// 1. Valid compliant output parses properly
const validPayload = JSON.stringify({
  waste_type: "mango_peel",
  visual_condition: "good",
  visible_discoloration: "minor",
  visible_surface_irregularities: "none",
  visible_findings: [
    "Bright yellow-orange peel tissue",
    "Minimal localized darkening at stem contact",
  ],
  manual_review_recommended: false,
  confidence_note: "Clear macroscopic view of fresh mango peel residue.",
});

const result1 = validateAndSanitizeWasteAnalysis(validPayload, "gpt-4o-mini");
assert(result1.wasteType === "mango_peel", "Valid payload parses wasteType");
assert(result1.visualCondition === "good", "Valid payload parses visualCondition");
assert(result1.manualReviewRecommended === false, "Valid payload parses manualReviewRecommended");
assert(result1.visibleFindings.length === 2, "Valid payload preserves safe findings");

// 2. Exact moisture percentage output is sanitized
const moistureAdversarialPayload = JSON.stringify({
  waste_type: "mango_peel",
  visual_condition: "moderate",
  visible_discoloration: "moderate",
  visible_surface_irregularities: "minor",
  visible_findings: [
    "Moisture content is 38.5% measured precisely",
    "Surface appears damp with localized water droplets",
  ],
  manual_review_recommended: true,
  confidence_note: "Estimated moisture content is 40% from image.",
});

const result2 = validateAndSanitizeWasteAnalysis(moistureAdversarialPayload, "gpt-4o-mini");
assert(
  !result2.visibleFindings.some((f) => f.includes("38.5%")),
  "Exact moisture percentage finding was sanitized"
);
assert(
  !result2.confidenceNote.includes("40%"),
  "Exact moisture in confidence note was sanitized"
);

// 3. Fungal species identification is sanitized
const fungalAdversarialPayload = JSON.stringify({
  waste_type: "mango_peel",
  visual_condition: "poor",
  visible_discoloration: "severe",
  visible_surface_irregularities: "severe",
  visible_findings: [
    "Fusarium oxysporum detected on peel surface",
    "Colletotrichum gloeosporioides anthracnose lesion confirmed",
  ],
  manual_review_recommended: true,
  confidence_note: "Fungal infection diagnosed.",
});

const result3 = validateAndSanitizeWasteAnalysis(fungalAdversarialPayload, "gpt-4o-mini");
assert(
  !result3.visibleFindings.some((f) => f.toLowerCase().includes("fusarium")),
  "Fusarium species claim was sanitized"
);
assert(
  !result3.visibleFindings.some((f) => f.toLowerCase().includes("colletotrichum")),
  "Colletotrichum species claim was sanitized"
);

// 4. Chemical composition claim is sanitized
const chemicalAdversarialPayload = JSON.stringify({
  waste_type: "mango_seed",
  visual_condition: "good",
  visible_discoloration: "none",
  visible_surface_irregularities: "none",
  visible_findings: [
    "Polyphenol content is 450 mg/g dry weight",
    "Pectin yield: 18% biological extraction ready",
  ],
  manual_review_recommended: false,
  confidence_note: "High chemical concentration verified.",
});

const result4 = validateAndSanitizeWasteAnalysis(chemicalAdversarialPayload, "gpt-4o-mini");
assert(
  !result4.visibleFindings.some((f) => f.toLowerCase().includes("polyphenol content")),
  "Chemical polyphenol claim was sanitized"
);
assert(
  !result4.visibleFindings.some((f) => f.toLowerCase().includes("pectin yield")),
  "Chemical pectin claim was sanitized"
);

// 5. Certification and purity claims are sanitized
const certAdversarialPayload = JSON.stringify({
  waste_type: "mango_peel",
  visual_condition: "good",
  visible_discoloration: "none",
  visible_surface_irregularities: "none",
  visible_findings: [
    "Certified organic grade feedstock",
    "100% pure clean-room grade material",
    "Laboratory confirmed pathogen-free",
  ],
  manual_review_recommended: false,
  confidence_note: "Food safety certified batch.",
});

const result5 = validateAndSanitizeWasteAnalysis(certAdversarialPayload, "gpt-4o-mini");
assert(
  !result5.visibleFindings.some((f) => f.toLowerCase().includes("certified organic")),
  "Certified organic claim was sanitized"
);
assert(
  !result5.visibleFindings.some((f) => f.toLowerCase().includes("100% pure")),
  "100% pure claim was sanitized"
);
assert(
  !result5.visibleFindings.some((f) => f.toLowerCase().includes("laboratory confirmed")),
  "Laboratory confirmed claim was sanitized"
);

// 6. Unknown / Low-Quality image handling
const uncertainPayload = JSON.stringify({
  waste_type: "unknown",
  visual_condition: "unknown",
  visible_discoloration: "unknown",
  visible_surface_irregularities: "unknown",
  visible_findings: ["Image is out of focus and cannot be evaluated reliably."],
  manual_review_recommended: true,
  confidence_note: "Image quality insufficient for automated assessment.",
});

const result6 = validateAndSanitizeWasteAnalysis(uncertainPayload, "gpt-4o-mini");
assert(result6.wasteType === "unknown", "Uncertain payload returns unknown wasteType");
assert(result6.manualReviewRecommended === true, "Uncertain payload recommends manual review");

// 7. Schema error handling for invalid enums
try {
  validateAndSanitizeWasteAnalysis(
    JSON.stringify({
      waste_type: "invented_category",
      visual_condition: "good",
      visible_discoloration: "none",
      visible_surface_irregularities: "none",
      visible_findings: [],
      manual_review_recommended: false,
      confidence_note: "Note",
    }),
    "gpt-4o-mini"
  );
  assert(false, "Invalid enum should have thrown error");
} catch {
  assert(true, "Invalid enum throws schema validation error");
}

// 8. Markdown code block stripping
const fencedPayload = "```json\n" + validPayload + "\n```";
const result8 = validateAndSanitizeWasteAnalysis(fencedPayload, "gpt-4o-mini");
assert(result8.wasteType === "mango_peel", "Markdown code block ```json is stripped cleanly");

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
