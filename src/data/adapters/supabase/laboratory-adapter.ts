import {
  LaboratoryTest,
  LaboratoryTestListItem,
  LaboratoryAttachment,
  LaboratoryTestFilters,
  CreateLaboratoryTestInput,
  UpdateLaboratoryTestInput,
} from "@/data/contracts/laboratory";
import { PaginatedResult } from "@/data/contracts/types";
import { apiRequest } from "./http";

export const supabaseLaboratoryAdapter = {
  async getLaboratoryTests(
    filters: LaboratoryTestFilters = {}
  ): Promise<PaginatedResult<LaboratoryTestListItem>> {
    const params = new URLSearchParams();
    if (filters.status !== undefined && filters.status !== "all") params.set("status", filters.status);
    if (filters.testType !== undefined && filters.testType !== "all") params.set("testType", filters.testType);
    if (filters.targetBatchType !== undefined && filters.targetBatchType !== "all") {
      params.set("targetBatchType", filters.targetBatchType);
    }
    if (filters.wasteBatchId) params.set("wasteBatchId", filters.wasteBatchId);
    if (filters.productBatchId) params.set("productBatchId", filters.productBatchId);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

    return apiRequest<PaginatedResult<LaboratoryTestListItem>>(
      `/api/laboratory?${params.toString()}`,
      { cache: "no-store" }
    );
  },

  async getLaboratoryTestById(id: string): Promise<LaboratoryTest | null> {
    try {
      const data = await apiRequest<{ test: LaboratoryTest }>(
        `/api/laboratory/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      return data.test;
    } catch {
      return null;
    }
  },

  async createLaboratoryTest(
    input: CreateLaboratoryTestInput
  ): Promise<LaboratoryTest> {
    const data = await apiRequest<{ test: LaboratoryTest }>("/api/laboratory", {
      method: "POST",
      body: JSON.stringify({
        test_type: input.test_type,
        waste_batch_id: input.waste_batch_id || null,
        product_batch_id: input.product_batch_id || null,
        test_date: input.test_date || null,
        status: input.status,
        result_summary: input.result_summary || null,
        numeric_result: input.numeric_result ?? null,
        result_unit: input.result_unit || null,
        researcher_notes: input.researcher_notes || null,
      }),
    });

    return data.test;
  },

  async updateLaboratoryTest(
    id: string,
    input: UpdateLaboratoryTestInput
  ): Promise<LaboratoryTest> {
    const data = await apiRequest<{ test: LaboratoryTest }>(
      `/api/laboratory/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          test_type: input.test_type,
          waste_batch_id: input.waste_batch_id || null,
          product_batch_id: input.product_batch_id || null,
          test_date: input.test_date || null,
          status: input.status,
          result_summary: input.result_summary || null,
          numeric_result: input.numeric_result ?? null,
          result_unit: input.result_unit || null,
          researcher_notes: input.researcher_notes || null,
        }),
      }
    );

    return data.test;
  },

  async deleteLaboratoryTest(id: string): Promise<void> {
    await apiRequest<{ success: boolean }>(
      `/api/laboratory/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  async uploadAttachment(testId: string, file: File): Promise<LaboratoryAttachment> {
    const formData = new FormData();
    formData.append("file", file);

    const data = await apiRequest<{ attachment: LaboratoryAttachment }>(
      `/api/laboratory/${encodeURIComponent(testId)}/attachments`,
      {
        method: "POST",
        body: formData,
      }
    );

    return data.attachment;
  },

  async getAttachmentDownloadUrl(
    testId: string,
    attachmentId: string
  ): Promise<{ signedUrl: string; fileName: string }> {
    return apiRequest<{ signedUrl: string; fileName: string }>(
      `/api/laboratory/${encodeURIComponent(testId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { cache: "no-store" }
    );
  },

  async deleteAttachment(testId: string, attachmentId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(
      `/api/laboratory/${encodeURIComponent(testId)}/attachments/${encodeURIComponent(attachmentId)}`,
      { method: "DELETE" }
    );
  },
};
