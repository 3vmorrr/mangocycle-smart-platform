"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { WasteTrendChart } from "@/components/dashboard/WasteTrendChart";
import { WasteBySourceChart } from "@/components/dashboard/WasteBySourceChart";
import { WasteByTypeChart } from "@/components/dashboard/WasteByTypeChart";
import { BatchStageChart } from "@/components/dashboard/BatchStageChart";
import { ProcessedVsRemainingChart } from "@/components/dashboard/ProcessedVsRemainingChart";
import { RecentBatchesTable } from "@/components/dashboard/RecentBatchesTable";
import { AttentionBatchesCard } from "@/components/dashboard/AttentionBatchesCard";
import { RecentLabActivityCard } from "@/components/dashboard/RecentLabActivityCard";
import { AiSustainabilityInsightsCard } from "@/components/dashboard/AiSustainabilityInsightsCard";
import { SmartBinSummaryCard } from "@/components/dashboard/SmartBinSummaryCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { dashboardService } from "@/data/services";
import { DashboardData, DateRangeOption } from "@/data/contracts/dashboard";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (range: DateRangeOption, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await dashboardService.getDashboardData(range);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to dashboard data service."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, loadData]);

  const handleRefresh = () => {
    loadData(dateRange, true);
  };

  const handleDateRangeChange = (range: DateRangeOption) => {
    setDateRange(range);
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading MangoCycle operational metrics and telemetry..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12">
        <ErrorState
          title="Dashboard Data Unavailable"
          message={error || "Could not retrieve operational datasets."}
          onRetry={() => loadData(dateRange)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Date Range Controls */}
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Primary 8 Documented KPI Cards */}
      <KpiGrid metrics={data.metrics} />

      {/* 3. Main Operational & Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Intake & Batch Tracking (7 Cols on Desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Waste Collection Time-Series Trend */}
          <WasteTrendChart data={data.wasteOverTime} />

          {/* Waste by Type (Peel vs Seed vs Mixed) */}
          <WasteByTypeChart data={data.wasteByType} />

          {/* Recent Waste Batches Table */}
          <RecentBatchesTable batches={data.recentBatches} />

          {/* Batches Requiring Attention */}
          <AttentionBatchesCard batches={data.batchesRequiringAttention} />
        </div>

        {/* Right Column: Processing Pipeline, Science, & IoT (5 Cols on Desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Waste Distribution by Source */}
          <WasteBySourceChart data={data.wasteBySource} />

          {/* Batch Stage Distribution (9 Canonical Stages) */}
          <BatchStageChart data={data.batchesByStage} />

          {/* Processed vs Remaining Ratio */}
          <ProcessedVsRemainingChart
            totalCollectedKg={data.metrics.totalWasteCollectedKg}
            totalProcessedKg={data.metrics.totalWasteProcessedKg}
            efficiencyRate={data.metrics.processingEfficiencyRate}
          />

          {/* AI Sustainability Insights (Presentation Preview) */}
          <AiSustainabilityInsightsCard insight={data.aiInsights} />

          {/* Recent Laboratory Activity */}
          <RecentLabActivityCard tests={data.recentLabActivity} />

          {/* IoT Smart Bin Summary */}
          <SmartBinSummaryCard devices={data.smartBins} />
        </div>
      </div>
    </div>
  );
}
