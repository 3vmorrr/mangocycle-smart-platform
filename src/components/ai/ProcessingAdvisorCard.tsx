"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { aiService, wasteBatchService } from "@/data/services";
import { ProcessingAdvisorResponse } from "@/data/contracts/ai";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";

export const ProcessingAdvisorCard: React.FC = () => {
  const [wasteBatches, setWasteBatches] = useState<WasteBatchListItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<ProcessingAdvisorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatches() {
      setIsLoadingBatches(true);
      try {
        const res = await wasteBatchService.getWasteBatches({ pageSize: 50 });
        setWasteBatches(res.items);
        if (res.items.length > 0) {
          setSelectedBatchId(res.items[0].id);
        }
      } catch {
        // non-blocking
      } finally {
        setIsLoadingBatches(false);
      }
    }
    loadBatches();
  }, []);

  const handleEvaluate = async () => {
    if (!selectedBatchId) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await aiService.getProcessingAdvice(selectedBatchId);
      setAdvisorResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to evaluate processing advice."
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <AiDisclaimer
        label="AI-Assisted Decision Support"
        description="The Processing Advisor uses a deterministic scientific rule engine to check batch attributes. The AI provides narrative explanations for why rules triggered, but never invents new thresholds or bypasses human scientific review."
      />

      {/* Batch Selection Strip */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <label
              htmlFor="advisor_batch_picker"
              className="text-xs font-semibold text-text-primary flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Select Waste Batch for Processing Evaluation:</span>
            </label>
            <select
              id="advisor_batch_picker"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={isLoadingBatches || isEvaluating}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
            >
              {wasteBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchCode} — {b.wasteType} ({b.currentStatus}, {b.weightKg} kg)
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="primary"
            className="self-end sm:self-auto shrink-0 mt-auto"
            isLoading={isEvaluating}
            onClick={handleEvaluate}
            disabled={!selectedBatchId || isLoadingBatches}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Evaluate Batch
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results View */}
      {advisorResult && (
        <div className="space-y-6">
          {/* Section 1: Recorded Input Data Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                1. Recorded Batch Attributes (Deterministic Input)
              </CardTitle>
              <CardDescription>
                Verified baseline attributes loaded directly from the platform repository.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-secondary">
                    Batch Code
                  </span>
                  <p className="font-mono font-bold text-sm text-text-primary">
                    {advisorResult.batchCode}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-secondary">
                    Current Stage
                  </span>
                  <p className="font-bold text-xs text-primary capitalize">
                    {advisorResult.currentStatusLabel}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-secondary">
                    Moisture Status
                  </span>
                  <p className="font-bold text-xs text-text-primary capitalize">
                    {advisorResult.moistureStatus || "Unspecified"}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-text-secondary">
                    Storage Duration
                  </span>
                  <p className="font-mono font-bold text-xs text-text-primary">
                    {advisorResult.storageDurationDays ?? 0} Day(s)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Deterministic Scientific Rule Engine Results */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  2. Scientific Rule Engine Evaluation
                </CardTitle>
                <CardDescription>
                  Rules triggered by matching deterministic conditions against batch data.
                </CardDescription>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                {advisorResult.triggeredRules.length} Rule(s) Triggered
              </span>
            </CardHeader>

            <CardContent className="space-y-3 pt-1 text-xs">
              {advisorResult.triggeredRules.length === 0 ? (
                <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold">
                    No critical risk or bottleneck rules triggered for this batch. Material is operating within standard parameters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {advisorResult.triggeredRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        rule.priority === "high"
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-secondary border border-border">
                            {rule.id}
                          </span>
                          <span className="font-bold text-text-primary text-xs">
                            {rule.name}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rule.priority === "high"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
                          }`}
                        >
                          {rule.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>

                      <p className="font-semibold text-text-primary text-xs">
                        👉 {rule.recommendation}
                      </p>

                      <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-secondary/40 p-2.5 rounded-lg border border-border/50">
                        <strong>Scientific Rationale:</strong> {rule.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: AI Narrative Explanation (Clearly Separated) */}
          <Card variant="accent" className="border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-base">3. AI Decision-Support Narrative</CardTitle>
              </div>
              <CardDescription>
                Natural language explanation synthesizing the scientific rule results for operators.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-purple-500/20 bg-surface text-text-primary leading-relaxed space-y-2 font-medium">
                <p>{advisorResult.aiExplanation}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono pt-1">
                <span>Model: {advisorResult.model}</span>
                <span>Evaluated: {advisorResult.analyzedAt.split("T")[0]}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Calibration Notice */}
          <div className="p-3 rounded-lg border border-border/80 bg-surface-secondary/30 text-[10px] text-text-secondary leading-relaxed flex items-center gap-2 font-mono">
            <Info className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            <span>{advisorResult.scientificValidationNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};
