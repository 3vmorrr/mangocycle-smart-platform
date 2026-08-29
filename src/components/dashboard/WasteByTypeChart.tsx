"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { WasteByTypePoint } from "@/data/contracts/dashboard";
import { formatWeightKg } from "@/lib/utils/formatters";

interface WasteByTypeChartProps {
  data: WasteByTypePoint[];
}

const TYPE_COLORS: Record<string, string> = {
  mango_peel: "hsl(152, 57%, 35%)",       // Peel: Primary Teal
  mango_seed: "hsl(38, 80%, 55%)",         // Seed: Mango Amber
  mixed_mango_waste: "hsl(210, 40%, 45%)", // Mixed: Slate Blue
};

export const WasteByTypeChart: React.FC<WasteByTypeChartProps> = ({ data }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Waste by Type</CardTitle>
        <CardDescription>
          Comparison between Mango Peel, Mango Seed, and Mixed Waste.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-text-secondary">
            No waste type data available.
          </div>
        ) : (
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--color-border))"
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${val} kg`}
                  tick={{ fontSize: 11, fill: "hsl(var(--color-text-secondary))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--color-border))" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--color-text-primary))", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as WasteByTypePoint;
                    return (
                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-text-primary mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-primary font-medium">
                          Weight: {formatWeightKg(item.weightKg)}
                        </p>
                        <p className="text-text-secondary">
                          Registered Batches: {item.batchCount}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="weightKg" radius={[0, 4, 4, 0]} barSize={22}>
                  {data.map((entry) => (
                    <Cell
                      key={`cell-${entry.wasteType}`}
                      fill={TYPE_COLORS[entry.wasteType] || "hsl(var(--color-primary))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
