import { WasteBatchListItem, WasteType } from "./waste-batch";
import { LaboratoryTestListItem } from "./laboratory";

export type DateRangeOption = "all" | "30d" | "7d";

export interface DashboardMetrics {
  totalWasteCollectedKg: number;
  totalWasteProcessedKg: number | null; // null: Pending authoritative scientific/product formula definition
  totalWasteBatchesCount: number;
  activeBatchesCount: number;
  completedBatchesCount: number;
  productBatchesCount: number;
  divertedWasteKg: number;
  processingEfficiencyRate: number | null; // null: Pending authoritative conversion formula definition
}

export interface WasteOverTimePoint {
  date: string;
  weightKg: number;
  batchCount: number;
}

export interface WasteBySourcePoint {
  sourceName: string;
  weightKg: number;
  percentage: number;
}

export interface WasteByTypePoint {
  wasteType: WasteType;
  label: string;
  weightKg: number;
  batchCount: number;
}

export interface BatchesByStagePoint {
  stageId: string;
  stageName: string;
  count: number;
}

export interface AttentionBatchItem extends WasteBatchListItem {
  attentionReason: string;
  urgency: "high" | "medium" | "low";
}

export interface SmartBinDeviceSummary {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  currentWeightKg: number;
  status: "active" | "idle" | "offline" | "inactive";
  lastReadingAt: string;
}

export interface AiInsightSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  generatedAt: string;
  period: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  wasteOverTime: WasteOverTimePoint[];
  wasteBySource: WasteBySourcePoint[];
  wasteByType: WasteByTypePoint[];
  batchesByStage: BatchesByStagePoint[];
  recentBatches: WasteBatchListItem[];
  batchesRequiringAttention: AttentionBatchItem[];
  recentLabActivity: LaboratoryTestListItem[];
  aiInsights: AiInsightSummary;
  smartBins: SmartBinDeviceSummary[];
}
