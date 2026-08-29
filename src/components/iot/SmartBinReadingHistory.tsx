import React from "react";
import { Radio, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { IoTReading } from "@/data/contracts/iot";
import { formatWeightKg, formatDate } from "@/lib/utils/formatters";

interface SmartBinReadingHistoryProps {
  readings: IoTReading[];
  title?: string;
}

export const SmartBinReadingHistory: React.FC<SmartBinReadingHistoryProps> = ({
  readings,
  title = "Recent Weight Readings",
}) => {
  if (readings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription>Simulated load cell reading history</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-xs text-text-secondary">
          No readings logged for this device yet. Use the simulator above to transmit test weight data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Chronological log of simulated weight measurements recorded for Smart Bin stations
          </CardDescription>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-secondary">
          {readings.length} reading(s)
        </span>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-surface-secondary/40 border-b border-border text-[11px] font-semibold text-text-secondary">
                <th className="p-2.5">Recorded Timestamp</th>
                <th className="p-2.5">Device Code</th>
                <th className="p-2.5 text-end">Reading Mass</th>
                <th className="p-2.5 text-center">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {readings.map((reading) => (
                <tr key={reading.id} className="hover:bg-surface-secondary/20 transition-colors">
                  <td className="p-2.5 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-text-primary">
                      <Clock className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                      <span>{formatDate(reading.recordedAt, "en-US", { hour: "numeric", minute: "numeric", second: "numeric" })}</span>
                    </div>
                  </td>
                  <td className="p-2.5 font-mono font-bold text-primary">
                    {reading.deviceCode}
                  </td>
                  <td className="p-2.5 text-end font-mono font-extrabold text-text-primary">
                    {formatWeightKg(reading.weightKg, "en-US", 3)}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/20">
                      Simulated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
