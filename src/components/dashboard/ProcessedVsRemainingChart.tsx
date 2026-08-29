"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { formatWeightKg, formatPercentage } from "@/lib/utils/formatters";
import { Info } from "lucide-react";

interface ProcessedVsRemainingChartProps {
  totalCollectedKg: number;
  totalProcessedKg: number | null;
  efficiencyRate: number | null;
}

export const ProcessedVsRemainingChart: React.FC<ProcessedVsRemainingChartProps> = ({
  totalCollectedKg,
  totalProcessedKg,
  efficiencyRate,
}) => {
  // If formula is pending, render informative placeholder state per product review
  if (totalProcessedKg === null || efficiencyRate === null) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Processed vs. Remaining Waste</CardTitle>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
              Formula Pending
            </span>
          </div>
          <CardDescription>
            Conversion ratio between valorized material and intake undergoing processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between pb-4 space-y-4">
          <div className="p-4 rounded-xl border border-dashed border-border bg-surface-secondary/30 flex items-start gap-2.5 text-xs text-text-secondary">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">
                Official Conversion Formula Pending
              </p>
              <p className="text-[11px] leading-relaxed">
                The exact mathematical definition of &ldquo;Processed Waste&rdquo; (e.g. counting completed stage only vs. active downstream extraction stages) is pending authoritative specification by the scientific and product team.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium">Total Recorded Intake</span>
            <span className="font-mono font-bold text-text-primary">
              {formatWeightKg(totalCollectedKg)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const remainingKg = Math.max(0, totalCollectedKg - totalProcessedKg);

  const chartData = [
    { name: "Processed Waste", value: totalProcessedKg, color: "hsl(152, 57%, 35%)" },
    { name: "Remaining in Processing", value: remainingKg, color: "hsl(var(--color-border))" },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Processed vs. Remaining Waste</CardTitle>
        <CardDescription>
          Ratio of fully valorized material versus intake currently active in processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-4">
        <div className="h-44 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md text-xs">
                      <p className="font-semibold text-text-primary mb-0.5">{item.name}</p>
                      <p className="text-primary font-medium">{formatWeightKg(item.value)}</p>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                startAngle={180}
                endAngle={0}
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-text-primary">
              {formatPercentage(efficiencyRate)}
            </span>
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Conversion Rate
            </span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-center">
          <div className="p-2 rounded bg-surface/60 border border-border/50">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="text-[11px] font-medium text-text-secondary">Processed</span>
            </div>
            <span className="text-sm font-bold text-text-primary">
              {formatWeightKg(totalProcessedKg)}
            </span>
          </div>

          <div className="p-2 rounded bg-surface/60 border border-border/50">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-border shrink-0" />
              <span className="text-[11px] font-medium text-text-secondary">Remaining</span>
            </div>
            <span className="text-sm font-bold text-text-primary">
              {formatWeightKg(remainingKg)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
