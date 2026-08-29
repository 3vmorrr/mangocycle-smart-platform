import { ProcessingRule } from "@/data/contracts/ai";
import { WasteType } from "@/data/contracts/waste-batch";

export interface WasteBatchEvaluationInput {
  id: string;
  batchCode: string;
  wasteType: WasteType;
  currentStatus: string;
  moistureStatus?: "low" | "moderate" | "high" | null;
  visualCondition?: "good" | "moderate" | "poor" | null;
  collectionDate?: string | null;
}

export interface RuleThresholdSettings {
  maxStorageDays?: number;
  maxDaysBeforeSorting?: number;
}

export interface DeterministicRuleEvaluationResult {
  evaluationVersion: string;
  evaluatedAt: string;
  batchCode: string;
  wasteType: WasteType;
  currentStatus: string;
  moistureStatus: "low" | "moderate" | "high" | null;
  visualCondition: "good" | "moderate" | "poor" | null;
  storageDurationDays: number | null;
  triggeredRules: ProcessingRule[];
  insufficientDataRules: string[];
  advisoryOnly: true;
}

export const PROCESSING_RULE_VERSION = "processing-rules-v1.0";

// Canonical default prototype thresholds per 17-AI-PROCESSING-ADVISOR.md §4.4
export const DEFAULT_MAX_STORAGE_DAYS = 7;
export const DEFAULT_MAX_DAYS_BEFORE_SORTING = 3;

/**
 * Calculates storage duration deterministically from collection_date.
 * Returns null if collection_date is invalid or missing.
 * Prevents negative duration.
 */
export function calculateStorageDurationDays(collectionDate: string | null): number | null {
  if (!collectionDate) return null;
  const parsedTime = Date.parse(collectionDate);
  if (isNaN(parsedTime)) return null;

  const now = Date.now();
  const diffMs = now - parsedTime;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Deterministic Processing Advisor Rule Engine per 17-AI-PROCESSING-ADVISOR.md §4.2.
 * Evaluates all 7 canonical rules (R001–R007).
 * Precedence: High -> Medium -> Low.
 */
export function evaluateProcessingRules(
  batch: WasteBatchEvaluationInput,
  settings?: RuleThresholdSettings
): DeterministicRuleEvaluationResult {
  const maxStorageDays = settings?.maxStorageDays ?? DEFAULT_MAX_STORAGE_DAYS;
  const maxDaysBeforeSorting = settings?.maxDaysBeforeSorting ?? DEFAULT_MAX_DAYS_BEFORE_SORTING;

  const storageDurationDays = calculateStorageDurationDays(batch.collectionDate ?? null);
  const triggeredRules: ProcessingRule[] = [];
  const insufficientDataRules: string[] = [];

  // R001: moisture_status = 'high' (Priority: High)
  if (batch.moistureStatus === "high") {
    triggeredRules.push({
      id: "R001",
      name: "High Moisture Intake Protocol",
      recommendation: "Prioritize drying stage before further processing",
      priority: "high",
      rationale:
        "Elevated water content accelerates microbial fermentation and enzymatic browning. Thermal or solar drying must be initiated to stabilize the biological matrix.",
      requiresScientificValidation: true,
    });
  }

  // R002: storage_duration_days > maxStorageDays (Priority: High)
  if (storageDurationDays === null) {
    insufficientDataRules.push("R002");
  } else if (storageDurationDays > maxStorageDays) {
    triggeredRules.push({
      id: "R002",
      name: "Extended Storage Inspection",
      recommendation: "Manual review required — extended storage may affect quality",
      priority: "high",
      rationale: `Storage duration (${storageDurationDays} days) exceeds the maximum prototype threshold (${maxStorageDays} days). Secondary metabolite degradation may require inspection.`,
      requiresScientificValidation: true,
    });
  }

  // R003: visual_condition = 'poor' (Priority: High)
  if (batch.visualCondition === "poor") {
    triggeredRules.push({
      id: "R003",
      name: "Visual Degradation Alert",
      recommendation: "Inspection recommended before processing",
      priority: "high",
      rationale:
        "Recorded visual condition indicates tissue breakdown or discoloration. Operator inspection recommended before advancing.",
      requiresScientificValidation: true,
    });
  }

  // R004: current_status = 'collected' AND storage_duration_days > maxDaysBeforeSorting (Priority: Medium)
  if (batch.currentStatus === "collected") {
    if (storageDurationDays === null) {
      insufficientDataRules.push("R004");
    } else if (storageDurationDays > maxDaysBeforeSorting) {
      triggeredRules.push({
        id: "R004",
        name: "Collection Intake Flow",
        recommendation: "Begin sorting soon to prevent degradation",
        priority: "medium",
        rationale: `Raw collected waste has remained in intake for ${storageDurationDays} days (threshold: >${maxDaysBeforeSorting} days). Advance to sorting stage to prevent quality loss.`,
        requiresScientificValidation: false,
      });
    }
  }

  // R005: waste_type = 'mango_seed' AND current_status = 'dried' (Priority: Medium)
  if (batch.wasteType === "mango_seed" && batch.currentStatus === "dried") {
    triggeredRules.push({
      id: "R005",
      name: "Seed Kernel Grinding Parameter",
      recommendation: "Proceed to grinding — seeds require thorough grinding",
      priority: "medium",
      rationale:
        "Dried mango seed endocarps require mechanical grinding to achieve optimal particle size for solvent extraction.",
      requiresScientificValidation: false,
    });
  }

  // R006: current_status = 'ground' (Priority: Low)
  if (batch.currentStatus === "ground") {
    triggeredRules.push({
      id: "R006",
      name: "Extraction Readiness",
      recommendation: "Ready for extraction stage",
      priority: "low",
      rationale:
        "Ground mango residue matrix is prepared for bioactive compound or biopolymer extraction protocols.",
      requiresScientificValidation: false,
    });
  }

  // R007: current_status = 'production' (Priority: Low)
  if (batch.currentStatus === "production") {
    triggeredRules.push({
      id: "R007",
      name: "Laboratory Quality Verification",
      recommendation: "Schedule laboratory testing",
      priority: "low",
      rationale:
        "Final formulation phase reached. Laboratory analytical testing (antimicrobial, antioxidant, or purity) should be scheduled.",
      requiresScientificValidation: false,
    });
  }

  // Canonical ordering by priority: High -> Medium -> Low
  const priorityOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
  triggeredRules.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    evaluationVersion: PROCESSING_RULE_VERSION,
    evaluatedAt: new Date().toISOString(),
    batchCode: batch.batchCode,
    wasteType: batch.wasteType,
    currentStatus: batch.currentStatus,
    moistureStatus: batch.moistureStatus ?? null,
    visualCondition: batch.visualCondition ?? null,
    storageDurationDays,
    triggeredRules,
    insufficientDataRules,
    advisoryOnly: true,
  };
}
