import {
  LaboratoryTest,
  LaboratoryTestListItem,
  LaboratoryAttachment,
  LabTestStatus,
} from "@/data/contracts/laboratory";

export type DbLaboratoryAttachmentRow = {
  id: string;
  test_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at?: string;
};

export type DbLaboratoryTestRow = {
  id: string;
  test_type: string;
  waste_batch_id: string | null;
  product_batch_id: string | null;
  test_date: string | null;
  status: string;
  result_summary: string | null;
  numeric_result: number | string | null;
  result_unit: string | null;
  researcher_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { full_name: string | null } | { full_name: string | null }[] | null;
  waste_batch?: { batch_code: string } | { batch_code: string }[] | null;
  product_batch?: { batch_code: string } | { batch_code: string }[] | null;
};

export function mapLaboratoryAttachment(row: DbLaboratoryAttachmentRow): LaboratoryAttachment {
  return {
    id: row.id,
    testId: row.test_id,
    fileName: row.file_name,
    storagePath: row.file_path,
    fileSizeBytes: row.file_size_bytes ? Number(row.file_size_bytes) : 0,
    mimeType: row.mime_type || "application/octet-stream",
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function mapLaboratoryTest(
  row: DbLaboratoryTestRow,
  attachments: LaboratoryAttachment[] = []
): LaboratoryTest {
  const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
  const wasteBatch = Array.isArray(row.waste_batch) ? row.waste_batch[0] : row.waste_batch;
  const productBatch = Array.isArray(row.product_batch) ? row.product_batch[0] : row.product_batch;

  return {
    id: row.id,
    testType: row.test_type,
    wasteBatchId: row.waste_batch_id,
    wasteBatchCode: wasteBatch?.batch_code ?? null,
    productBatchId: row.product_batch_id,
    productBatchCode: productBatch?.batch_code ?? null,
    testDate: row.test_date,
    status: row.status as LabTestStatus,
    resultSummary: row.result_summary,
    numericResult: row.numeric_result !== null ? Number(row.numeric_result) : null,
    resultUnit: row.result_unit,
    researcherNotes: row.researcher_notes,
    createdBy: row.created_by,
    creatorName: creator?.full_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments,
  };
}

export function mapLaboratoryTestListItem(
  row: DbLaboratoryTestRow,
  attachmentCount: number = 0
): LaboratoryTestListItem {
  const wasteBatch = Array.isArray(row.waste_batch) ? row.waste_batch[0] : row.waste_batch;
  const productBatch = Array.isArray(row.product_batch) ? row.product_batch[0] : row.product_batch;

  let targetBatchCode = "Unassigned";
  let targetBatchType: "waste" | "product" | "unassigned" = "unassigned";
  let targetBatchId: string | null = null;

  if (row.product_batch_id) {
    targetBatchType = "product";
    targetBatchId = row.product_batch_id;
    targetBatchCode = productBatch?.batch_code ?? "Product Batch";
  } else if (row.waste_batch_id) {
    targetBatchType = "waste";
    targetBatchId = row.waste_batch_id;
    targetBatchCode = wasteBatch?.batch_code ?? "Waste Batch";
  }

  let numericResultFormatted: string | null = null;
  if (row.numeric_result !== null && row.numeric_result !== undefined) {
    numericResultFormatted = row.result_unit
      ? `${row.numeric_result} ${row.result_unit}`
      : `${row.numeric_result}`;
  }

  return {
    id: row.id,
    testType: row.test_type,
    targetBatchCode,
    targetBatchType,
    targetBatchId,
    testDate: row.test_date,
    status: row.status as LabTestStatus,
    numericResultFormatted,
    resultSummary: row.result_summary,
    attachmentCount,
    updatedAt: row.updated_at,
  };
}
