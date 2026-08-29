import { z } from "zod";
import { ReportData } from "@/data/contracts/report";
import { ReportFactRegistry } from "@/lib/reports/builder";
import { getAIProvider } from "../provider-factory";
import { FORBIDDEN_SUSTAINABILITY_PATTERNS } from "./sustainability";

export const REPORT_NARRATOR_VERSION = "report-narrator-v1.0";

export const REPORT_NARRATOR_SYSTEM_PROMPT = `You are an operational report narrator for the MangoCycle Smart Platform.

You receive VERIFIED, pre-calculated deterministic platform metrics and facts.
Your task is to generate a concise, professional narrative summary synthesizing the recorded activity.

RULES:
1. ONLY reference the numbers and facts provided in the input payload. NEVER invent data or numbers.
2. Use the exact numbers from the input — do not round, estimate, or adjust values.
3. Do NOT calculate or state percentages, ratios, or efficiencies (e.g. processing rate, biological yield, circularity score) unless explicitly present in the input.
4. Do NOT make claims about carbon savings, CO2 equivalent, water savings, energy savings, carbon credits, or economic profit.
5. Provide 2-4 concise bullet points highlighting verified platform metrics.
6. Return a structured JSON response.

Required JSON format:
{
  "summary": "Executive summary paragraph synthesizing recorded platform throughput...",
  "bulletPoints": [
    "50 kg of mango waste was recorded as diverted across 1 batch.",
    "..."
  ]
}`;

export const reportNarrativeOutputSchema = z.object({
  summary: z.string().min(1).max(2000),
  bulletPoints: z.array(z.string().min(1).max(500)).min(1).max(7),
});

export interface ValidatedReportNarrative {
  summary: string;
  bulletPoints: string[];
  model: string;
  generatedAt: string;
  isAiGenerated: boolean;
}

/**
 * Validates AI narrative against Authorized Fact Registry & Semantic Governance.
 * Returns true if the narrative is scientifically and numerically safe.
 */
export function validateNarrativeAgainstFacts(
  summary: string,
  bullets: string[],
  registry: ReportFactRegistry
): { valid: boolean; reason?: string } {
  const combinedText = (summary + " " + bullets.join(" ")).toLowerCase();

  // 1. Semantic Governance Check (No unauthorized environmental / monetary claims)
  for (const pattern of FORBIDDEN_SUSTAINABILITY_PATTERNS) {
    if (pattern.test(combinedText)) {
      return { valid: false, reason: `Contains prohibited sustainability claim matching ${pattern}` };
    }
  }

  // 2. Strict Percentage Prohibition when yield/rate are uncalibrated
  const hasPercentage = /\b\d+(\.\d+)?%\b/.test(combinedText);
  const percentageAllowed = Object.values(registry.facts).some(
    (f) => f.unit === "%" && f.isAllowed && f.value !== null
  );
  if (hasPercentage && !percentageAllowed) {
    return { valid: false, reason: "Unauthorized percentage or rate generated when formulas remain pending" };
  }

  // 3. Prohibited Derived Concepts (Yield / Efficiency / Processing Rate claims)
  const forbiddenPhrases = [
    /\b(biological\s*yield|yield\s*ratio|processing\s*rate|processing\s*efficiency)\b/i,
    /\b\d+\s*kg\s*(processed|converted)\b/i,
  ];
  for (const phrase of forbiddenPhrases) {
    if (phrase.test(combinedText)) {
      return { valid: false, reason: `Contains uncalibrated metric claim matching ${phrase}` };
    }
  }

  // 4. Authorized Fact Numeric Check
  // Extract all numbers in the AI text and ensure they correspond to an allowed fact
  const numberTokens = combinedText.match(/\b\d+(\.\d+)?\b/g) || [];
  const allowedNumericValues = new Set<string>();

  for (const fact of Object.values(registry.facts)) {
    if (fact.isAllowed && fact.value !== null && fact.value !== undefined) {
      const num = Number(fact.value);
      if (!isNaN(num)) {
        allowedNumericValues.add(String(num));
        allowedNumericValues.add(num.toFixed(1));
        allowedNumericValues.add(num.toFixed(2));
      }
    }
  }

  // Allow common date numbers (e.g. 2026, 28, 1) and small counts
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 2; y++) allowedNumericValues.add(String(y));
  for (let d = 1; d <= 31; d++) allowedNumericValues.add(String(d));

  for (const token of numberTokens) {
    if (!allowedNumericValues.has(token) && Number(token) > 0) {
      return { valid: false, reason: `Unverified numerical token '${token}' not present in authorized facts` };
    }
  }

  return { valid: true };
}

