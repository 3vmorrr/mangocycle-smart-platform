"use client";

import React from "react";
import { Search, X, Filter } from "lucide-react";
import { WasteSource, WasteType } from "@/data/contracts/waste-batch";
import { CANONICAL_PROCESSING_STAGES, BatchStatus } from "@/lib/constants/stages";

interface WasteBatchFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  wasteType: WasteType | "all";
  onWasteTypeChange: (val: WasteType | "all") => void;
  stage: BatchStatus | "all";
  onStageChange: (val: BatchStatus | "all") => void;
  sourceId: string;
  onSourceIdChange: (val: string) => void;
  sources: WasteSource[];
  onReset: () => void;
}

export const WasteBatchFilters: React.FC<WasteBatchFiltersProps> = ({
  search,
  onSearchChange,
  wasteType,
  onWasteTypeChange,
  stage,
  onStageChange,
  sourceId,
  onSourceIdChange,
  sources,
  onReset,
}) => {
  const hasActiveFilters =
    search !== "" || wasteType !== "all" || stage !== "all" || sourceId !== "all";

  return (
    <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filter & Search Batches</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-danger transition-colors font-medium"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by batch code or source..."
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Waste Type Filter */}
        <div>
          <select
            value={wasteType}
            onChange={(e) => onWasteTypeChange(e.target.value as WasteType | "all")}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Waste Types</option>
            <option value="mango_peel">Mango Peel</option>
            <option value="mango_seed">Mango Seed</option>
            <option value="mixed_mango_waste">Mixed Mango Waste</option>
          </select>
        </div>

        {/* Stage Filter */}
        <div>
          <select
            value={stage}
            onChange={(e) => onStageChange(e.target.value as BatchStatus | "all")}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Processing Stages</option>
            {CANONICAL_PROCESSING_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.order}. {s.name}
              </option>
            ))}
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <select
            value={sourceId}
            onChange={(e) => onSourceIdChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Waste Sources</option>
            {sources.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
