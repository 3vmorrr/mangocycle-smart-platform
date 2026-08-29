"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FlaskConical, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LabTestFilters } from "@/components/laboratory/LabTestFilters";
import { LabTestTable } from "@/components/laboratory/LabTestTable";
import { LabTestMobileCard } from "@/components/laboratory/LabTestMobileCard";
import { laboratoryService, authService } from "@/data/services";
import {
  LaboratoryTestListItem,
  LabTestStatus,
} from "@/data/contracts/laboratory";
import { UserProfile } from "@/data/contracts/auth";
import { hasMinimumRole } from "@/lib/constants/navigation";

export default function LaboratoryPage() {
  const [tests, setTests] = useState<LaboratoryTestListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LabTestStatus | "all">("all");
  const [targetBatchType, setTargetBatchType] = useState<"all" | "product" | "waste">("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, user] = await Promise.all([
        laboratoryService.getLaboratoryTests({
          search: search || undefined,
          status: status !== "all" ? status : undefined,
          targetBatchType: targetBatchType !== "all" ? targetBatchType : undefined,
        }),
        authService.getCurrentUser(),
      ]);
      setTests(res.items);
      setCurrentUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load laboratory tests."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, status, targetBatchType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setTargetBatchType("all");
  };

  const hasActiveFilters = search !== "" || status !== "all" || targetBatchType !== "all";

  const canCreate = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  const canEdit = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  // Stats calculation
  const totalCount = tests.length;
  const inProgressCount = tests.filter((t) => t.status === "in_progress" || t.status === "pending").length;
  const completedCount = tests.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <PageHeader
        title="Laboratory Tests"
        description="Record and track analytical characterizations (UV-Vis, TEM, XRD, FTIR, bioassays) linked to waste and product batches."
        breadcrumbs={[{ label: "Laboratory" }]}
        actions={
          canCreate && (
            <Link href="/laboratory/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record Lab Test
              </Button>
            </Link>
          )
        }
      />

      {/* 2. Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">
              Total Test Assays
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
              Pending / In Progress
            </span>
            <p className="font-mono font-bold text-2xl text-amber-600 dark:text-amber-400">
              {inProgressCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">
              Completed Assays
            </span>
            <p className="font-mono font-bold text-2xl text-teal-600 dark:text-teal-400">
              {completedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <LabTestFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        targetBatchType={targetBatchType}
        onTargetBatchTypeChange={setTargetBatchType}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Main Laboratory List Presentation */}
      {isLoading ? (
        <div className="py-16">
          <LoadingState message="Loading laboratory test records..." />
        </div>
      ) : error ? (
        <div className="py-12">
          <ErrorState
            title="Failed to Load Laboratory Tests"
            message={error}
            onRetry={loadData}
          />
        </div>
      ) : tests.length === 0 ? (
        <div className="py-8">
          <EmptyState
            title={hasActiveFilters ? "No matching laboratory tests found" : "No laboratory tests recorded yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search criteria or resetting filters to view all test records."
                : "Record your first analytical characterization or bioefficacy assay linked to a batch."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Clear Filters
                </Button>
              ) : canCreate ? (
                <Link href="/laboratory/new">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Record Lab Test
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
            <LabTestTable tests={tests} canEdit={canEdit} />
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {tests.map((test) => (
              <LabTestMobileCard
                key={test.id}
                test={test}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
