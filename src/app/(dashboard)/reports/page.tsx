"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  History,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReportTemplateList } from "@/components/reports/ReportTemplateList";
import { ReportHistoryList } from "@/components/reports/ReportHistoryList";
import { LoadingState } from "@/components/ui/LoadingState";
import { reportService } from "@/data/services";
import { ReportHistoryItem } from "@/data/contracts/report";

export default function ReportsOverviewPage() {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const data = await reportService.getReportHistory();
        setHistory(data);
      } catch {
        // non-blocking
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <PageHeader
        title="Reports & Analytics"
        description="Structured operational dossiers, circular sustainability reporting, and laboratory assay summaries derived from verified platform data."
        breadcrumbs={[{ label: "Reports" }]}
        actions={
          <Link href="/reports/generate">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Generate New Report
            </Button>
          </Link>
        }
      />

      {/* 2. Reporting Framework Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Deterministic Metrics</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              Every number is computed from verified platform records. AI commentary summarizes but never calculates.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Scientific Safety</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              No uncalibrated formulas or speculative carbon offsets. Unresolved metrics are explicitly disclosed.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Export & Print Ready</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              Export clean CSVs with formula injection protection and generate formatted print/PDF snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Available Report Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-text-primary">Available Report Scopes</h2>
            <p className="text-xs text-text-secondary">
              Choose a standardized scope to configure date ranges and parameters
            </p>
          </div>
        </div>

        <ReportTemplateList />
      </div>

      {/* 4. Generated Session Reports */}
      <Card>
        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-text-secondary" />
            <CardTitle className="text-sm">Session Generated Reports</CardTitle>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary">
            {history.length} Record(s)
          </span>
        </CardHeader>

        <CardContent className="pt-3">
          {isLoading ? (
            <div className="py-8">
              <LoadingState message="Loading report history..." />
            </div>
          ) : (
            <ReportHistoryList reports={history} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
