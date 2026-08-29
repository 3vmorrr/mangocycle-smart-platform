import {
  ProductBatch,
  ProductBatchListItem,
  ProductBatchFilters,
  CreateProductBatchInput,
  UpdateProductBatchInput,
} from "@/data/contracts/product-batch";
import { PaginatedResult } from "@/data/contracts/types";
import { apiRequest } from "./http";

export const supabaseProductAdapter = {
  async getProductBatches(
    filters: ProductBatchFilters = {}
  ): Promise<PaginatedResult<ProductBatchListItem>> {
    const params = new URLSearchParams();
    if (filters.status !== undefined && filters.status !== "all") params.set("status", filters.status);
    if (filters.productType !== undefined && filters.productType !== "all") params.set("productType", filters.productType);
    if (filters.labTestingStatus !== undefined && filters.labTestingStatus !== "all") params.set("labTestingStatus", filters.labTestingStatus);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

    return apiRequest<PaginatedResult<ProductBatchListItem>>(
      `/api/products?${params.toString()}`,
      { cache: "no-store" }
    );
  },

  async getProductBatchById(idOrCode: string): Promise<ProductBatch | null> {
    try {
      const data = await apiRequest<{ product: ProductBatch }>(
        `/api/products/${encodeURIComponent(idOrCode)}`,
        { cache: "no-store" }
      );
      return data.product;
    } catch {
      return null;
    }
  },

  async getProductBatchByCode(code: string): Promise<ProductBatch | null> {
    return this.getProductBatchById(code);
  },

  async createProductBatch(input: CreateProductBatchInput): Promise<ProductBatch> {
    const data = await apiRequest<{ product: ProductBatch }>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.product;
  },

  async updateProductBatch(
    idOrCode: string,
    input: UpdateProductBatchInput
  ): Promise<ProductBatch> {
    const data = await apiRequest<{ product: ProductBatch }>(
      `/api/products/${encodeURIComponent(idOrCode)}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );
    return data.product;
  },
};
