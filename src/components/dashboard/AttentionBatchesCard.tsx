import React from "react";
import Link from "next/link";
import { AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AttentionBatchItem } from "@/data/contracts/dashboard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatWeightKg } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface AttentionBatchesCardProps {
  batches: AttentionBatchItem[];
}

export const AttentionBatchesCard: React.FC<AttentionBatchesCardProps> = ({ batches }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Batches Requiring Attention</CardTitle>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {batches.length} Flagged
          </span>
        </div>
        <CardDescription>
          Manual operator intake flags recorded during reception (Statistical anomaly detection pending calibration).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {batches.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No active batches have manual intake flags recorded.
          </div>
        ) : (
          batches.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors",
                item.urgency === "high"
                  ? "bg-amber-50/40 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/50"
                  : "bg-surface border-border"
              )}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-text-primary">
                    {item.batchCode}
                  </span>
                  <StatusBadge status={item.currentStatus} size="sm" />
                  <span className="text-text-secondary font-mono">
                    {formatWeightKg(item.weightKg)}
                  </span>
                </div>
                <p className="text-text-secondary flex items-center gap-1.5 text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-medium text-text-primary">{item.attentionReason}</span>
                </p>
              </div>

              <Link
                href={`/waste-batches/${item.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors self-end sm:self-center shrink-0"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
