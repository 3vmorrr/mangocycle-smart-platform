import { BaseEntity } from "./types";

export type ProductStatus =
  | "in_production"
  | "testing"
  | "completed"
  | "released"
  | "rejected";

export type LabTestingStatus =
  | "pending"
  | "in_progress"
  | "passed"
  | "failed"
  | "not_applicable";

export interface LinkedWasteBatchSummary {
  id: string;
  batchCode: string;
  wasteType: string;
  sourceName?: string | null;
  weightKg: number;
  collectionDate: string;
  currentStatus: string;
}

export interface ProductBatch extends BaseEntity {
  batchCode: string; // BF-YYYY-NNN per 05-DATABASE-SCHEMA.md §4.2
  productName: string;
  productType: string | null;
  productionDate: string | null;
  quantityProduced: number | null;
  unit: string | null;
  status: ProductStatus;
  labTestingStatus: LabTestingStatus;
  notes: string | null;
  createdBy: string | null;
  creatorName?: string;
  linkedWasteBatches?: LinkedWasteBatchSummary[];
}

export interface ProductBatchListItem {
  id: string;
  batchCode: string;
  productName: string;
  productType: string | null;
  productionDate: string | null;
  quantityProduced: number | null;
  unit: string | null;
  status: ProductStatus;
  labTestingStatus: LabTestingStatus;
  linkedWasteCount: number;
  linkedWasteCodes?: string[];
  updatedAt: string;
}

export interface ProductBatchFilters {
  search?: string;
  status?: ProductStatus | "all";
  productType?: string | "all";
  labTestingStatus?: LabTestingStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface CreateProductBatchInput {
  product_name: string;
  product_type?: string | null;
  production_date?: string | null;
  quantity_produced?: number | null;
  unit?: string | null;
  status?: ProductStatus;
  notes?: string | null;
  waste_batch_ids: string[]; // Minimum 1 per 25-VALIDATION-RULES.md §3
}

export interface UpdateProductBatchInput {
  product_name?: string;
  product_type?: string | null;
  production_date?: string | null;
  quantity_produced?: number | null;
  unit?: string | null;
  status?: ProductStatus;
  lab_testing_status?: LabTestingStatus;
  notes?: string | null;
  waste_batch_ids?: string[];
}
