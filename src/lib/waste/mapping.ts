import {
  WasteBatch,
  WasteBatchListItem,
  WasteSource,
  BatchStageHistory,
} from "@/data/contracts/waste-batch";
import { BatchStatus } from "@/lib/constants/stages";

export type DbWasteSourceRow = {
  id: string;
  name: string;
  source_type: string | null;
  location: string | null;
  contact_info: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbStageHistoryRow = {
  id: string;
  batch_id: string;
  stage_name: string;
  entered_at: string;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  performer?: { full_name: string | null } | null;
};

export type DbWasteBatchRow = {
  id: string;
  batch_code: string;
  waste_type: string;
  source_id: string | null;
  weight_kg: number | string;
  collection_date: string;
  location: string | null;
  visual_condition: string | null;
  moisture_status: string | null;
  storage_duration_days: number | null;
  notes: string | null;
  current_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  source?: { name: string } | null;
  creator?: { full_name: string | null } | null;
};

export function mapWasteSource(row: DbWasteSourceRow): WasteSource {
  return {
    id: row.id,
    name: row.name,
    sourceType: row.source_type,
    location: row.location,
    contactInfo: row.contact_info,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStageHistory(
  row: DbStageHistoryRow,
  stageOrderMap?: Record<string, number>
): BatchStageHistory {
  const stageOrder =
    stageOrderMap && row.stage_name
      ? stageOrderMap[row.stage_name.toLowerCase()] ?? 0
      : 0;

  return {
    id: row.id,
    batchId: row.batch_id,
    stageName: row.stage_name,
    stageOrder,
    enteredAt: row.entered_at,
    performedBy: row.performed_by,
    performerName: row.performer?.full_name ?? undefined,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapWasteBatch(
  row: DbWasteBatchRow,
  stageHistory?: BatchStageHistory[]
): WasteBatch {
  return {
    id: row.id,
    batchCode: row.batch_code,
    sourceId: row.source_id,
    sourceName: row.source?.name ?? (row.source_id ? "Unknown Source" : "Unassigned Source"),
    wasteType: row.waste_type as WasteBatch["wasteType"],
    weightKg: Number(row.weight_kg),
    collectionDate: row.collection_date,
    location: row.location,
    visualCondition: (row.visual_condition as WasteBatch["visualCondition"]) ?? null,
    moistureStatus: (row.moisture_status as WasteBatch["moistureStatus"]) ?? null,
    storageDurationDays: row.storage_duration_days,
    currentStatus: row.current_status as BatchStatus,
    notes: row.notes,
    createdBy: row.created_by,
    creatorName: row.creator?.full_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stageHistory: stageHistory ?? [],
  };
}

export function mapWasteBatchListItem(row: DbWasteBatchRow): WasteBatchListItem {
  return {
    id: row.id,
    batchCode: row.batch_code,
    wasteType: row.waste_type as WasteBatch["wasteType"],
    sourceName: row.source?.name ?? (row.source_id ? "Unknown Source" : "Unassigned Source"),
    weightKg: Number(row.weight_kg),
    collectionDate: row.collection_date,
    currentStatus: row.current_status as BatchStatus,
    updatedAt: row.updated_at,
  };
}
