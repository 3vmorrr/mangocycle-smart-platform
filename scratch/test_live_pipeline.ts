import fs from "fs";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";
import {
  WASTE_ANALYZER_SYSTEM_PROMPT,
  WASTE_ANALYZER_PROMPT_VERSION,
  buildWasteAnalyzerUserPrompt,
} from "../src/lib/ai/prompts/waste-analyzer";
import { validateAndSanitizeWasteAnalysis } from "../src/lib/ai/validators/waste-analyzer";

// Load local environment variables from .env.local if not already in process.env
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

async function runLiveTest() {
  console.log("=== Phase B8.1: Live Gemini Multimodal Pipeline Test ===");

  // 1. Check Image
  const imagePath = "scratch/test_mango_peel.jpg";
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found at ${imagePath}`);
  }
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");
  console.log(`1. Loaded sample image: ${imageBuffer.length} bytes (MIME: image/jpeg)`);

  // 2. Initialize Provider
  const provider = new GeminiProvider();
  console.log(`2. Initialized provider: ${provider.name}`);

  const userPrompt = buildWasteAnalyzerUserPrompt({
    wasteBatchCode: "MW-2026-001",
    wasteTypeHint: "mango_peel",
  });

  console.log("3. Sending multimodal vision request to Gemini API (Model: gemini-3.7-flash)...");
  const startTime = Date.now();
  const rawResult = await provider.analyzeImage({
    systemPrompt: WASTE_ANALYZER_SYSTEM_PROMPT,
    userPrompt,
    imageMimeType: "image/jpeg",
    imageBase64,
  });
  const elapsedMs = Date.now() - startTime;

  console.log(`4. Received Gemini response in ${elapsedMs}ms:`);
  console.log("   Model:", rawResult.model);
  console.log("   Raw Content Preview:", rawResult.rawContent.substring(0, 180) + "...");

  // 3. Validation & Scientific Safety Filtering
  console.log("5. Running Zod validation and deterministic scientific safety filter...");
  const validated = validateAndSanitizeWasteAnalysis(rawResult.rawContent, rawResult.model);

  console.log("\n=== VALIDATED REAL OUTPUT DTO ===");
  console.log("Waste Type:", validated.wasteType, `(${validated.wasteTypeLabel})`);
  console.log("Visual Condition:", validated.visualCondition, `(${validated.visualConditionLabel})`);
  console.log("Discoloration:", validated.visibleDiscoloration);
  console.log("Surface Irregularities:", validated.visibleSurfaceIrregularities);
  console.log("Visible Findings:", JSON.stringify(validated.visibleFindings, null, 2));
  console.log("Manual Review Recommended:", validated.manualReviewRecommended);
  console.log("Confidence Note:", validated.confidenceNote);
  console.log("Model Identifier:", validated.model);

  // 4. Forbidden Claims Audit
  console.log("\n6. Auditing for prohibited scientific claims...");
  const combinedText = [
    validated.wasteType,
    validated.visualCondition,
    ...validated.visibleFindings,
    validated.confidenceNote,
  ].join(" ").toLowerCase();

  const forbiddenTerms = [
    "fusarium", "colletotrichum", "aspergillus", "pathogen",
    "certified", "100% pure", "purity", "polyphenol content",
    "pectin yield", "exact moisture"
  ];

  let violations = 0;
  for (const term of forbiddenTerms) {
    if (combinedText.includes(term)) {
      console.error(`❌ Prohibited claim leaked: "${term}"`);
      violations++;
    }
  }

  if (violations === 0) {
    console.log("✅ Zero prohibited scientific claims found in output!");
  } else {
    throw new Error(`Scientific safety audit failed with ${violations} violations.`);
  }

  console.log("\n✅ LIVE MULTIMODAL GEMINI PIPELINE TEST PASSED 100%!");
}

runLiveTest().catch((err) => {
  console.error("❌ Live test failed:", err);
  process.exit(1);
});
