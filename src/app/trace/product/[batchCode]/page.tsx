"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Scale,
  Recycle,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  Layers,
  Activity,
  Check,
} from "lucide-react";
import { PublicHeader } from "@/components/traceability/PublicHeader";
import { PublicProductWasteCard } from "@/components/traceability/PublicProductWasteCard";
import { PublicTraceNotFound } from "@/components/traceability/PublicTraceNotFound";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { traceabilityService } from "@/data/services";
import { PublicProductTraceability } from "@/data/contracts/traceability";
import { formatDate, formatWeightKg, formatNumber } from "@/lib/utils/formatters";

const LAB_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Lab Pending",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  in_progress: {
    label: "Testing Active",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  passed: {
    label: "Lab Passed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  failed: {
    label: "Lab Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  not_applicable: {
    label: "N/A",
    className: "bg-surface-secondary text-text-secondary border-border",
  },
};

export default function PublicProductTraceabilityPage() {
  const params = useParams();
  const batchCode = (params?.batchCode as string) || "";

  const [data, setData] = useState<PublicProductTraceability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const loadData = useCallback(async () => {
    if (!batchCode) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsNotFound(false);
    try {
      const result = await traceabilityService.getPublicProductTraceability(batchCode);
      if (!result) {
        setIsNotFound(true);
      } else {
        setData(result);
      }
    } catch {
      setIsNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [batchCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <LoadingState message="Loading product traceability record..." />
        </main>
      </div>
    );
  }

  if (isNotFound || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          <PublicTraceNotFound batchCode={batchCode} recordType="product" />
        </main>
      </div>
    );
  }

  const labDef = LAB_STATUS_BADGES[data.labTestingStatus] || LAB_STATUS_BADGES.pending;

  return (
    <div className="min-h-screen bg-background flex flex-col text-text-primary">
      {/* 1. Public Header */}
      <PublicHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 2. Product Hero Card */}
        <Card className="border-t-4 border-t-purple-600 shadow-sm overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  Product Batch Identifier
                </span>
                <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
                  <FlaskConical className="w-6 h-6 text-purple-600 shrink-0" />
                  <span>{data.batchCode}</span>
                </h1>
              </div>
              <StatusBadge status={data.status} size="md" />
            </div>

            <div className="pt-3 space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                {data.productName}
              </h2>
              {data.productType && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{data.productType}</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Scale className="w-3 h-3 text-primary" />
                  <span>Quantity Produced</span>
                </span>
                <p className="font-mono font-bold text-sm text-text-primary">
                  {data.quantityProduced !== null
                    ? `${formatNumber(data.quantityProduced)} ${data.unit || ""}`
                    : "Unspecified"}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-text-secondary" />
                  <span>Production Date</span>
                </span>
                <p className="font-medium text-xs text-text-primary">
                  {formatDate(data.productionDate)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Layers className="w-3 h-3 text-primary" />
                  <span>Input Waste</span>
                </span>
                <p className="font-mono font-bold text-sm text-primary">
                  {formatWeightKg(data.totalWasteUsedKg)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Activity className="w-3 h-3 text-purple-600" />
                  <span>Lab Testing</span>
                </span>
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${labDef.className}`}
                  >
                    {labDef.label}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Contributing Source Waste Batches (CENTRAL TRACEABILITY SECTION) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Contributing Waste Batches</CardTitle>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                {(data.sourceWasteBatches || []).length} Input Batch{(data.sourceWasteBatches || []).length === 1 ? "" : "es"}
              </span>
            </div>
            <CardDescription>
              Raw agricultural waste materials transformed into this biological formulation. Tap any batch to inspect its full intake and processing journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <PublicProductWasteCard sources={data.sourceWasteBatches || []} />
          </CardContent>
        </Card>

        {/* 5. Circular Processing Journey Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Circular Processing Journey</CardTitle>
            </div>
            <CardDescription>
              End-to-end milestone progression from raw intake to finalized product formulation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {(data.processingJourneySummary || []).map((stage, idx) => (
                <div
                  key={stage}
                  className="p-2.5 rounded-lg border border-border/80 bg-surface-secondary/30 flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-text-secondary block">
                      Stage {idx + 1}
                    </span>
                    <span className="font-semibold text-text-primary text-[11px] truncate block">
                      {stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 6. Circular Economy & Sustainability Information */}
        <Card variant="accent" className="bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Circular Value Recovery</CardTitle>
            </div>
            <CardDescription>
              Organic waste diversion summary based on verified intake records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border bg-surface space-y-0.5">
                <span className="text-text-secondary text-[11px] font-medium block">
                  Total Waste Diverted
                </span>
                <span className="font-mono font-bold text-base text-primary">
                  {formatWeightKg(data.sustainability?.totalWasteDivertedKg)}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-surface space-y-0.5">
                <span className="text-text-secondary text-[11px] font-medium block">
                  Distinct Waste Sources
                </span>
                <span className="font-mono font-bold text-base text-text-primary">
                  {data.sustainability?.sourceCount !== undefined && data.sustainability?.sourceCount !== null
                    ? `${data.sustainability.sourceCount} Supplier${data.sustainability.sourceCount === 1 ? "" : "s"}`
                    : "—"}
                </span>
              </div>
            </div>

            {data.sustainability?.summary && (
              <p className="text-text-secondary leading-relaxed pt-1">
                {data.sustainability.summary}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 6. Traceability Record Footer */}
        <div className="pt-4 text-center space-y-1 text-xs text-text-secondary">
          <p className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Digital Traceability Record</span>
          </p>
          <p className="text-[10px] text-text-secondary/70 font-mono">
            Record timestamp: {formatDate(data.recordTimestamp, "en-US", { hour: "numeric", minute: "numeric" })}
          </p>
        </div>
      </main>
    </div>
  );
}
