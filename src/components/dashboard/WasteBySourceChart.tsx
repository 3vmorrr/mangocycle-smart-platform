"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { WasteBySourcePoint } from "@/data/contracts/dashboard";
import { formatWeightKg } from "@/lib/utils/formatters";

interface WasteBySourceChartProps {
  data: WasteBySourcePoint[];
}

const SOURCE_COLORS = [
  "hsl(152, 57%, 35%)", // Primary Teal
  "hsl(210, 40%, 45%)", // Secondary Slate Blue
  "hsl(38, 80%, 55%)",  // Accent Warm Amber
  "hsl(190, 70%, 40%)", // Cyan
  "hsl(270, 50%, 50%)", // Purple
];

export const WasteBySourceChart: React.FC<WasteBySourceChartProps> = ({ data }) => {
  const totalWeight = data.reduce((sum, item) => sum + item.weightKg, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Waste by Source</CardTitle>
        <CardDescription>
          Contribution volume and proportion across registered waste suppliers.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between pb-4">
        {data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
            No source distribution data available.
          </div>
        ) : (
          <>
            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as WasteBySourcePoint;
                      return (
                        <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md text-xs">
                          <p className="font-semibold text-text-primary mb-0.5">
                            {item.sourceName}
                          </p>
                          <p className="text-primary font-medium">
                            {formatWeightKg(item.weightKg)} ({item.percentage}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={data}
                    dataKey="weightKg"
                    nameKey="sourceName"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-text-secondary">
                  Total
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {formatWeightKg(totalWeight, "en-US", 1)}
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              {data.map((item, index) => (
                <div
                  key={item.sourceName}
                  className="flex items-center justify-between text-xs text-text-secondary"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    <span className="truncate text-text-primary font-medium">
                      {item.sourceName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ps-2 font-mono text-[11px]">
                    <span>{formatWeightKg(item.weightKg, "en-US", 1)}</span>
                    <span className="text-text-secondary/70">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
