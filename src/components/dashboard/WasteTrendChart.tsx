"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { WasteOverTimePoint } from "@/data/contracts/dashboard";
import { formatDate, formatWeightKg } from "@/lib/utils/formatters";

interface WasteTrendChartProps {
  data: WasteOverTimePoint[];
}

export const WasteTrendChart: React.FC<WasteTrendChartProps> = ({ data }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Waste Collection Over Time</CardTitle>
        <CardDescription>
          Daily recorded intake of mango waste (kg) and registered batch volume.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-text-secondary">
            No collection history available for the selected period.
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 57%, 35%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(152, 57%, 35%)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--color-border))"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => formatDate(val, "en-US", { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11, fill: "hsl(var(--color-text-secondary))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--color-border))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--color-text-secondary))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val} kg`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const point = payload[0].payload as WasteOverTimePoint;
                    return (
                      <div className="rounded-lg border border-border bg-surface p-3 shadow-md text-xs">
                        <p className="font-semibold text-text-primary mb-1">
                          {formatDate(label)}
                        </p>
                        <p className="text-primary font-medium">
                          Weight: {formatWeightKg(point.weightKg)}
                        </p>
                        <p className="text-text-secondary">
                          Batches: {point.batchCount}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  stroke="hsl(152, 57%, 35%)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wasteGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