/**
 * Builds a deterministic templated narrative fallback directly from ReportData and Facts.
 */
export function buildDeterministicReportNarrative(
  report: ReportData,
  registry: ReportFactRegistry
): ValidatedReportNarrative {
  const kpis = report.kpis;
  const period = report.metadata.periodLabel;
  const now = new Date().toISOString();

  const totalDiverted = registry.facts.totalWasteDivertedKg?.value;
  const intakeCount = registry.facts.intakeBatches?.value;
  const activeCount = registry.facts.activeBatches?.value;
  const completedCount = registry.facts.completedLifecycles?.value;
  const prodCount = registry.facts.productBatchesCount?.value;
  const labCount = registry.facts.totalLabAssays?.value;

  const bulletPoints: string[] = [];

  if (totalDiverted !== undefined && totalDiverted !== null) {
    bulletPoints.push(
      `Total recorded intake stands at **${totalDiverted} kg** of organic mango byproducts diverted from disposal during ${period}.`
    );
  }

  if (intakeCount !== undefined && intakeCount !== null) {
    bulletPoints.push(
      `Operational pipeline tracks **${intakeCount} batch(es)** in scope, with **${completedCount ?? 0} completed** and **${activeCount ?? 0} active** intermediate lot(s).`
    );
  }

  if (prodCount !== undefined && prodCount !== null) {
    bulletPoints.push(
      `Downstream bio-formulation registry documents **${prodCount} finished product batch(es)**.`
    );
  }

  if (labCount !== undefined && labCount !== null) {
    bulletPoints.push(
      `Quality control records document **${labCount} analytical assay(s)** performed across batches.`
    );
  }

  if (bulletPoints.length === 0) {
    bulletPoints.push(
      `Report parameters (${period}) evaluated across platform operational repositories with ${kpis.length} primary metric indicator(s).`
    );
  }

  const summary = `This report synthesizes verified platform activity for ${period}. All numerical indicators reflect deterministic database records without manual override. Formula-pending metrics remain excluded in compliance with platform governance.`;

  return {
    summary,
    bulletPoints,
    model: "deterministic-engine (fallback)",
    generatedAt: now,
    isAiGenerated: false,
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {
        // continue
      }
    }

    return null;
  }
}

/**
 * Generates AI narrative using Gemini 3.6 Flash and validates against Authorized Facts.
 * Falls back deterministically if Gemini is unavailable, 429 occurs, or output fails validation.
 */
export async function generateReportNarrative(
  report: ReportData,
  registry: ReportFactRegistry
): Promise<ValidatedReportNarrative> {
  const model = process.env.AI_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";

  // Pass only verified structured facts into LLM prompt
  const minimalFactsPayload = {
    reportType: report.metadata.reportType,
    title: report.metadata.title,
    period: report.metadata.periodLabel,
    kpis: report.kpis.map((k) => ({ label: k.label, value: k.value, unit: k.unit })),
    facts: Object.fromEntries(
      Object.entries(registry.facts)
        .filter(([, f]) => f.isAllowed && f.value !== null)
        .map(([k, f]) => [k, { value: f.value, unit: f.unit }])
    ),
  };

  const userPrompt = `Generate a concise operational narrative for this report.

Verified Deterministic Input Data:
${JSON.stringify(minimalFactsPayload, null, 2)}`;

  let rawContent: string | null = null;
  try {
    const provider = getAIProvider();
    const placeholderImgBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const aiResult = await provider.analyzeImage({
      systemPrompt: REPORT_NARRATOR_SYSTEM_PROMPT,
      userPrompt,
      imageMimeType: "image/gif",
      imageBase64: placeholderImgBase64,
      temperature: 0.2,
    });
    rawContent = aiResult.rawContent;
  } catch (err) {
    console.warn("Gemini report narrative generation failed, using deterministic fallback:", err);
  }

  if (rawContent) {
    const parsed = extractJson(rawContent);
    const validated = reportNarrativeOutputSchema.safeParse(parsed);
    if (validated.success) {
      const factValidation = validateNarrativeAgainstFacts(
        validated.data.summary,
        validated.data.bulletPoints,
        registry
      );

      if (factValidation.valid) {
        return {
          summary: validated.data.summary,
          bulletPoints: validated.data.bulletPoints,
          model,
          generatedAt: new Date().toISOString(),
          isAiGenerated: true,
        };
      } else {
        console.warn("AI report narrative discarded due to fact validation failure:", factValidation.reason);
      }
    }
  }

  // Graceful deterministic fallback
  return buildDeterministicReportNarrative(report, registry);
}
