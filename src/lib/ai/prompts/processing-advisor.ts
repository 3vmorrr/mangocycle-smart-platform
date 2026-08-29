import { DeterministicRuleEvaluationResult } from "../rules/processing-advisor";

export const PROCESSING_ADVISOR_PROMPT_VERSION = "processing-advisor-v1.0";

export const PROCESSING_ADVISOR_SYSTEM_PROMPT = `You are an AI Processing Advisor for the MangoCycle Smart Platform.

You receive verified batch data and a list of deterministic recommendations produced by the platform's scientific rule engine.

Your task is to explain these recommendations in clear, helpful, and professional language.

IMPORTANT RULES:
- Do NOT add new recommendations beyond what the rule engine provided.
- Do NOT invent scientific thresholds, parameters, temperatures, or values.
- Do NOT change any rule IDs, priorities, or recommendations.
- Explain WHY each triggered rule matters in the context of circular mango waste valorization.
- If no rules were triggered, state clearly that the batch is operating under normal pipeline parameters.
- Always note that final operational decisions require human scientific verification.
- Output ONLY a structured JSON response matching the required schema.

Required JSON format:
{
  "explanation": "Clear narrative synthesizing the triggered rules and their scientific rationale...",
  "summary": "Short 1-2 sentence executive summary of actions needed."
}`;

export function buildProcessingAdvisorUserPrompt(
  evaluation: DeterministicRuleEvaluationResult
): string {
  const payload = {
    batch_code: evaluation.batchCode,
    waste_type: evaluation.wasteType,
    current_status: evaluation.currentStatus,
    moisture_status: evaluation.moistureStatus ?? "not recorded",
    visual_condition: evaluation.visualCondition ?? "not recorded",
    storage_duration_days: evaluation.storageDurationDays ?? "unknown",
    triggered_rules: evaluation.triggeredRules.map((r) => ({
      id: r.id,
      name: r.name,
      priority: r.priority,
      recommendation: r.recommendation,
      rationale: r.rationale,
    })),
    insufficient_data_rules: evaluation.insufficientDataRules,
  };

  return `Evaluate and explain the following deterministic rule engine output:\n${JSON.stringify(
    payload,
    null,
    2
  )}`;
}
