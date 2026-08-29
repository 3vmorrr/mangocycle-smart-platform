import { BaseEntity } from "./types";
import { WasteType } from "./waste-batch";

export type AnalysisType =
  | "visual_assessment"
  | "processing_advice"
  | "ask_mangocycle"
  | "sustainability_insights"
  | "report_generation";

export type AiAnalysisStatus = "pending" | "completed" | "failed" | "error";

export interface AiAnalysisRecord extends BaseEntity {
  analysisType: AnalysisType;
  wasteBatchId: string | null;
  wasteBatchCode?: string | null;
  productBatchId: string | null;
  productBatchCode?: string | null;
  inputReference: string | null;
  promptVersion: string | null;
  model: string | null;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  status: AiAnalysisStatus;
  humanReviewed: boolean;
  requestedBy: string | null;
  requesterName?: string | null;
}

// --- 1. AI Waste Visual Analyzer Contracts ---
export type VisualDiscolorationLevel = "none" | "minor" | "moderate" | "severe" | "unknown";
export type VisualSurfaceIrregularitiesLevel = "none" | "minor" | "moderate" | "severe" | "unknown";
export type VisualCondition = "good" | "moderate" | "poor" | "unknown";

export interface AiWasteVisualAnalysis {
  wasteType: WasteType | "unknown";
  wasteTypeLabel: string;
  visualCondition: VisualCondition;
  visualConditionLabel: string;
  visibleDiscoloration: VisualDiscolorationLevel;
  visibleSurfaceIrregularities: VisualSurfaceIrregularitiesLevel;
  visibleFindings: string[];
  manualReviewRecommended: boolean;
  confidenceNote: string;
  model: string;
  analyzedAt: string;
}

export interface AnalyzeWasteImageInput {
  imageName: string;
  imageSize: number;
  imageMime: string;
  imageDataUrl?: string;
  wasteBatchId?: string | null;
  demoScenario?: string;
}

// --- 2. AI Processing Advisor Contracts ---
export interface ProcessingRule {
  id: string;
  name: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  requiresScientificValidation: boolean;
}

export interface ProcessingAdvisorResponse {
  batchCode: string;
  wasteType: WasteType;
  currentStatus: string;
  currentStatusLabel: string;
  moistureStatus: string | null;
  storageDurationDays: number | null;
  visualCondition: string | null;
  triggeredRules: ProcessingRule[];
  aiExplanation: string;
  scientificValidationNote: string;
  model: string;
  analyzedAt: string;
}

// --- 3. Ask MangoCycle Contracts ---
export type AskMangoCycleToolName =
  | "get_total_waste"
  | "get_batches_by_status"
  | "get_batch_details"
  | "get_waste_by_source"
  | "get_waste_by_type"
  | "get_product_batch_details"
  | "get_product_batches_summary"
  | "get_dashboard_metrics"
  | "get_recent_lab_results"
  | "get_batch_count";

export interface AskMangoCycleToolCall {
  toolName: AskMangoCycleToolName;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface AskMangoCycleMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: AskMangoCycleToolCall[];
  isAiGenerated?: boolean;
  timestamp: string;
  model?: string;
}

export interface AskMangoCycleQueryInput {
  question: string;
}

// --- 4. AI Sustainability Insights Contracts ---
export interface SustainabilityCalculatedMetrics {
  totalWasteCollectedKg: number;
  totalWasteProcessedKg: number | null;
  totalBatches: number;
  completedBatches: number;
  activeBatches: number;
  productBatchesCount: number;
  wasteBySource: { sourceName: string; weightKg: number }[];
  wasteByType: { wasteType: string; label: string; weightKg: number }[];
  topSource: { name: string; weightKg: number } | null;
}

export interface AiSustainabilityInsightResponse {
  period: string;
  metrics: SustainabilityCalculatedMetrics;
  narrativeBullets: string[];
  aiSummary: string;
  model: string;
  generatedAt: string;
}
