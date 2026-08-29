import {
  PublicWasteTraceability,
  PublicProductTraceability,
} from "@/data/contracts/traceability";
import { apiRequest } from "./http";

export const supabaseTraceabilityAdapter = {
  async getPublicWasteTraceability(
    batchCode: string
  ): Promise<PublicWasteTraceability | null> {
    try {
      return await apiRequest<PublicWasteTraceability>(
        `/api/trace/waste/${encodeURIComponent(batchCode.trim())}`,
        { cache: "no-store" }
      );
    } catch {
      return null;
    }
  },

  async getPublicProductTraceability(
    batchCode: string
  ): Promise<PublicProductTraceability | null> {
    try {
      return await apiRequest<PublicProductTraceability>(
        `/api/trace/product/${encodeURIComponent(batchCode.trim())}`,
        { cache: "no-store" }
      );
    } catch {
      return null;
    }
  },
};
