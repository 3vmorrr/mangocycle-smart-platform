import { BaseEntity } from "./types";
import { BatchStatus } from "@/lib/constants/stages";

export type WasteType = "mango_peel" | "mango_seed" | "mixed_mango_waste";
export type VisualCondition = "good" | "moderate" | "poor";
export type MoistureStatus = "dry" | "moderate" | "high";

export interface WasteSource extends BaseEntity {
  name: string;
  sourceType?: string | null;
  contactPerson?: string | null;
  contactInfo?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface BatchStageHistory {
  id: string;
  batchId: string;
  stageName: string;
  stageOrder: number;
  enteredAt: string;
  performedBy: string | null;
  performerName?: string | null;
  notes: string | null;
  createdAt?: string;
}

export interface WasteBatch extends BaseEntity {
  batchCode: string; // MW-YYYY-NNN
  sourceId: string | null;
  sourceName?: string | null;
  wasteType: WasteType;
  weightKg: number;
  collectionDate: string;
  location: string | null;
  visualCondition: VisualCondition | null;
  moistureStatus: MoistureStatus | null;
  storageDurationDays: number | null;
  currentStatus: BatchStatus;
  notes: string | null;
  createdBy: string | null;
  creatorName?: string | null;
  stageHistory?: BatchStageHistory[];
}

export interface WasteBatchListItem {
  id: string;
  batchCode: string;
  wasteType: WasteType;
  sourceName: string;
  weightKg: number;
  collectionDate: string;
  currentStatus: BatchStatus;
  updatedAt: string;
}

export interface WasteBatchFilters {
  status?: BatchStatus | "all";
  wasteType?: WasteType | "all";
  sourceId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateWasteBatchInput {
  waste_type: WasteType;
  source_id?: string | null;
  weight_kg: number;
  collection_date: string;
  location?: string | null;
  visual_condition?: VisualCondition | null;
  moisture_status?: MoistureStatus | null;
  storage_duration_days?: number | null;
  notes?: string | null;
}

export interface UpdateWasteBatchInput {
  waste_type?: WasteType;
  source_id?: string | null;
  weight_kg?: number;
  collection_date?: string;
  location?: string | null;
  visual_condition?: VisualCondition | null;
  moisture_status?: MoistureStatus | null;
  storage_duration_days?: number | null;
  notes?: string | null;
}

export interface AdvanceStageInput {
  notes?: string | null;
}

export interface RejectBatchInput {
  reason: string;
}
