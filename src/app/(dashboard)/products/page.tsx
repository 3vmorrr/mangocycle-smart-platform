"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FlaskConical, Sparkles, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductBatchFilters } from "@/components/products/ProductBatchFilters";
import { ProductBatchTable } from "@/components/products/ProductBatchTable";
import { ProductBatchMobileCard } from "@/components/products/ProductBatchMobileCard";
import { productBatchService, authService } from "@/data/services";
import {
  ProductBatchListItem,
  ProductStatus,
  LabTestingStatus,
} from "@/data/contracts/product-batch";
import { UserProfile } from "@/data/contracts/auth";
import { hasMinimumRole } from "@/lib/constants/navigation";

export default function ProductsPage() {
  const [batches, setBatches] = useState<ProductBatchListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "all">("all");
  const [labTestingStatus, setLabTestingStatus] = useState<LabTestingStatus | "all">("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, user] = await Promise.all([
        productBatchService.getProductBatches({
          search: search || undefined,
          status: status !== "all" ? status : undefined,
          labTestingStatus: labTestingStatus !== "all" ? labTestingStatus : undefined,
        }),
        authService.getCurrentUser(),
      ]);
      setBatches(res.items);
      setCurrentUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product batches."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, status, labTestingStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setLabTestingStatus("all");
  };

  const hasActiveFilters = search !== "" || status !== "all" || labTestingStatus !== "all";

  const canCreate = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  const canEdit = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  // Stats calculation
  const totalCount = batches.length;
  const inProductionCount = batches.filter((b) => b.status === "in_production" || b.status === "testing").length;
  const completedCount = batches.filter((b) => b.status === "completed" || b.status === "released").length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <PageHeader
        title="Product Batches"
        description="Manage valorized biological products, formulations, and input waste batch linkages."
        breadcrumbs={[{ label: "Products" }]}
        actions={
          canCreate && (
            <Link href="/products/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Product Batch
              </Button>
            </Link>
          )
        }
      />

      {/* 2. Summary KPI Counter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">
              Total Formulations
            </span>
            <p className="font-mono font-bold text-2xl text-text-primary">
              {totalCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">
              Active In-Production / Testing
            </span>
            <p className="font-mono font-bold text-2xl text-amber-600 dark:text-amber-400">
              {inProductionCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">
              Completed / Released
            </span>
            <p className="font-mono font-bold text-2xl text-teal-600 dark:text-teal-400">
              {completedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <ProductBatchFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        labTestingStatus={labTestingStatus}
        onLabTestingStatusChange={setLabTestingStatus}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Main Products List Presentation */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading product batches and waste linkages..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState
            title="Failed to Load Products"
            message={error}
            onRetry={loadData}
          />
        </div>
      ) : batches.length === 0 ? (
        <div className="py-8">
          <EmptyState
            title={hasActiveFilters ? "No matching products found" : "No product batches registered yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search criteria or resetting filters to view all product records."
                : "Register your first biological product batch by linking contributing waste batches."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Clear Filters
                </Button>
              ) : canCreate ? (
                <Link href="/products/new">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Create Product Batch
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block">
            <ProductBatchTable batches={batches} canEdit={canEdit} />
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {batches.map((batch) => (
              <ProductBatchMobileCard
                key={batch.id}
                batch={batch}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
