import React from "react";
import Link from "next/link";
import { ArrowRight, Edit3, FlaskConical, Layers, Paperclip, Calendar } from "lucide-react";
import { LaboratoryTestListItem } from "@/data/contracts/laboratory";
import { formatDate } from "@/lib/utils/formatters";

interface LabTestMobileCardProps {
  test: LaboratoryTestListItem;
  canEdit?: boolean;
}

const LAB_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-surface-secondary text-text-secondary border-border",
  },
};

export const LabTestMobileCard: React.FC<LabTestMobileCardProps> = ({
  test,
  canEdit = false,
}) => {
  const statusDef = LAB_STATUS_BADGES[test.status] || LAB_STATUS_BADGES.pending;
  const isProduct = test.targetBatchType === "product";
  const batchHref = isProduct
    ? `/products/${test.targetBatchId || test.targetBatchCode}`
    : `/waste-batches/${test.targetBatchId || test.targetBatchCode}`;

  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/laboratory/${test.id}`}
          className="font-bold text-sm text-text-primary hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{test.testType}</span>
        </Link>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusDef.className}`}
        >
          {statusDef.label}
        </span>
      </div>

      {/* Target Batch */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-secondary text-[11px]">Linked:</span>
        {test.targetBatchCode !== "Unassigned" ? (
          <Link
            href={batchHref}
            className="inline-flex items-center gap-1 font-mono font-bold text-xs text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded bg-surface-secondary/60 border border-border"
          >
            {isProduct ? (
              <FlaskConical className="w-3 h-3 text-purple-600" />
            ) : (
              <Layers className="w-3 h-3 text-primary" />
            )}
            <span>{test.targetBatchCode}</span>
          </Link>
        ) : (
          <span className="text-text-secondary italic">Unassigned</span>
        )}
      </div>

      {/* Recorded Result */}
      {(test.numericResultFormatted || test.resultSummary) && (
        <div className="p-2.5 rounded-lg border border-border/60 bg-surface-secondary/30 text-xs space-y-1">
          {test.numericResultFormatted && (
            <p className="font-mono font-bold text-primary">
              Result: {test.numericResultFormatted}
            </p>
          )}
          {test.resultSummary && (
            <p className="text-text-secondary text-[11px] line-clamp-2">
              {test.resultSummary}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/40">
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-text-secondary/70" />
            <span>{formatDate(test.testDate)}</span>
          </span>
          {test.attachmentCount > 0 && (
            <span className="flex items-center gap-1 font-mono">
              <Paperclip className="w-3 h-3" />
              <span>{test.attachmentCount}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/laboratory/${test.id}/edit`}
              className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors"
              title="Edit Laboratory Record"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            href={`/laboratory/${test.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
