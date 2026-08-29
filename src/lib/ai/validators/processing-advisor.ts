import { z } from "zod";
import { DeterministicRuleEvaluationResult } from "../rules/processing-advisor";
import { ProcessingAdvisorResponse } from "@/data/contracts/ai";
import { CANONICAL_PROCESSING_STAGES } from "@/lib/constants/stages";

export const processingAdvisorOutputSchema = z.object({
  explanation: z.string().min(1).max(2000),
  summary: z.string().max(500).optional(),
});

export type ProcessingAdvisorExplanation = z.infer<typeof processingAdvisorOutputSchema>;

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

    // Fallback: if Gemini returned raw text explanation instead of JSON object
    return { explanation: trimmed };
  }
}

/**
 * Builds the canonical ProcessingAdvisorResponse combining the deterministic rule evaluation
 * and the validated Gemini explanation.
 */
export function buildAdvisorResponse(
  evaluation: DeterministicRuleEvaluationResult,
  llmRawContent: string | null,
  modelName: string
): ProcessingAdvisorResponse {
  const stageDef = CANONICAL_PROCESSING_STAGES.find((s) => s.id === evaluation.currentStatus);
  const currentStatusLabel = stageDef?.name ?? evaluation.currentStatus;

  let aiExplanation = "";

  if (llmRawContent) {
    try {
      const parsed = extractJson(llmRawContent);
      const validated = processingAdvisorOutputSchema.safeParse(parsed);
      if (validated.success) {
        aiExplanation = validated.data.explanation;
      } else {
        aiExplanation = typeof parsed === "object" && parsed && "explanation" in parsed
          ? String((parsed as Record<string, unknown>).explanation)
          : llmRawContent.trim();
      }
    } catch {
      aiExplanation = llmRawContent.trim();
    }
  }

  // Graceful fallback if Gemini explanation is unavailable
  if (!aiExplanation) {
    if (evaluation.triggeredRules.length === 0) {
      aiExplanation = `Batch ${evaluation.batchCode} is operating under normal pipeline parameters with no active rule alerts. Continue standard workflow progression towards ${currentStatusLabel}.`;
    } else {
      aiExplanation = `Deterministic evaluation of ${evaluation.batchCode} triggered ${
        evaluation.triggeredRules.length
      } operational rule(s). ${evaluation.triggeredRules.map((r) => r.rationale).join(" ")}`;
    }
  }

  return {
    batchCode: evaluation.batchCode,
    wasteType: evaluation.wasteType,
    currentStatus: evaluation.currentStatus,
    currentStatusLabel,
    moistureStatus: evaluation.moistureStatus,
    storageDurationDays: evaluation.storageDurationDays,
    visualCondition: evaluation.visualCondition,
    triggeredRules: evaluation.triggeredRules,
    aiExplanation,
    scientificValidationNote:
      "All recommendation thresholds are prototype decision-support rules pending final scientific validation. Final operational decisions require human scientific review.",
    model: modelName,
    analyzedAt: evaluation.evaluatedAt,
  };
}
