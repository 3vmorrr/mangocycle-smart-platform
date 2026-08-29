import React from "react";
import Link from "next/link";
import { ArrowRight, Edit3, FlaskConical, Layers } from "lucide-react";
import { ProductBatchListItem } from "@/data/contracts/product-batch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatNumber } from "@/lib/utils/formatters";

interface ProductBatchTableProps {
  batches: ProductBatchListItem[];
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

export const ProductBatchTable: React.FC<ProductBatchTableProps> = ({
  batches,
  canEdit = false,
}) => {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-secondary/50 text-text-secondary text-[11px] uppercase tracking-wider font-semibold">
              <th scope="col" className="py-3 px-4 text-start">
                Product Code
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Product Name / Type
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Production Date
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Quantity
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Product Status
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Lab Assay Status
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Input Waste
              </th>
              <th scope="col" className="py-3 px-4 text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {batches.map((batch) => {
              const labDef = LAB_STATUS_BADGES[batch.labTestingStatus] || LAB_STATUS_BADGES.pending;

              return (
                <tr
                  key={batch.id}
                  className="hover:bg-surface-secondary/40 transition-colors group"
                >
                  {/* 1. Batch Code */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link
                      href={`/products/${batch.id}`}
                      className="font-mono font-bold text-text-primary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{batch.batchCode}</span>
                    </Link>
                  </td>

                  {/* 2. Product Name & Type */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text-primary">
                      {batch.productName}
                    </div>
                    {batch.productType && (
                      <div className="text-[11px] text-text-secondary">
                        {batch.productType}
                      </div>
                    )}
                  </td>

                  {/* 3. Production Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-text-secondary font-mono">
                    {formatDate(batch.productionDate)}
                  </td>

                  {/* 4. Quantity Produced */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {batch.quantityProduced !== null ? (
                      <span className="font-mono font-bold text-text-primary">
                        {formatNumber(batch.quantityProduced)} {batch.unit || ""}
                      </span>
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>

                  {/* 5. Product Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={batch.status} size="sm" />
                  </td>

                  {/* 6. Lab Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${labDef.className}`}
                    >
                      {labDef.label}
                    </span>
                  </td>

                  {/* 7. Linked Waste Batches */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-[11px] font-mono font-semibold text-text-primary border border-border">
                        <Layers className="w-3 h-3 text-primary" />
                        <span>{batch.linkedWasteCount} input{batch.linkedWasteCount === 1 ? "" : "s"}</span>
                      </span>
                    </div>
                  </td>

                  {/* 8. Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-end">
                    <div className="inline-flex items-center gap-2">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
