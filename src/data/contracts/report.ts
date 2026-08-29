import { BaseEntity } from "./types";
import { WasteType } from "./waste-batch";

export type ReportType =
  | "waste_summary"
  | "product_traceability"
  | "laboratory_summary"
  | "sustainability"
  | "batch_report";

export interface ReportParameters {
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  wasteBatchId?: string;
  productBatchId?: string;
  includeAiNarrative?: boolean;
}

export interface ReportMetadata {
  id: string;
  title: string;
  reportType: ReportType;
  reportTypeLabel: string;
  generatedAt: string;
  periodLabel: string;
  startDate: string | null;
  endDate: string | null;
  generatedByName: string;
  isDemoData: boolean;
}

export interface ReportKPI {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  statusNote?: string;
}

export interface WasteReportRow {
  batchCode: string;
  wasteType: WasteType;
  wasteTypeLabel: string;
  sourceName: string;
  weightKg: number;
  collectionDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  stageCount: number;
}

export interface ProductReportRow {
  batchCode: string;
  productName: string;
  productType: string | null;
  productionDate: string | null;
  quantityProduced: number | null;
  unit: string | null;
  status: string;
  statusLabel: string;
  labTestingStatus: string;
  labTestingStatusLabel: string;
  linkedWasteCount: number;
  linkedWasteCodes: string[];
}

export interface LabReportRow {
  testType: string;
  targetBatchCode: string;
  targetBatchType: "waste" | "product" | "unassigned";
  testDate: string | null;
  status: string;
  numericResultFormatted: string | null;
  resultSummary: string | null;
}

export interface ReportChartPoint {
  name: string;
  value: number;
  count?: number;
}

export interface ReportData {
  metadata: ReportMetadata;
  kpis: ReportKPI[];
  wasteRows?: WasteReportRow[];
  productRows?: ProductReportRow[];
  labRows?: LabReportRow[];
  distributionByType?: ReportChartPoint[];
  distributionBySource?: ReportChartPoint[];
  aiNarrative?: {
    summary: string;
    bulletPoints: string[];
    model: string;
    generatedAt: string;
  };
  methodNotes: string[];
}

export interface ReportHistoryItem extends BaseEntity {
  title: string;
  reportType: ReportType;
  reportTypeLabel: string;
  periodLabel: string;
  generatedByName: string;
}
