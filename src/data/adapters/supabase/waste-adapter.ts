import {
  WasteBatch,
  WasteBatchListItem,
  WasteSource,
  WasteBatchFilters,
  CreateWasteBatchInput,
  UpdateWasteBatchInput,
  AdvanceStageInput,
  RejectBatchInput,
} from "@/data/contracts/waste-batch";
import { ProcessingStage } from "@/lib/constants/stages";
import { PaginatedResult } from "@/data/contracts/types";
import { apiRequest } from "./http";

export const supabaseWasteAdapter = {
  async getWasteSources(): Promise<WasteSource[]> {
    const data = await apiRequest<{ items: WasteSource[] }>("/api/waste/sources", {
      cache: "no-store",
    });
    return data.items;
  },

  async getProcessingStages(): Promise<ProcessingStage[]> {
    const data = await apiRequest<{ items: ProcessingStage[] }>("/api/waste/stages", {
      cache: "no-store",
    });
    return data.items;
  },

  async getWasteBatches(
    filters: WasteBatchFilters = {}
  ): Promise<PaginatedResult<WasteBatchListItem>> {
    const params = new URLSearchParams();
    if (filters.status !== undefined && filters.status !== "all") params.set("status", filters.status);
    if (filters.wasteType !== undefined && filters.wasteType !== "all") params.set("wasteType", filters.wasteType);
    if (filters.sourceId !== undefined && filters.sourceId !== "all") params.set("sourceId", filters.sourceId);
    if (filters.search) params.set("search", filters.search);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

    return apiRequest<PaginatedResult<WasteBatchListItem>>(
      `/api/waste/batches?${params.toString()}`,
      { cache: "no-store" }
    );
  },

  async getWasteBatchById(idOrCode: string): Promise<WasteBatch | null> {
    try {
      const data = await apiRequest<{ batch: WasteBatch }>(
        `/api/waste/batches/${encodeURIComponent(idOrCode)}`,
        { cache: "no-store" }
      );
      return data.batch;
    } catch {
      return null;
    }
  },

  async getWasteBatchByCode(code: string): Promise<WasteBatch | null> {
    return this.getWasteBatchById(code);
  },

  async createWasteBatch(input: CreateWasteBatchInput): Promise<WasteBatch> {
    const data = await apiRequest<{ batch: WasteBatch }>("/api/waste/batches", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.batch;
  },

  async updateWasteBatch(
    idOrCode: string,
    input: UpdateWasteBatchInput
  ): Promise<WasteBatch> {
    const data = await apiRequest<{ batch: WasteBatch }>(
      `/api/waste/batches/${encodeURIComponent(idOrCode)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return data.batch;
  },

  async advanceBatchStage(
    idOrCode: string,
    input: AdvanceStageInput
  ): Promise<WasteBatch> {
    const data = await apiRequest<{ batch: WasteBatch }>(
      `/api/waste/batches/${encodeURIComponent(idOrCode)}/advance`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return data.batch;
  },

  async rejectBatch(
    idOrCode: string,
    input: RejectBatchInput
  ): Promise<WasteBatch> {
    const data = await apiRequest<{ batch: WasteBatch }>(
      `/api/waste/batches/${encodeURIComponent(idOrCode)}/reject`,
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
    return data.batch;
  },
};
