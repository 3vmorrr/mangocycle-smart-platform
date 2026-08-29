import React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { formatDate, formatWeightKg } from "@/lib/utils/formatters";

interface RecentBatchesTableProps {
  batches: WasteBatchListItem[];
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Waste",
};

export const RecentBatchesTable: React.FC<RecentBatchesTableProps> = ({ batches }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Recent Waste Batches</CardTitle>
          <CardDescription>
            Latest registered intake batches awaiting or undergoing valorization.
          </CardDescription>
        </div>
        <Link
          href="/waste-batches"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-secondary">
            No waste batches registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-border/80 bg-surface/50 text-text-secondary font-semibold">
                  <th className="py-2.5 px-4 text-start">Batch Code</th>
                  <th className="py-2.5 px-4 text-start">Type</th>
                  <th className="py-2.5 px-4 text-start hidden sm:table-cell">Source</th>
                  <th className="py-2.5 px-4 text-end">Weight</th>
                  <th className="py-2.5 px-4 text-start hidden md:table-cell">Collection Date</th>
                  <th className="py-2.5 px-4 text-start">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-surface/80 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">
                      <Link
                        href={`/trace/waste/${b.batchCode}`}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors focus-ring rounded"
                        title="View Public Traceability Page"
                      >
                        <span>{b.batchCode}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-medium">
                      {WASTE_TYPE_LABELS[b.wasteType] || b.wasteType}
                    </td>
                    <td className="py-3 px-4 text-text-secondary truncate max-w-[160px] hidden sm:table-cell">
                      {b.sourceName}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-semibold text-text-primary">
                      {formatWeightKg(b.weightKg)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary hidden md:table-cell">
                      {formatDate(b.collectionDate)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.currentStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
