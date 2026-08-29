import React from "react";
import Link from "next/link";
import { Layers, ArrowRight, Scale, Building, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LinkedWasteBatchSummary } from "@/data/contracts/product-batch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface InputWasteBatchesCardProps {
  linkedWasteBatches?: LinkedWasteBatchSummary[];
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Waste",
};

export const InputWasteBatchesCard: React.FC<InputWasteBatchesCardProps> = ({
  linkedWasteBatches = [],
}) => {
  const totalInputWeight = linkedWasteBatches.reduce((sum, b) => sum + (b.weightKg || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Input Waste Batches</CardTitle>
          </div>
          <CardDescription>
            Source raw material batches used in this product formulation.
          </CardDescription>
        </div>
        <div className="text-end">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">
            Total Input Weight
          </span>
          <span className="font-mono font-bold text-sm text-primary">
            {formatWeightKg(totalInputWeight)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {linkedWasteBatches.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No input waste batches are linked to this product record.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedWasteBatches.map((batch) => (
              <div
                key={batch.id}
                className="p-3.5 rounded-xl border border-border bg-surface-secondary/30 hover:bg-surface-secondary/60 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/waste-batches/${batch.id}`}
                      className="font-mono font-bold text-xs sm:text-sm text-text-primary hover:text-primary transition-colors"
                    >
                      {batch.batchCode}
                    </Link>
                    <span className="text-[11px] font-medium text-text-secondary">
                      ({WASTE_TYPE_LABELS[batch.wasteType] || batch.wasteType})
                    </span>
                  </div>
                  <StatusBadge status={batch.currentStatus} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary/70 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-primary" />
                      <span>Intake Weight</span>
                    </span>
                    <p className="font-mono font-bold text-text-primary">
                      {formatWeightKg(batch.weightKg)}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary/70 flex items-center gap-1">
                      <Building className="w-3 h-3 text-text-secondary" />
                      <span>Source</span>
                    </span>
                    <p className="font-medium text-text-primary truncate">
                      {batch.sourceName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary pt-1.5 border-t border-border/40">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-text-secondary/70" />
                    <span>{formatDate(batch.collectionDate)}</span>
                  </div>

                  <Link
                    href={`/waste-batches/${batch.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <span>View Waste Batch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
