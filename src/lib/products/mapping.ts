import {
  ProductBatch,
  ProductBatchListItem,
  LinkedWasteBatchSummary,
  ProductStatus,
  LabTestingStatus,
} from "@/data/contracts/product-batch";

export type DbProductBatchRow = {
  id: string;
  batch_code: string;
  product_name: string;
  product_type: string | null;
  production_date: string | null;
  quantity_produced: number | string | null;
  unit: string | null;
  status: string;
  lab_testing_status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { full_name: string | null } | null;
};

export type DbLinkedWasteRow = {
  waste_batch_id?: string;
  waste_batch?:
    | {
        id: string;
        batch_code: string;
        waste_type: string;
        source_id: string | null;
        weight_kg: number | string;
        collection_date: string;
        current_status: string;
        source?: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        batch_code: string;
        waste_type: string;
        source_id: string | null;
        weight_kg: number | string;
        collection_date: string;
        current_status: string;
        source?: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

export function mapLinkedWasteBatchSummary(row: DbLinkedWasteRow): LinkedWasteBatchSummary | null {
  const wb = Array.isArray(row.waste_batch) ? row.waste_batch[0] : row.waste_batch;
  if (!wb) return null;
  const source = Array.isArray(wb.source) ? wb.source[0] : wb.source;
  return {
    id: wb.id,
    batchCode: wb.batch_code,
    wasteType: wb.waste_type,
    sourceName: source?.name ?? (wb.source_id ? "Unknown Source" : "Unassigned Source"),
    weightKg: Number(wb.weight_kg),
    collectionDate: wb.collection_date,
    currentStatus: wb.current_status,
  };
}

export function mapProductBatch(
  row: DbProductBatchRow,
  linkedWasteBatches: LinkedWasteBatchSummary[] = []
): ProductBatch {
  return {
    id: row.id,
    batchCode: row.batch_code,
    productName: row.product_name,
    productType: row.product_type,
    productionDate: row.production_date,
    quantityProduced: row.quantity_produced !== null ? Number(row.quantity_produced) : null,
    unit: row.unit,
    status: row.status as ProductStatus,
    labTestingStatus: row.lab_testing_status as LabTestingStatus,
    notes: row.notes,
    createdBy: row.created_by,
    creatorName: row.creator?.full_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    linkedWasteBatches,
  };
}

export function mapProductBatchListItem(
  row: DbProductBatchRow,
  linkedWasteCodes: string[] = []
): ProductBatchListItem {
  return {
    id: row.id,
    batchCode: row.batch_code,
    productName: row.product_name,
    productType: row.product_type,
    productionDate: row.production_date,
    quantityProduced: row.quantity_produced !== null ? Number(row.quantity_produced) : null,
    unit: row.unit,
    status: row.status as ProductStatus,
    labTestingStatus: row.lab_testing_status as LabTestingStatus,
    linkedWasteCount: linkedWasteCodes.length,
    linkedWasteCodes,
    updatedAt: row.updated_at,
  };
}
