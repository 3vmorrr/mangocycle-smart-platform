"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { IoTWeightPoint } from "@/data/contracts/iot";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface SmartBinWeightChartProps {
  data: IoTWeightPoint[];
  title?: string;
}

export const SmartBinWeightChart: React.FC<SmartBinWeightChartProps> = ({
  data,
  title = "Smart Bin Weight Telemetry Over Time",
}) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>Simulated load cell readings feed</CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-xs text-text-secondary">
          No historical weight readings recorded for this device yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs">
              Simulated load cell reading history in chronological sequence
            </CardDescription>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-secondary">
            {data.length} data point(s)
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="iotWeightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => formatDate(val, "en-US", { hour: "numeric", minute: "numeric" })}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} unit="kg" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as IoTWeightPoint;
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md text-xs space-y-1">
                      <p className="font-semibold text-text-primary">
                        {formatDate(item.timestamp, "en-US", { hour: "numeric", minute: "numeric", second: "numeric" })}
                      </p>
                      <p className="text-primary font-mono font-bold">
                        Weight: {formatWeightKg(item.weightKg, "en-US", 3)}
                      </p>
                      <p className="text-[10px] text-text-secondary font-mono">
                        Device: {item.deviceCode}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="weightKg"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#iotWeightGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
