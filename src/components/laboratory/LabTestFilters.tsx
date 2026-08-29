import React from "react";
import { Search, X, Filter } from "lucide-react";
import { LabTestStatus } from "@/data/contracts/laboratory";

interface LabTestFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: LabTestStatus | "all";
  onStatusChange: (status: LabTestStatus | "all") => void;
  targetBatchType: "all" | "product" | "waste";
  onTargetBatchTypeChange: (type: "all" | "product" | "waste") => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const LabTestFilters: React.FC<LabTestFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  targetBatchType,
  onTargetBatchTypeChange,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/70" />
          <input
            type="text"
            placeholder="Search by test type (e.g. UV-Vis, TEM) or batch code (MW-..., BF-...)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as LabTestStatus | "all")}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Filter by Test Status"
          >
            <option value="all">All Test Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Target Batch Type Filter */}
          <select
            value={targetBatchType}
            onChange={(e) =>
              onTargetBatchTypeChange(e.target.value as "all" | "product" | "waste")
            }
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Filter by Target Batch Type"
          >
            <option value="all">All Target Batches</option>
            <option value="product">Product Batches (BF-...)</option>
            <option value="waste">Waste Batches (MW-...)</option>
          </select>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
