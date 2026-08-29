import React from "react";
import Link from "next/link";
import { Microscope, ArrowRight, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LaboratoryTestListItem } from "@/data/contracts/laboratory";
import { formatDate } from "@/lib/utils/formatters";

interface RecentLabActivityCardProps {
  tests: LaboratoryTestListItem[];
}

export const RecentLabActivityCard: React.FC<RecentLabActivityCardProps> = ({ tests }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Recent Laboratory Activity</CardTitle>
          </div>
          <CardDescription>
            Spectroscopy, TEM characterization, and bioefficacy assays.
          </CardDescription>
        </div>
        <Link
          href="/laboratory"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {tests.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No recent laboratory tests recorded.
          </div>
        ) : (
          tests.map((test) => (
            <Link
              key={test.id}
              href={`/laboratory/${test.id}`}
              className="p-3 rounded-lg border border-border bg-surface hover:bg-surface-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group block"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {test.testType}
                  </span>
                  <StatusBadge status={test.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-text-secondary text-[11px]">
                  <span>
                    Target:{" "}
                    <strong className="text-text-primary font-mono">
                      {test.targetBatchCode}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Date: {formatDate(test.testDate)}</span>
                  {test.numericResultFormatted && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-primary font-medium">
                        {test.numericResultFormatted}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {test.attachmentCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{test.attachmentCount}</span>
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
