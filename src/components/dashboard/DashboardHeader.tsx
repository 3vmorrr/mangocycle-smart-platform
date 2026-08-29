"use client";

import React from "react";
import { RefreshCw, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateRangeOption } from "@/data/contracts/dashboard";
import { cn } from "@/lib/utils/cn";

interface DashboardHeaderProps {
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isRefreshing = false,
}) => {
  const options: { id: DateRangeOption; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "30d", label: "Last 30 Days" },
    { id: "7d", label: "Last 7 Days" },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/70">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Operational Dashboard
          </h1>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" />
            <span>Active Data View</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 text-balance">
          Intake tracking, processing timeline milestones, laboratory validation, and sustainability metrics.
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
        {/* Date Range Selector */}
        <div className="inline-flex items-center p-1 bg-surface border border-border rounded-lg text-xs font-medium shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-text-secondary ms-2 me-1.5 shrink-0" />
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onDateRangeChange(opt.id)}
              className={cn(
                "px-2.5 py-1 rounded transition-colors focus-ring",
                dateRange === opt.id
                  ? "bg-primary text-white font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Refresh Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />}
          title="Refresh dashboard metrics"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
