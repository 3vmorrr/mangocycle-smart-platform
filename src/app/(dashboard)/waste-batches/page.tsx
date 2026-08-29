"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Boxes, Layers, CheckCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { WasteBatchFilters } from "@/components/waste/WasteBatchFilters";
import { WasteBatchTable } from "@/components/waste/WasteBatchTable";
import { WasteBatchMobileCard } from "@/components/waste/WasteBatchMobileCard";
import { wasteBatchService, authService } from "@/data/services";
import {
  WasteBatchListItem,
  WasteSource,
  WasteType,
} from "@/data/contracts/waste-batch";
import { BatchStatus } from "@/lib/constants/stages";
import { UserProfile } from "@/data/contracts/auth";
import { hasMinimumRole } from "@/lib/constants/navigation";

export default function WasteBatchesPage() {
  const [batches, setBatches] = useState<WasteBatchListItem[]>([]);
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [wasteType, setWasteType] = useState<WasteType | "all">("all");
  const [stage, setStage] = useState<BatchStatus | "all">("all");
  const [sourceId, setSourceId] = useState<string>("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [batchesResult, sourcesResult, user] = await Promise.all([
        wasteBatchService.getWasteBatches({
          search: search || undefined,
          wasteType: wasteType !== "all" ? wasteType : undefined,
          status: stage !== "all" ? stage : undefined,
          sourceId: sourceId !== "all" ? sourceId : undefined,
        }),
        wasteBatchService.getWasteSources(),
        authService.getCurrentUser(),
      ]);

      setBatches(batchesResult.items);
      setSources(sourcesResult);
      setCurrentUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load waste batches."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, wasteType, stage, sourceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch("");
    setWasteType("all");
    setStage("all");
    setSourceId("all");
  };

  const canCreate = currentUser ? hasMinimumRole(currentUser.role, "operator") : true;
  const canEdit = currentUser ? hasMinimumRole(currentUser.role, "operator") : true;

  const totalCount = batches.length;
  const activeCount = batches.filter(
    (b) => b.currentStatus !== "completed" && b.currentStatus !== "rejected"
  ).length;
  const completedCount = batches.filter((b) => b.currentStatus === "completed").length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Waste Batches"
        description="Comprehensive lifecycle tracking of organic mango peel, seed, and mixed waste intake."
        breadcrumbs={[{ label: "Waste Management" }]}
        action={
          canCreate ? (
            <Link href="/waste-batches/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Register Waste Batch
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* 2. Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Total Listed
            </span>
            <p className="text-lg font-bold text-text-primary">{totalCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Active Processing
            </span>
            <p className="text-lg font-bold text-text-primary">{activeCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-surface col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Completed
            </span>
            <p className="text-lg font-bold text-text-primary">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <WasteBatchFilters
        search={search}
        onSearchChange={setSearch}
        wasteType={wasteType}
        onWasteTypeChange={setWasteType}
        stage={stage}
        onStageChange={setStage}
        sourceId={sourceId}
        onSourceIdChange={setSourceId}
        sources={sources}
        onReset={handleResetFilters}
      />

      {/* 4. Content Area */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading waste batches..." />
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState
            title="Failed to Load Waste Batches"
            message={error}
            onRetry={loadData}
          />
        </div>
      ) : batches.length === 0 ? (
        <div className="py-8">
          <EmptyState
            title="No Waste Batches Found"
            message={
              search || wasteType !== "all" || stage !== "all" || sourceId !== "all"
                ? "No batches match the selected filter criteria. Try resetting your search."
                : "No waste batches have been registered in the system yet."
            }
            action={
              search || wasteType !== "all" || stage !== "all" || sourceId !== "all" ? (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              ) : canCreate ? (
                <Link href="/waste-batches/new">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Register First Batch
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table (>= 768px) */}
          <div className="hidden md:block">
            <WasteBatchTable batches={batches} canEdit={canEdit} />
          </div>

          {/* Mobile Card Stack (< 768px) */}
          <div className="block md:hidden space-y-3">
            {batches.map((b) => (
              <WasteBatchMobileCard key={b.id} batch={b} canEdit={canEdit} />
            ))}
          </div>

          {/* Footer Results Info */}
          <div className="flex items-center justify-between text-xs text-text-secondary px-1 pt-2">
            <span>Showing {batches.length} batch record(s)</span>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh list</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
