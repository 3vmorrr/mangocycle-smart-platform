import React from "react";
import { CheckCircle2, Calendar } from "lucide-react";
import { PublicStageEvent } from "@/data/contracts/traceability";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface PublicProcessingTimelineProps {
  timeline: PublicStageEvent[];
}

export const PublicProcessingTimeline: React.FC<PublicProcessingTimelineProps> = ({
  timeline,
}) => {
  return (
    <ol className="relative border-s-2 border-border/80 ms-3 sm:ms-4 space-y-4 sm:space-y-5">
      {timeline.map((stage) => {
        return (
          <li key={stage.stageOrder} className="ms-6">
            {/* Bullet */}
            <span
              className={cn(
                "absolute -start-3 flex items-center justify-center w-6 h-6 rounded-full border-2 text-[11px] font-bold transition-all",
                stage.isCompleted
                  ? "bg-primary border-primary text-white shadow-2xs"
                  : stage.isCurrent
                  ? "bg-surface border-primary text-primary ring-4 ring-primary/20 shadow-xs"
                  : "bg-surface border-border text-text-secondary/50"
              )}
              aria-hidden="true"
            >
              {stage.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span>{stage.stageOrder}</span>
              )}
            </span>

            {/* Content Box */}
            <div
              className={cn(
                "p-3 sm:p-3.5 rounded-xl border text-xs transition-all",
                stage.isCurrent
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : stage.isCompleted
                  ? "bg-surface border-border"
                  : "bg-surface/30 border-border/50 opacity-60"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary text-xs sm:text-sm">
                    {stage.stageOrder}. {stage.stageName}
                  </span>
                  {stage.isCurrent && (
                    <span className="px-2 py-0.5 text-[9px] uppercase font-bold rounded-full bg-primary/20 text-primary border border-primary/30">
                      Active Stage
                    </span>
                  )}
                  {stage.isCompleted && (
                    <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Completed
                    </span>
                  )}
                </div>

                {stage.enteredAt && (
                  <div className="flex items-center gap-1 text-[11px] text-text-secondary font-mono">
                    <Calendar className="w-3 h-3 text-text-secondary/70" />
                    <span>{formatDate(stage.enteredAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
