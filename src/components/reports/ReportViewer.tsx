"use client";

import React from "react";
import Link from "next/link";
import {
  Printer,
  Download,
  Calendar,
  User,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeft,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ReportData } from "@/data/contracts/report";
import { formatDate } from "@/lib/utils/formatters";
import { generateCsvContent, downloadCsvFile } from "@/lib/utils/csv";

interface ReportViewerProps {
  report: ReportData;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const { metadata, kpis, wasteRows, productRows, labRows, distributionByType, aiNarrative, methodNotes } = report;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number | null | undefined)[][] = [];

    if (wasteRows && wasteRows.length > 0) {
      headers = ["Batch Code", "Waste Type", "Source", "Weight (kg)", "Collection Date", "Current Stage", "Stage Count"];
      rows = wasteRows.map((r) => [
        r.batchCode,
        r.wasteTypeLabel,
        r.sourceName,
        r.weightKg,
        r.collectionDate,
        r.currentStatusLabel,
        r.stageCount,
      ]);
    } else if (productRows && productRows.length > 0) {
      headers = ["Batch Code", "Product Name", "Product Type", "Production Date", "Quantity", "Unit", "Lifecycle Status", "Lab Testing Status", "Linked Waste Batches"];
      rows = productRows.map((p) => [
        p.batchCode,
        p.productName,
        p.productType || "N/A",
        p.productionDate || "Date Unavailable",
        p.quantityProduced ?? "N/A",
        p.unit || "",
        p.statusLabel,
        p.labTestingStatusLabel,
        p.linkedWasteCount,
      ]);
    } else if (labRows && labRows.length > 0) {
      headers = ["Test Type", "Target Batch", "Target Type", "Test Date", "Workflow Status", "Quantitative Result", "Result Summary"];
      rows = labRows.map((l) => [
        l.testType,
        l.targetBatchCode,
        l.targetBatchType,
        l.testDate || "Date Unavailable",
        l.status,
        l.numericResultFormatted || "N/A",
        l.resultSummary || "N/A",
      ]);
    } else {
      headers = ["Metric", "Value", "Unit", "Subtext"];
      rows = kpis.map((k) => [k.label, k.value, k.unit || "", k.subtext || ""]);
    }

    const csvData = generateCsvContent(headers, rows);
    downloadCsvFile(`mangocycle-${metadata.reportType}-${metadata.startDate || "all"}.csv`, csvData);
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0 print:text-black">
      {/* 1. Print-Only Header */}
      <div className="hidden print:block border-b border-black/20 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-black">🥭 MangoCycle Smart Platform</h1>
            <p className="text-xs text-black/70">{metadata.title}</p>
          </div>
          <div className="text-right text-[10px] text-black/70">
            <p>Generated: {formatDate(metadata.generatedAt)}</p>
            <p>By: {metadata.generatedByName}</p>
          </div>
        </div>
      </div>

      {/* 2. On-Screen Action Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <Link href="/reports">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Reports Hub
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* 3. Document Header Card */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="pb-3 border-b border-border print:border-black/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                  {metadata.reportTypeLabel}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary">
                  Prototype Report
                </span>
              </div>
              <CardTitle className="text-lg pt-1 text-text-primary print:text-black">
                {metadata.title}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-secondary print:text-black/70 pt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period: <strong>{metadata.periodLabel}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Prepared by: <strong>{metadata.generatedByName}</strong></span>
            </span>
            <span className="font-mono text-[11px]">
              Generated: {formatDate(metadata.generatedAt, "en-US", { hour: "numeric", minute: "numeric" })}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-6">
          {/* Section A: KPI Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-surface-secondary/20 print:bg-white print:border-black/20 space-y-1"
              >
                <span className="text-[10px] uppercase font-bold text-text-secondary print:text-black/70 block">
                  {kpi.label}
                </span>
                <p className="font-mono font-extrabold text-xl text-primary print:text-black">
                  {kpi.value} {kpi.unit && <span className="text-xs font-normal">{kpi.unit}</span>}
                </p>
                {kpi.subtext && (
                  <span className="text-[10px] text-text-secondary print:text-black/60 block">
                    {kpi.subtext}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Section B: AI Narrative Commentary (Visually Separated) */}
          {aiNarrative && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 print:bg-white print:border-black/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 print:text-black" />
                  <h3 className="font-bold text-xs text-text-primary print:text-black">
                    AI-Assisted Executive Commentary
                  </h3>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold print:text-black">
                  Decision Support
                </span>
              </div>

              <p className="text-xs text-text-primary print:text-black leading-relaxed">
                {aiNarrative.summary}
              </p>

              <ul className="space-y-1.5 pt-1">
                {aiNarrative.bulletPoints.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] text-text-primary print:text-black leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 print:text-black" />
                    <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </li>
                ))}
              </ul>

              <div className="text-[9px] font-mono text-text-secondary print:text-black/50 pt-1 border-t border-purple-500/20">
                AI Model: {aiNarrative.model} | Narrative generated from pre-calculated metrics only.
              </div>
            </div>
          )}

          {/* Section C: Visual Chart Breakdown (if applicable) */}
          {distributionByType && distributionByType.length > 0 && (
            <div className="space-y-2 print:break-inside-avoid">
              <h3 className="font-bold text-xs text-text-primary print:text-black flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-primary print:text-black" />
                <span>Waste Mass Intake Distribution by Biomass Type</span>
              </h3>
              <div className="h-48 w-full p-2 border border-border rounded-xl bg-surface print:border-black/20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionByType} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="kg" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as { name: string; value: number };
                        return (
                          <div className="rounded-lg border border-border bg-surface p-2 shadow-md text-[11px]">
                            <p className="font-semibold text-text-primary">{data.name}</p>
                            <p className="text-primary font-mono">{data.value} kg</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Section D: Tabular Operational Data */}
          {wasteRows && wasteRows.length > 0 && (
            <div className="space-y-2 print:break-inside-avoid">
              <h3 className="font-bold text-xs text-text-primary print:text-black">
                Waste Batch Inventory & Stage Progression
              </h3>
              <div className="overflow-x-auto border border-border rounded-xl print:border-black/20">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-secondary/40 border-b border-border text-[11px] font-semibold text-text-secondary print:text-black print:bg-gray-100">
                      <th className="p-2.5">Batch Code</th>
                      <th className="p-2.5">Waste Type</th>
                      <th className="p-2.5">Origin Source</th>
                      <th className="p-2.5 text-end">Intake (kg)</th>
                      <th className="p-2.5">Collection Date</th>
                      <th className="p-2.5">Current Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 print:divide-black/10">
                    {wasteRows.map((row) => (
                      <tr key={row.batchCode} className="hover:bg-surface-secondary/20">
                        <td className="p-2.5 font-mono font-bold text-primary print:text-black">
                          {row.batchCode}
                        </td>
                        <td className="p-2.5">{row.wasteTypeLabel}</td>
                        <td className="p-2.5 text-text-secondary print:text-black">{row.sourceName}</td>
                        <td className="p-2.5 text-end font-mono font-bold">{row.weightKg.toFixed(2)}</td>
                        <td className="p-2.5 font-mono">{formatDate(row.collectionDate)}</td>
                        <td className="p-2.5">
                          <span className="font-medium text-text-primary print:text-black">
                            {row.currentStatusLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {productRows && productRows.length > 0 && (
            <div className="space-y-2 print:break-inside-avoid">
              <h3 className="font-bold text-xs text-text-primary print:text-black">
                Product Formulations & Linked Agricultural Lots
              </h3>
              <div className="overflow-x-auto border border-border rounded-xl print:border-black/20">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-secondary/40 border-b border-border text-[11px] font-semibold text-text-secondary print:text-black print:bg-gray-100">
                      <th className="p-2.5">Product Code</th>
                      <th className="p-2.5">Formulation</th>
                      <th className="p-2.5">Production Date</th>
                      <th className="p-2.5 text-end">Quantity</th>
                      <th className="p-2.5">Lifecycle Status</th>
                      <th className="p-2.5">Lab Testing Status</th>
                      <th className="p-2.5 text-center">Linked Waste Lots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 print:divide-black/10">
                    {productRows.map((row) => (
                      <tr key={row.batchCode} className="hover:bg-surface-secondary/20">
                        <td className="p-2.5 font-mono font-bold text-primary print:text-black">
                          {row.batchCode}
                        </td>
                        <td className="p-2.5">
                          <span className="font-medium">{row.productName}</span>
                          {row.productType && <span className="text-[10px] text-text-secondary block print:text-black/60">{row.productType}</span>}
                        </td>
                        <td className="p-2.5 font-mono">{row.productionDate ? formatDate(row.productionDate) : "Date Unavailable"}</td>
                        <td className="p-2.5 text-end font-mono font-bold">
                          {row.quantityProduced !== null ? `${row.quantityProduced} ${row.unit || ""}` : "N/A"}
                        </td>
                        <td className="p-2.5">{row.statusLabel}</td>
                        <td className="p-2.5">{row.labTestingStatusLabel}</td>
                        <td className="p-2.5 text-center font-mono">{row.linkedWasteCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {labRows && labRows.length > 0 && (
            <div className="space-y-2 print:break-inside-avoid">
              <h3 className="font-bold text-xs text-text-primary print:text-black">
                Laboratory Analytical Characterizations
              </h3>
              <div className="overflow-x-auto border border-border rounded-xl print:border-black/20">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-secondary/40 border-b border-border text-[11px] font-semibold text-text-secondary print:text-black print:bg-gray-100">
                      <th className="p-2.5">Assay Type</th>
                      <th className="p-2.5">Target Batch</th>
                      <th className="p-2.5">Test Date</th>
                      <th className="p-2.5">Workflow Status</th>
                      <th className="p-2.5 text-end">Quantitative Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 print:divide-black/10">
                    {labRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-secondary/20">
                        <td className="p-2.5 font-bold text-text-primary print:text-black">{row.testType}</td>
                        <td className="p-2.5 font-mono text-primary print:text-black">{row.targetBatchCode}</td>
                        <td className="p-2.5 font-mono">{row.testDate ? formatDate(row.testDate) : "Date Unavailable"}</td>
                        <td className="p-2.5 uppercase text-[10px] font-bold">{row.status}</td>
                        <td className="p-2.5 text-end font-mono font-bold">
                          {row.numericResultFormatted || "Qualitative Assay"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section E: Method & Calibration Data Notes */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/30 print:border-black/20 print:bg-white text-[11px] text-text-secondary print:text-black/70 space-y-1.5 font-mono">
            <p className="font-bold flex items-center gap-1 text-text-primary print:text-black">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Methodological & Data Governance Notes:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {methodNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          {/* Section F: Prototype Disclosure Footer */}
          <div className="pt-4 border-t border-border print:border-black/20 text-center text-[10px] text-text-secondary print:text-black/50">
            MangoCycle Smart Platform — Prototype Demonstration Report. Data derived from in-memory verified repository state.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
