"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  MapPin,
  Scale,
  Building,
  Recycle,
  Sparkles,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";
import { PublicHeader } from "@/components/traceability/PublicHeader";
import { PublicProcessingTimeline } from "@/components/traceability/PublicProcessingTimeline";
import { PublicTraceNotFound } from "@/components/traceability/PublicTraceNotFound";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { traceabilityService } from "@/data/services";
import { PublicWasteTraceability } from "@/data/contracts/traceability";
import { formatDate, formatWeightKg } from "@/lib/utils/formatters";

export default function PublicWasteTraceabilityPage() {
  const params = useParams();
  const batchCode = (params?.batchCode as string) || "";

  const [data, setData] = useState<PublicWasteTraceability | null>(null);
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
      const result = await traceabilityService.getPublicWasteTraceability(batchCode);
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
          <LoadingState message="Loading waste traceability record..." />
        </main>
      </div>
    );
  }

  if (isNotFound || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          <PublicTraceNotFound batchCode={batchCode} />
        </main>
      </div>
    );
  }

  const linkedProducts = data.linkedProductBatchCodes?.length
    ? data.linkedProductBatchCodes
    : data.linkedProductBatchCode
    ? [data.linkedProductBatchCode]
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col text-text-primary">
      {/* 1. Public Header */}
      <PublicHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 2. Batch Hero Card */}
        <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  Waste Batch Identifier
                </span>
                <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
                  {data.batchCode}
                </h1>
              </div>
              <StatusBadge status={data.currentStatus} size="md" />
            </div>

            <div className="pt-3 flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{data.wasteTypeLabel}</span>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Scale className="w-3 h-3 text-primary" />
                  <span>Weight</span>
                </span>
                <p className="font-mono font-bold text-sm text-text-primary">
                  {formatWeightKg(data.weightKg)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-text-secondary" />
                  <span>Collected</span>
                </span>
                <p className="font-medium text-xs text-text-primary">
                  {formatDate(data.collectionDate)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                  <Building className="w-3 h-3 text-text-secondary" />
                  <span>Source</span>
                </span>
                <p className="font-medium text-xs text-text-primary truncate">
                  {data.sourceName}
                </p>
              </div>

              {data.location && (
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-text-secondary" />
                    <span>Location</span>
                  </span>
                  <p className="font-medium text-xs text-text-primary truncate">
                    {data.location}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Processing Journey (Public-Safe Timeline) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Processing Journey</CardTitle>
            <CardDescription>
              Recorded milestone progression across the 9 canonical valorization stages.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <PublicProcessingTimeline timeline={data.timeline || []} />
          </CardContent>
        </Card>

        {/* 5. Circular Economy & Sustainability Information */}
        <Card variant="accent" className="bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Circular Value Recovery</CardTitle>
            </div>
            <CardDescription>
              Environmental diversion impact per platform traceability records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
              <span className="text-text-secondary font-medium">
                Waste Diverted from Disposal
              </span>
              <span className="font-mono font-bold text-sm text-primary">
                {formatWeightKg(data.sustainability?.wasteDivertedKg ?? data.weightKg)}
              </span>
            </div>

            {data.sustainability?.summary && (
              <p className="text-text-secondary leading-relaxed">
                {data.sustainability.summary}
              </p>
            )}

            {linkedProducts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <span className="text-text-secondary">
                    Formulated into Product{linkedProducts.length > 1 ? "s" : ""}:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {linkedProducts.map((pCode) => (
                    <span
                      key={pCode}
                      className="font-mono font-bold text-xs text-text-primary px-2 py-0.5 rounded bg-surface border border-border"
                    >
                      {pCode}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Traceability Record Footer */}
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
