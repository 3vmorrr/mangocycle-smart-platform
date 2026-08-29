/**
 * Canonical processing stages per GOVERNANCE.md and 05-DATABASE-SCHEMA.md
 */

export interface ProcessingStageDefinition {
  id: BatchStatus;
  name: string;
  stageOrder: number;
  order: number;
  description: string;
}

export type ProcessingStage = ProcessingStageDefinition;

export const CANONICAL_PROCESSING_STAGES: ProcessingStageDefinition[] = [
  { id: "collected", name: "Collected", stageOrder: 1, order: 1, description: "Waste collected from source" },
  { id: "sorted", name: "Sorted", stageOrder: 2, order: 2, description: "Sorted by type and visual inspection" },
  { id: "washed", name: "Washed", stageOrder: 3, order: 3, description: "Cleaned of dirt and foreign matter" },
  { id: "dried", name: "Dried", stageOrder: 4, order: 4, description: "Moisture reduction process" },
  { id: "ground", name: "Ground", stageOrder: 5, order: 5, description: "Milled into uniform powder" },
  { id: "extraction", name: "Extraction", stageOrder: 6, order: 6, description: "Active compound extraction" },
  { id: "production", name: "Production", stageOrder: 7, order: 7, description: "Formulation of final product" },
  { id: "laboratory_testing", name: "Laboratory Testing", stageOrder: 8, order: 8, description: "Quality and efficacy testing" },
  { id: "completed", name: "Completed", stageOrder: 9, order: 9, description: "Processing fully finished" },
];

export const BATCH_STATUS_VALUES = [
  "collected",
  "sorted",
  "washed",
  "dried",
  "ground",
  "extraction",
  "production",
  "laboratory_testing",
  "completed",
  "rejected",
] as const;

export type BatchStatus = (typeof BATCH_STATUS_VALUES)[number];

export const STAGE_NAME_MAP: Record<string, string> = {
  collected: "Collected",
  sorted: "Sorted",
  washed: "Washed",
  dried: "Dried",
  ground: "Ground",
  extraction: "Extraction",
  production: "Production",
  laboratory_testing: "Laboratory Testing",
  completed: "Completed",
  rejected: "Rejected",
};
