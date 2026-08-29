import { BaseEntity } from "./types";

export type LabTestStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface LaboratoryAttachment extends BaseEntity {
  testId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;
  uploadedBy: string | null;
}

export interface LaboratoryTest extends BaseEntity {
  testType: string;
  wasteBatchId: string | null;
  wasteBatchCode?: string | null;
  productBatchId: string | null;
  productBatchCode?: string | null;
  testDate: string | null;
  status: LabTestStatus;
  resultSummary: string | null;
  numericResult: number | null;
  resultUnit: string | null;
  researcherNotes: string | null;
  createdBy: string | null;
  creatorName?: string | null;
  attachments?: LaboratoryAttachment[];
}

export interface LaboratoryTestListItem {
  id: string;
  testType: string;
  targetBatchCode: string;
  targetBatchType: "waste" | "product" | "unassigned";
  targetBatchId: string | null;
  testDate: string | null;
  status: LabTestStatus;
  numericResultFormatted: string | null;
  resultSummary?: string | null;
  attachmentCount: number;
  updatedAt: string;
}

export interface LaboratoryTestFilters {
  search?: string;
  testType?: string | "all";
  status?: LabTestStatus | "all";
  targetBatchType?: "all" | "waste" | "product";
  wasteBatchId?: string;
  productBatchId?: string;
  page?: number;
  pageSize?: number;
}

export interface AttachmentInput {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface CreateLaboratoryTestInput {
  test_type: string;
  waste_batch_id?: string | null;
  product_batch_id?: string | null;
  test_date?: string | null;
  status: LabTestStatus;
  result_summary?: string | null;
  numeric_result?: number | null;
  result_unit?: string | null;
  researcher_notes?: string | null;
  attachments?: AttachmentInput[];
}

export interface UpdateLaboratoryTestInput {
  test_type?: string;
  waste_batch_id?: string | null;
  product_batch_id?: string | null;
  test_date?: string | null;
  status?: LabTestStatus;
  result_summary?: string | null;
  numeric_result?: number | null;
  result_unit?: string | null;
  researcher_notes?: string | null;
  attachments?: AttachmentInput[];
}
