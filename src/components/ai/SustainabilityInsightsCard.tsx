"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Leaf,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { aiService } from "@/data/services";
import { AiSustainabilityInsightResponse } from "@/data/contracts/ai";
import { LoadingState } from "@/components/ui/LoadingState";

export const SustainabilityInsightsCard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-01");
  const [insights, setInsights] = useState<AiSustainabilityInsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await aiService.getSustainabilityInsights(selectedPeriod);
      setInsights(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate sustainability narrative."
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <AiDisclaimer
        label="AI-Assisted Sustainability Insights"
        description="The platform backend first computes exact deterministic aggregations across waste and product repositories. The AI subsequently synthesizes a professional narrative for stakeholders without fabricating speculative carbon or financial metrics."
      />

      {/* Control Strip */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-primary block">
                Reporting Period
              </span>
              <span className="text-[11px] text-text-secondary">
                Select aggregation time window for narrative synthesis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select reporting period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-medium"
            >
              <option value="2026-01">January 2026 (Current Cycle)</option>
              <option value="2025-12">December 2025</option>
              <option value="all">Lifetime Platform Total</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadInsights()}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="py-12">
          <LoadingState message="Aggregating platform metrics and generating sustainability narrative..." />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {insights && !isLoading && (
        <div className="space-y-6">
          {/* Section A: Verified Calculated Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Total Waste Diverted
              </span>
              <p className="font-mono font-extrabold text-xl text-primary">
                {insights.metrics.totalWasteCollectedKg} <span className="text-xs font-normal">kg</span>
              </p>
              <span className="text-[10px] text-text-secondary block">
                From {insights.metrics.totalBatches} intake batches
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Completed Batches
              </span>
              <p className="font-mono font-extrabold text-xl text-emerald-600">
                {insights.metrics.completedBatches}
              </p>
              <span className="text-[10px] text-text-secondary block">
                Fully processed
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Active in Pipeline
              </span>
              <p className="font-mono font-extrabold text-xl text-amber-600">
                {insights.metrics.activeBatches}
              </p>
              <span className="text-[10px] text-text-secondary block">
                Intermediate stages
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-secondary">
                Product Formulations
              </span>
              <p className="font-mono font-extrabold text-xl text-purple-600">
                {insights.metrics.productBatchesCount}
              </p>
              <span className="text-[10px] text-text-secondary block">
                Bio-formulation lots
              </span>
            </div>
          </div>

          {/* Section B: AI Generated Sustainability Narrative */}
          <Card variant="accent" className="border-purple-500/30">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">AI Circular Impact Summary</CardTitle>
                </div>
                <CardDescription>
                  Synthesized narrative highlighting circular throughput and supply achievements.
                </CardDescription>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold">
                AI Synthesized
              </span>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Executive Summary */}
              <div className="p-4 rounded-xl border border-purple-500/20 bg-surface text-text-primary leading-relaxed font-medium">
                {insights.aiSummary}
              </div>

              {/* Bulleted Insights */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                  Key Sustainability Takeaways
                </span>
                <ul className="space-y-2 p-3.5 rounded-xl border border-border bg-surface">
                  {insights.narrativeBullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-text-primary text-xs leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notice regarding uncalibrated metrics */}
              <div className="p-3 rounded-lg border border-border/80 bg-surface-secondary/30 text-[10px] text-text-secondary leading-relaxed flex items-center gap-2 font-mono">
                <Info className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                <span>
                  Note: Total Waste Processed formula and biological Yield ratio are currently awaiting authoritative definition by the scientific team and are omitted from AI estimations.
                </span>
              </div>

              {/* Audit Metadata */}
              <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono pt-1 border-t border-border/60">
                <span>Model: {insights.model}</span>
                <span>Generated: {insights.generatedAt.split("T")[0]}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
