import React from "react";
import Link from "next/link";
import { FileSpreadsheet, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ReportHistoryItem } from "@/data/contracts/report";
import { formatDate } from "@/lib/utils/formatters";

interface ReportHistoryListProps {
  reports: ReportHistoryItem[];
}

export const ReportHistoryList: React.FC<ReportHistoryListProps> = ({ reports }) => {
  if (reports.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary text-xs">
        No reports generated yet in this session. Choose a template above to configure and generate a report.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((rep) => (
        <div
          key={rep.id}
          className="p-4 rounded-xl border border-border bg-surface hover:border-border/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/reports/${rep.id}`}
                  className="font-bold text-text-primary hover:text-primary transition-colors truncate"
                >
                  {rep.title}
                </Link>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-secondary border border-border text-text-secondary">
                  {rep.reportTypeLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Period: {rep.periodLabel}</span>
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>By: {rep.generatedByName}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-[10px] font-mono text-text-secondary hidden md:inline">
              {formatDate(rep.createdAt, "en-US", { hour: "numeric", minute: "numeric" })}
            </span>
            <Link href={`/reports/${rep.id}`}>
              <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                View Report
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};
