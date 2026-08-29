import React from "react";
import { CheckCircle2, AlertTriangle, User, Calendar, FileText } from "lucide-react";
import { CANONICAL_PROCESSING_STAGES, BatchStatus } from "@/lib/constants/stages";
import { BatchStageHistory } from "@/data/contracts/waste-batch";
import { formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface ProcessingTimelineProps {
  currentStatus: BatchStatus;
  history?: BatchStageHistory[];
}

export const ProcessingTimeline: React.FC<ProcessingTimelineProps> = ({
  currentStatus,
  history = [],
}) => {
  const isRejected = currentStatus === "rejected";
  const rejectedEvent = history.find((h) => h.stageName?.toLowerCase() === "rejected");

  const currentStageIndex = CANONICAL_PROCESSING_STAGES.findIndex(
    (s) => s.id === currentStatus
  );

  return (
    <div className="space-y-6">
      {/* Rejection Alert Banner (if batch is rejected) */}
      {isRejected && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
            <span>Batch Rejected from Processing Pipeline</span>
          </div>
          <p className="text-text-primary">
            {rejectedEvent?.notes || "Batch has been permanently removed from the processing lifecycle."}
          </p>
          {rejectedEvent?.enteredAt && (
            <p className="text-[11px] text-text-secondary">
              Recorded on: {formatDate(rejectedEvent.enteredAt, "en-US", { hour: "numeric", minute: "numeric" })}
            </p>
          )}
        </div>
      )}

      {/* Sequential Canonical Timeline */}
      <ol className="relative border-s-2 border-border/80 ms-3 sm:ms-4 space-y-6">
        {CANONICAL_PROCESSING_STAGES.map((stage, idx) => {
          // Find matching event in history
          const event = history.find(
            (h) => h.stageName?.toLowerCase() === stage.name.toLowerCase()
          );

          const isCompleted =
            !isRejected && (currentStageIndex > idx || currentStatus === "completed");
          const isCurrent = !isRejected && currentStatus === stage.id;

          return (
            <li key={stage.id} className="ms-6 group">
              {/* Timeline Icon Bullet */}
              <span
                className={cn(
                  "absolute -start-3.5 flex items-center justify-center w-7 h-7 rounded-full border-2 text-xs font-bold transition-all",
                  isCompleted
                    ? "bg-primary border-primary text-white shadow-2xs"
                    : isCurrent
                    ? "bg-surface border-primary text-primary ring-4 ring-primary/20 shadow-xs"
                    : "bg-surface border-border text-text-secondary/60"
                )}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span>{stage.stageOrder}</span>
                )}
              </span>

              {/* Stage Card Content */}
              <div
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border text-xs transition-all",
                  isCurrent
                    ? "bg-primary/5 border-primary/40 shadow-xs"
                    : isCompleted
                    ? "bg-surface border-border"
                    : "bg-surface/40 border-border/60 opacity-70"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text-primary">
                      {stage.stageOrder}. {stage.name}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-primary/20 text-primary border border-primary/30">
                        Current Stage
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        Completed
                      </span>
                    )}
                  </div>

                  {event?.enteredAt && (
                    <div className="flex items-center gap-1 text-[11px] text-text-secondary font-mono">
                      <Calendar className="w-3 h-3 text-text-secondary/70" />
                      <span>{formatDate(event.enteredAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
                    </div>
                  )}
                </div>

                <p className="text-text-secondary text-[11px] mt-1">
                  {stage.description}
                </p>

                {/* Event Details (Performer & Notes) */}
                {event && (
                  <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-1.5 text-[11px]">
                    {event.performerName && (
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <User className="w-3 h-3 text-primary shrink-0" />
                        <span>Performed by: <strong className="text-text-primary">{event.performerName}</strong></span>
                      </div>
                    )}
                    {event.notes && (
                      <div className="flex items-start gap-1.5 text-text-secondary">
                        <FileText className="w-3 h-3 text-text-secondary/70 shrink-0 mt-0.5" />
                        <span className="italic text-text-primary">&ldquo;{event.notes}&rdquo;</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
