"use client";

import React from "react";
import { GitCommit, Sparkles, ArrowRight } from "lucide-react";
import { CANONICAL_PROCESSING_STAGES } from "@/lib/constants/stages";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export default function AdminStagesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-primary" />
          <span>Canonical Processing Stages</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Authoritative 8-stage linear transformation pipeline per 06-PROCESSING-PIPELINE.md
        </p>
      </div>

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary block font-semibold">
            Strict Linear Progression Architecture (06-PROCESSING-PIPELINE.md §3)
          </strong>
          <p className="text-[11px] leading-relaxed">
            Waste batches advance strictly through ordered sequential stages: Collected → Sorted → Washed → Dried → Ground → Extracted → Formulated → Completed. Batches may be rejected at any intermediate stage.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Configured Processing Sequence</CardTitle>
          <CardDescription>
            Ordered lifecycle stages governing Waste Batch progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {CANONICAL_PROCESSING_STAGES.map((stage, idx) => (
              <div key={stage.id} className="p-4 flex items-center justify-between hover:bg-surface-secondary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                    {stage.stageOrder}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-text-primary block">
                      {stage.name}
                    </span>
                    <span className="text-[11px] text-text-secondary font-mono">
                      stage_id: {stage.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border">
                    Order #{stage.stageOrder}
                  </span>
                  {idx < CANONICAL_PROCESSING_STAGES.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-text-secondary/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
