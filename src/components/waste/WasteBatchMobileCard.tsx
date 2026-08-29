import React from "react";
import Link from "next/link";
import { ArrowRight, Edit3, Calendar, Scale } from "lucide-react";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatWeightKg } from "@/lib/utils/formatters";

interface WasteBatchMobileCardProps {
  batch: WasteBatchListItem;
  canEdit?: boolean;
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Waste",
};

export const WasteBatchMobileCard: React.FC<WasteBatchMobileCardProps> = ({
  batch,
  canEdit = true,
}) => {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/waste-batches/${batch.id}`}
            className="font-mono font-bold text-sm text-text-primary hover:text-primary transition-colors"
          >
            {batch.batchCode}
          </Link>
          <span className="text-[11px] font-medium text-text-secondary">
            ({WASTE_TYPE_LABELS[batch.wasteType] || batch.wasteType})
          </span>
        </div>
        <StatusBadge status={batch.currentStatus} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-1 border-t border-border/40">
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-text-secondary/70">Source</span>
          <p className="font-medium text-text-primary truncate">{batch.sourceName}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-text-secondary/70">Weight</span>
          <p className="font-mono font-bold text-text-primary flex items-center gap-1">
            <Scale className="w-3 h-3 text-primary" />
            {formatWeightKg(batch.weightKg)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border/40">
        <div className="flex items-center gap-1 text-[11px]">
          <Calendar className="w-3 h-3 text-text-secondary/70" />
          <span>{formatDate(batch.collectionDate)}</span>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/waste-batches/${batch.id}/edit`}
              className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors"
              title="Edit Batch"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          )}
          <Link
            href={`/waste-batches/${batch.id}`}
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
