import { WasteType } from "./waste-batch";
import { BatchStatus } from "@/lib/constants/stages";
import { ProductStatus, LabTestingStatus } from "./product-batch";

/**
 * Public Traceability Contracts (Strict Allowlist DTOs)
 * 
 * CRITICAL SECURITY CONTRACT:
 * These DTOs define ONLY public-safe fields permitted for public display per
 * 08-SECURITY.md §11.1, 11-WASTE-TRACEABILITY.md §4.3, and 12-PRODUCT-TRACEABILITY.md §5.3.
 * 
 * UNDER NO CIRCUMSTANCES should internal database UUIDs, created_by,
 * researcher notes, source contact information (phone, email, contact person),
 * operator identities on stage history, private lab notes/attachments, or
 * audit logs be added to these contracts.
 */

export interface PublicStageEvent {
  stageName: string;
  stageOrder: number;
  enteredAt: string; // ISO datetime
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface PublicWasteSustainability {
  wasteDivertedKg: number; // weightKg diverted from agricultural disposal per 11-WASTE-TRACEABILITY.md §5
  summary: string;
}

export interface PublicWasteTraceability {
  batchCode: string; // Canonical public code format: MW-YYYY-NNN
  wasteType: WasteType;
  wasteTypeLabel: string;
  sourceName: string; // Approved public supplier name only
  weightKg: number;
  collectionDate: string;
  location: string | null; // General facility area (e.g. Campus Farm Unit B)
  currentStatus: BatchStatus;
  currentStatusLabel: string;
  timeline: PublicStageEvent[];
  linkedProductBatchCodes: string[]; // Dynamically derived from shared product_waste_links
  linkedProductBatchCode: string | null; // Primary linked product for backwards compatibility
  sustainability: PublicWasteSustainability;
  recordTimestamp: string; // Neutral database record/update timestamp
}

/**
 * Public Source Waste Summary embedded in Product Traceability
 * per 12-PRODUCT-TRACEABILITY.md §5.3
 */
export interface PublicProductWasteSource {
  batchCode: string; // MW-YYYY-NNN
  wasteType: WasteType;
  wasteTypeLabel: string;
  sourceName: string; // Public supplier name only
  weightKg: number;
  collectionDate: string;
  currentStatus: BatchStatus;
  currentStatusLabel: string;
  traceUrl: string; // /trace/waste/MW-YYYY-NNN
}

export interface PublicProductSustainability {
  totalWasteDivertedKg: number; // Sum of contributing waste batch weights
  sourceCount: number; // Distinct supplier sources
  summary: string;
}

/**
 * Public Product Traceability Contract (Strict Allowlist DTO)
 * per 08-SECURITY.md §11.1 & 12-PRODUCT-TRACEABILITY.md §5.3
 */
export interface PublicProductTraceability {
  batchCode: string; // Canonical public code format: BF-YYYY-NNN
  productName: string;
  productType: string | null;
  productionDate: string | null;
  quantityProduced: number | null;
  unit: string | null;
  status: ProductStatus;
  statusLabel: string;
  labTestingStatus: LabTestingStatus;
  labTestingStatusLabel: string;
  sourceWasteBatches: PublicProductWasteSource[];
  totalWasteUsedKg: number;
  processingJourneySummary: string[];
  sustainability: PublicProductSustainability;
  recordTimestamp: string; // Neutral database record/update timestamp
}
