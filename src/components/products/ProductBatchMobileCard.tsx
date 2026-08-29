import React from "react";
import Link from "next/link";
import { ArrowRight, Edit3, FlaskConical, Calendar, Layers } from "lucide-react";
import { ProductBatchListItem } from "@/data/contracts/product-batch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatNumber } from "@/lib/utils/formatters";

interface ProductBatchMobileCardProps {
  batch: ProductBatchListItem;
  canEdit?: boolean;
}

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

export const ProductBatchMobileCard: React.FC<ProductBatchMobileCardProps> = ({
  batch,
  canEdit = false,
}) => {
  const labDef = LAB_STATUS_BADGES[batch.labTestingStatus] || LAB_STATUS_BADGES.pending;

  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            href={`/products/${batch.id}`}
            className="font-mono font-bold text-sm text-text-primary hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>{batch.batchCode}</span>
          </Link>
          <p className="font-semibold text-xs text-text-primary mt-0.5">{batch.productName}</p>
          {batch.productType && (
            <p className="text-[11px] text-text-secondary">{batch.productType}</p>
          )}
        </div>
        <StatusBadge status={batch.status} size="sm" />
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-2 border-t border-border/40">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-text-secondary/70">
            Quantity
          </span>
          <p className="font-mono font-bold text-text-primary">
            {batch.quantityProduced !== null
              ? `${formatNumber(batch.quantityProduced)} ${batch.unit || ""}`
              : "—"}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-text-secondary/70">
            Input Waste
          </span>
          <p className="font-mono font-semibold text-text-primary flex items-center gap-1">
            <Layers className="w-3 h-3 text-primary" />
            <span>{batch.linkedWasteCount} batch{batch.linkedWasteCount === 1 ? "" : "es"}</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${labDef.className}`}
          >
            {labDef.label}
          </span>
          <span className="text-[11px] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-text-secondary/70" />
            <span>{formatDate(batch.productionDate)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/products/${batch.id}/edit`}
              className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors"
              title="Edit Product Batch"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            href={`/products/${batch.id}`}
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
