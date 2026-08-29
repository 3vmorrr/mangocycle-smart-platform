import React from "react";
import Link from "next/link";
import { Eye, Edit3, QrCode } from "lucide-react";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatWeightKg } from "@/lib/utils/formatters";

interface WasteBatchTableProps {
  batches: WasteBatchListItem[];
  canEdit?: boolean;
}

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Waste",
};

export const WasteBatchTable: React.FC<WasteBatchTableProps> = ({
  batches,
  canEdit = true,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
      <table className="w-full text-xs text-start">
        <thead>
          <tr className="border-b border-border/80 bg-surface/50 text-text-secondary font-semibold">
            <th className="py-3 px-4 text-start">Batch Code</th>
            <th className="py-3 px-4 text-start">Waste Type</th>
            <th className="py-3 px-4 text-start">Source</th>
            <th className="py-3 px-4 text-end">Weight</th>
            <th className="py-3 px-4 text-start">Collection Date</th>
            <th className="py-3 px-4 text-start">Current Stage</th>
            <th className="py-3 px-4 text-end">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {batches.map((batch) => (
            <tr
              key={batch.id}
              className="hover:bg-surface/80 transition-colors group"
            >
              <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                <Link
                  href={`/waste-batches/${batch.id}`}
                  className="hover:text-primary transition-colors focus-ring rounded"
                >
                  {batch.batchCode}
                </Link>
              </td>
              <td className="py-3.5 px-4 text-text-secondary font-medium">
                {WASTE_TYPE_LABELS[batch.wasteType] || batch.wasteType}
              </td>
              <td className="py-3.5 px-4 text-text-secondary truncate max-w-[180px]">
                {batch.sourceName}
              </td>
              <td className="py-3.5 px-4 text-end font-mono font-semibold text-text-primary">
                {formatWeightKg(batch.weightKg)}
              </td>
              <td className="py-3.5 px-4 text-text-secondary font-medium">
                {formatDate(batch.collectionDate)}
              </td>
              <td className="py-3.5 px-4">
                <StatusBadge status={batch.currentStatus} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-end">
                <div className="inline-flex items-center gap-1.5">
                  <Link
                    href={`/waste-batches/${batch.id}`}
                    className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors focus-ring"
                    title="View Batch Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/waste-batches/${batch.id}/edit`}
                      className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors focus-ring"
                      title="Edit Batch"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <Link
                    href={`/trace/waste/${batch.batchCode}`}
                    className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-primary transition-colors focus-ring"
                    title="Public Traceability"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
