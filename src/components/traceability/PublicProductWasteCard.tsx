import React from "react";
import Link from "next/link";
import { ArrowRight, Scale, Building, Calendar, Layers } from "lucide-react";
import { PublicProductWasteSource } from "@/data/contracts/traceability";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface PublicProductWasteCardProps {
  sources: PublicProductWasteSource[];
}

export const PublicProductWasteCard: React.FC<PublicProductWasteCardProps> = ({
  sources,
}) => {
  if (sources.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-text-secondary rounded-xl border border-border bg-surface">
        No source waste batches recorded for this formulation.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {sources.map((src) => (
        <div
          key={src.batchCode}
          className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-secondary/40 transition-colors flex flex-col justify-between gap-3 shadow-2xs group"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono font-bold text-sm text-text-primary">
                  {src.batchCode}
                </span>
              </div>
              <p className="text-xs font-semibold text-primary mt-0.5">
                {src.wasteTypeLabel}
              </p>
            </div>
            <StatusBadge status={src.currentStatus} size="sm" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-border/50">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                <Scale className="w-3 h-3 text-primary" />
                <span>Input Weight</span>
              </span>
              <p className="font-mono font-bold text-text-primary">
                {formatWeightKg(src.weightKg)}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-text-secondary flex items-center gap-1">
                <Building className="w-3 h-3 text-text-secondary" />
                <span>Source</span>
              </span>
              <p className="font-medium text-text-primary truncate">
                {src.sourceName}
              </p>
            </div>
          </div>

          {/* Footer & Public Navigation Link */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
            <div className="flex items-center gap-1 text-[11px] text-text-secondary">
              <Calendar className="w-3 h-3 text-text-secondary/70" />
              <span>{formatDate(src.collectionDate)}</span>
            </div>

            <Link
              href={src.traceUrl}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors group-hover:translate-x-0.5 duration-150"
            >
              <span>View Waste Traceability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};
