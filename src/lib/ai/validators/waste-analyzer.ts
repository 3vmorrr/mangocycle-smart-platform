import { z } from "zod";
import {
  AiWasteVisualAnalysis,
  VisualCondition,
  VisualDiscolorationLevel,
  VisualSurfaceIrregularitiesLevel,
} from "@/data/contracts/ai";
import { WasteType } from "@/data/contracts/waste-batch";

export const wasteVisualAnalysisOutputSchema = z.object({
  waste_type: z.enum(["mango_peel", "mango_seed", "mixed_mango_waste", "unknown"]),
  visual_condition: z.enum(["good", "moderate", "poor", "unknown"]),
  visible_discoloration: z.enum(["none", "minor", "moderate", "severe", "unknown"]),
  visible_surface_irregularities: z.enum(["none", "minor", "moderate", "severe", "unknown"]),
  visible_findings: z.array(z.string()).max(10),
  manual_review_recommended: z.boolean(),
  confidence_note: z.string().max(500),
});

export type RawWasteVisualAnalysis = z.infer<typeof wasteVisualAnalysisOutputSchema>;

const WASTE_TYPE_LABELS: Record<WasteType | "unknown", string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Mango Waste",
  unknown: "Unclassified / Uncertain",
};

const VISUAL_CONDITION_LABELS: Record<VisualCondition, string> = {
  good: "Good Visible Condition",
  moderate: "Moderate Visible Condition",
  poor: "Poor Visible Condition",
  unknown: "Uncertain Condition",
};

/**
 * Forbidden scientific / clinical / diagnostic patterns that must never appear in visual AI output.
 */
const FORBIDDEN_PATTERNS = [
  // Exact moisture percentages / numbers in any order
  /\b(moisture|water\s*content|water\s*activity)\b[^\n\r]*\b\d+(\.\d+)?\s*%/i,
  /\b\d+(\.\d+)?\s*%\s*[^\n\r]*\b(moisture|water\s*content)\b/i,
  /\b(moisture|water\s*content)\s*[:=]\s*\d+/i,
  // Fungal or bacterial species identification
  /\b(fusarium|colletotrichum|aspergillus|alternaria|lasiodiplodia|rhizopus|penicillium|botryodiplodia|pseudomonas|bacillus|escherichia|salmonella|e\.\s*coli)\b/i,
  // Chemical composition & biochemical concentrations
  /\b(polyphenol|mangiferin|flavonoid|antioxidant\s*capacity|pectin\s*yield|ph\s*level|ph\s*value|chemical\s*composition)\b[^\n\r]*\b\d+/i,
  // Certified / lab-confirmed claims
  /\b(certified\s*organic|laboratory\s*confirmed|lab-grade|100%\s*pure|purity\s*\d+%|clean-room\s*grade|food\s*safety\s*certified)\b/i,
];

/**
 * Sanitizes a single string finding by removing or replacing prohibited definitive claims.
 */
function sanitizeFinding(finding: string): string | null {
  const trimmed = finding.trim();
  if (!trimmed) return null;

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmed)) {
      // Replace with conservative uncertainty statement
      return "Visible surface pattern observed; requires manual inspection.";
    }
  }
  return trimmed;
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch (initialErr: unknown) {
    // 1. Try stripping markdown code fences
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }

    // 2. Try extracting outermost JSON object
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }
    }

    const errMessage = initialErr instanceof Error ? initialErr.message : "JSON parse error";
    throw new Error(`AI provider returned invalid JSON payload (${errMessage}). Raw content: ${trimmed.substring(0, 100)}`);
  }
}

/**
 * Parses, validates with Zod, and applies deterministic scientific safety rules.
 */
export function validateAndSanitizeWasteAnalysis(
  rawContent: string,
  modelName: string
): AiWasteVisualAnalysis {
  // 1. Clean and parse JSON
  const parsedJson = extractJson(rawContent);

  // 2. Strict Zod schema validation
  const validationResult = wasteVisualAnalysisOutputSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    const errorDetails = validationResult.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`AI response failed schema validation: ${errorDetails}`);
  }

  const raw = validationResult.data;

  // 3. Deterministic Safety Post-Validation
  const sanitizedFindings: string[] = [];
  for (const f of raw.visible_findings) {
    const s = sanitizeFinding(f);
    if (s && !sanitizedFindings.includes(s)) {
      sanitizedFindings.push(s);
    }
  }

  if (sanitizedFindings.length === 0) {
    sanitizedFindings.push("Macroscopic surface features consistent with mango agricultural residue.");
  }

  let confidenceNote = raw.confidence_note.trim();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(confidenceNote)) {
      confidenceNote = "AI-assisted visual assessment based solely on visible image features. Not a substitute for laboratory analysis.";
      break;
    }
  }

  if (!confidenceNote) {
    confidenceNote = "AI-assisted visual assessment based solely on visible image features.";
  }

  const wasteType = raw.waste_type as WasteType | "unknown";
  const visualCondition = raw.visual_condition as VisualCondition;
  const visibleDiscoloration = raw.visible_discoloration as VisualDiscolorationLevel;
  const visibleSurfaceIrregularities = raw.visible_surface_irregularities as VisualSurfaceIrregularitiesLevel;

  return {
    wasteType,
    wasteTypeLabel: WASTE_TYPE_LABELS[wasteType] || wasteType,
    visualCondition,
    visualConditionLabel: VISUAL_CONDITION_LABELS[visualCondition] || visualCondition,
    visibleDiscoloration,
    visibleSurfaceIrregularities,
    visibleFindings: sanitizedFindings.slice(0, 10),
    manualReviewRecommended: raw.manual_review_recommended,
    confidenceNote,
    model: modelName,
    analyzedAt: new Date().toISOString(),
  };
}
