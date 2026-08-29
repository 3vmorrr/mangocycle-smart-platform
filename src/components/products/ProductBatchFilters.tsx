import React from "react";
import { Search, X, Filter } from "lucide-react";
import { ProductStatus, LabTestingStatus } from "@/data/contracts/product-batch";

interface ProductBatchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ProductStatus | "all";
  onStatusChange: (status: ProductStatus | "all") => void;
  labTestingStatus: LabTestingStatus | "all";
  onLabTestingStatusChange: (status: LabTestingStatus | "all") => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const ProductBatchFilters: React.FC<ProductBatchFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  labTestingStatus,
  onLabTestingStatusChange,
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
            placeholder="Search by product code (BF-...) or name..."
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
            onChange={(e) => onStatusChange(e.target.value as ProductStatus | "all")}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Filter by Product Status"
          >
            <option value="all">All Statuses</option>
            <option value="in_production">In Production</option>
            <option value="testing">Testing</option>
            <option value="completed">Completed</option>
            <option value="released">Released</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Lab Testing Status Filter */}
          <select
            value={labTestingStatus}
            onChange={(e) =>
              onLabTestingStatusChange(e.target.value as LabTestingStatus | "all")
            }
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Filter by Lab Status"
          >
            <option value="all">All Lab Statuses</option>
            <option value="pending">Lab: Pending</option>
            <option value="in_progress">Lab: In Progress</option>
            <option value="passed">Lab: Passed</option>
            <option value="failed">Lab: Failed</option>
            <option value="not_applicable">Lab: N/A</option>
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
