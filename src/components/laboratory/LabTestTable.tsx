import React from "react";
import Link from "next/link";
import { ArrowRight, Edit3, FlaskConical, Layers, Paperclip, Calendar } from "lucide-react";
import { LaboratoryTestListItem } from "@/data/contracts/laboratory";
import { formatDate } from "@/lib/utils/formatters";

interface LabTestTableProps {
  tests: LaboratoryTestListItem[];
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

export const LabTestTable: React.FC<LabTestTableProps> = ({
  tests,
  canEdit = false,
}) => {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-secondary/50 text-text-secondary text-[11px] uppercase tracking-wider font-semibold">
              <th scope="col" className="py-3 px-4 text-start">
                Test Type
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Linked Batch
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Test Date
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Status
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Recorded Result
              </th>
              <th scope="col" className="py-3 px-4 text-start">
                Files
              </th>
              <th scope="col" className="py-3 px-4 text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tests.map((test) => {
              const statusDef = LAB_STATUS_BADGES[test.status] || LAB_STATUS_BADGES.pending;
              const isProduct = test.targetBatchType === "product";
              const batchHref = isProduct
                ? `/products/${test.targetBatchId || test.targetBatchCode}`
                : `/waste-batches/${test.targetBatchId || test.targetBatchCode}`;

              return (
                <tr
                  key={test.id}
                  className="hover:bg-surface-secondary/40 transition-colors group"
                >
                  {/* 1. Test Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link
                      href={`/laboratory/${test.id}`}
                      className="font-semibold text-text-primary hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{test.testType}</span>
                    </Link>
                  </td>

                  {/* 2. Linked Batch */}
                  <td className="py-3 px-4 whitespace-nowrap">
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
                      <span className="text-text-secondary">—</span>
                    )}
                  </td>

                  {/* 3. Test Date */}
                  <td className="py-3 px-4 whitespace-nowrap text-text-secondary font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-text-secondary/70" />
                      <span>{formatDate(test.testDate)}</span>
                    </span>
                  </td>

                  {/* 4. Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusDef.className}`}
                    >
                      {statusDef.label}
                    </span>
                  </td>

                  {/* 5. Recorded Result */}
                  <td className="py-3 px-4">
                    {test.numericResultFormatted ? (
                      <span className="font-mono font-bold text-primary">
                        {test.numericResultFormatted}
                      </span>
                    ) : test.resultSummary ? (
                      <span className="text-text-primary truncate max-w-[200px] block">
                        {test.resultSummary}
                      </span>
                    ) : (
                      <span className="text-text-secondary italic">Pending</span>
                    )}
                  </td>

                  {/* 6. Attachments Count */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {test.attachmentCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-secondary">
                        <Paperclip className="w-3 h-3 text-text-secondary" />
                        <span>{test.attachmentCount}</span>
                      </span>
                    ) : (
                      <span className="text-text-secondary/60">—</span>
                    )}
                  </td>

                  {/* 7. Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-end">
                    <div className="inline-flex items-center gap-2">
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
