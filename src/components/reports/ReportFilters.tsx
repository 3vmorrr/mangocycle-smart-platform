"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Layers,
  FlaskConical,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ReportType, ReportParameters } from "@/data/contracts/report";
import { REPORT_TEMPLATES } from "@/components/reports/ReportTemplateList";
import { wasteBatchService, productBatchService, reportService } from "@/data/services";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { ProductBatchListItem } from "@/data/contracts/product-batch";
import { generateReportParamsSchema } from "@/lib/validators/report";

export const ReportFilters: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as ReportType) || "waste_summary";

  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-01-31");
  const [wasteBatchId, setWasteBatchId] = useState<string>("");
  const [productBatchId, setProductBatchId] = useState<string>("");
  const [includeAiNarrative, setIncludeAiNarrative] = useState<boolean>(true);

  const [wasteBatches, setWasteBatches] = useState<WasteBatchListItem[]>([]);
  const [productBatches, setProductBatches] = useState<ProductBatchListItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [wRes, pRes] = await Promise.all([
          wasteBatchService.getWasteBatches({ pageSize: 50 }),
          productBatchService.getProductBatches({ pageSize: 50 }),
        ]);
        setWasteBatches(wRes.items);
        setProductBatches(pRes.items);
      } catch {
        // non-blocking
      }
    }
    loadOptions();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = generateReportParamsSchema.safeParse({
      reportType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      wasteBatchId: wasteBatchId || undefined,
      productBatchId: productBatchId || undefined,
      includeAiNarrative,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid report configuration.");
      return;
    }

    setIsGenerating(true);
    try {
      const params: ReportParameters = {
        reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        wasteBatchId: wasteBatchId || undefined,
        productBatchId: productBatchId || undefined,
        includeAiNarrative,
      };

      const result = await reportService.generateReport(params);
      router.push(`/reports/${result.metadata.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report snapshot."
      );
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Report Configuration Parameters</CardTitle>
          </div>
          <CardDescription>
            Select report template scope, date interval, and narrative settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {/* 1. Report Template Selection */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-text-primary">
              Select Report Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {REPORT_TEMPLATES.map((t) => (
                <label
                  key={t.type}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    reportType === t.type
                      ? "border-primary bg-primary/5 text-text-primary font-semibold"
                      : "border-border bg-surface hover:bg-surface-secondary/40 text-text-secondary"
                  }`}
                  onClick={() => setReportType(t.type)}
                >
                  <input
                    type="radio"
                    name="report_type"
                    checked={reportType === t.type}
                    onChange={() => {}}
                    className="mt-0.5"
                  />
                  <div className="min-w-0">
                    <span className="block text-text-primary text-[11px]">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-text-secondary font-normal line-clamp-1">
                      {t.scope}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Date Range Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label
                htmlFor="report_start_date"
                className="block font-semibold text-text-primary flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                <span>Start Date</span>
              </label>
              <input
                id="report_start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="report_end_date"
                className="block font-semibold text-text-primary flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                <span>End Date</span>
              </label>
              <input
                id="report_end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* 3. Conditional Batch Target Pickers */}
          {reportType === "batch_report" && (
            <div className="space-y-1 pt-2">
              <label
                htmlFor="report_waste_batch_picker"
                className="block font-semibold text-text-primary flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Target Waste Batch for Dossier</span>
              </label>
              <select
                id="report_waste_batch_picker"
                value={wasteBatchId}
                onChange={(e) => setWasteBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
              >
                <option value="">-- All Available Batches --</option>
                {wasteBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} ({b.wasteType}, {b.weightKg} kg)
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === "product_traceability" && (
            <div className="space-y-1 pt-2">
              <label
                htmlFor="report_product_batch_picker"
                className="block font-semibold text-text-primary flex items-center gap-1"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                <span>Filter by Product Formulation (Optional)</span>
              </label>
              <select
                id="report_product_batch_picker"
                value={productBatchId}
                onChange={(e) => setProductBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
              >
                <option value="">-- All Product Batches --</option>
                {productBatches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.batchCode} — {p.productName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. AI Narrative Toggle */}
          <div className="pt-2">
            <label className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAiNarrative}
                onChange={(e) => setIncludeAiNarrative(e.target.checked)}
                className="mt-0.5 text-purple-600 focus:ring-purple-500 rounded"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-text-primary text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Generate AI-Assisted Narrative Commentary</span>
                </span>
                <span className="text-[10px] text-text-secondary block leading-relaxed">
                  Synthesize an executive summary commentary from the verified report numbers.
                </span>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              isLoading={isGenerating}
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            >
              Generate Report Snapshot
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
