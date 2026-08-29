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
import { BatchesByStagePoint } from "@/data/contracts/dashboard";

interface BatchStageChartProps {
  data: BatchesByStagePoint[];
}

export const BatchStageChart: React.FC<BatchStageChartProps> = ({ data }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Batches by Current Processing Stage</CardTitle>
        <CardDescription>
          Distribution across canonical processing stages from Collection to Completion.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {data.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-xs text-text-secondary">
            No stage distribution data available.
          </div>
        ) : (
          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--color-border))"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="stageName"
                  tick={{ fontSize: 10, fill: "hsl(var(--color-text-secondary))" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--color-border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--color-text-secondary))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const entry = payload[0].payload as BatchesByStagePoint;
                    return (
                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-text-primary mb-0.5">
                          {entry.stageName}
                        </p>
                        <p className="text-primary font-medium">
                          Active Batches: {entry.count}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                  {data.map((entry) => {
                    const isCompleted = entry.stageId === "completed";
                    const isAdvanced =
                      entry.stageId === "extraction" || entry.stageId === "production";
                    return (
                      <Cell
                        key={`cell-${entry.stageId}`}
                        fill={
                          isCompleted
                            ? "hsl(152, 57%, 35%)"
                            : isAdvanced
                            ? "hsl(38, 80%, 55%)"
                            : "hsl(210, 40%, 45%)"
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
