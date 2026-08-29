import React from "react";
import { KpiCard } from "./KpiCard";
import { DashboardMetrics } from "@/data/contracts/dashboard";
import { formatWeightKg, formatNumber, formatPercentage } from "@/lib/utils/formatters";
import {
  Boxes,
  Leaf,
  Layers,
  Sparkles,
  CheckCircle,
  FlaskConical,
  Recycle,
  TrendingUp,
} from "lucide-react";

interface KpiGridProps {
  metrics: DashboardMetrics;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Total Mango Waste Collected */}
      <KpiCard
        title="Total Waste Collected"
        value={formatWeightKg(metrics.totalWasteCollectedKg)}
        subtitle="Raw peel, seed, and mixed intake"
        icon={<Boxes className="w-4 h-4" />}
        iconBgColor="bg-primary/10 text-primary"
        accentColor="border-s-primary"
      />

      {/* 2. Total Waste Processed (Definition Pending) */}
      <KpiCard
        title="Total Waste Processed"
        value={
          metrics.totalWasteProcessedKg !== null
            ? formatWeightKg(metrics.totalWasteProcessedKg)
            : "Formula Pending"
        }
        subtitle={
          metrics.totalWasteProcessedKg !== null
            ? "Fully valorized material"
            : "Awaiting scientific team formula definition"
        }
        icon={<Leaf className="w-4 h-4" />}
        iconBgColor="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
        accentColor="border-s-emerald-600"
      />

      {/* 3. Number of Waste Batches */}
      <KpiCard
        title="Total Waste Batches"
        value={formatNumber(metrics.totalWasteBatchesCount)}
        subtitle="Tracked with unique MW-YYYY-NNN codes"
        icon={<Layers className="w-4 h-4" />}
        iconBgColor="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
      />

      {/* 4. Number of Active Batches */}
      <KpiCard
        title="Active Batches"
        value={formatNumber(metrics.activeBatchesCount)}
        subtitle="Currently undergoing processing"
        icon={<Sparkles className="w-4 h-4" />}
        iconBgColor="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
      />

      {/* 5. Number of Completed Batches */}
      <KpiCard
        title="Completed Batches"
        value={formatNumber(metrics.completedBatchesCount)}
        subtitle="Finished all processing stages"
        icon={<CheckCircle className="w-4 h-4" />}
        iconBgColor="bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
      />

      {/* 6. Number of Product Batches */}
      <KpiCard
        title="Product Batches"
        value={formatNumber(metrics.productBatchesCount)}
        subtitle="Biofungicide & NanoBiovera formulations"
        icon={<FlaskConical className="w-4 h-4" />}
        iconBgColor="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
      />

      {/* 7. Waste Diverted from Disposal */}
      <KpiCard
        title="Waste Diverted"
        value={formatWeightKg(metrics.divertedWasteKg)}
        subtitle="Prevented from landfill disposal"
        icon={<Recycle className="w-4 h-4" />}
        iconBgColor="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      />

      {/* 8. Processing Rate (Definition Pending) */}
      <KpiCard
        title="Processing Rate"
        value={
          metrics.processingEfficiencyRate !== null
            ? formatPercentage(metrics.processingEfficiencyRate)
            : "Formula Pending"
        }
        subtitle={
          metrics.processingEfficiencyRate !== null
            ? "Processed vs total collected ratio"
            : "Conversion formula pending scientific definition"
        }
        icon={<TrendingUp className="w-4 h-4" />}
        iconBgColor="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
      />
    </div>
  );
};
