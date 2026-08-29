"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Sliders,
  MessageSquare,
  Leaf,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { LoadingState } from "@/components/ui/LoadingState";
import { aiService } from "@/data/services";
import { AiAnalysisRecord } from "@/data/contracts/ai";
import { formatDate } from "@/lib/utils/formatters";

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  visual_assessment: Eye,
  processing_advice: Sliders,
  ask_mangocycle: MessageSquare,
  sustainability_insights: Leaf,
};

const TYPE_LABELS: Record<string, string> = {
  visual_assessment: "Visual Assessment",
  processing_advice: "Processing Advice",
  ask_mangocycle: "Ask MangoCycle Query",
  sustainability_insights: "Sustainability Insights",
};

export default function AiHistoryPage() {
  const [records, setRecords] = useState<AiAnalysisRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      try {
        const data = await aiService.getAiAnalysisHistory();
        setRecords(data);
      } catch {
        // non-blocking
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = records.filter((r) => {
    if (filterType !== "all" && r.analysisType !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.inputReference && r.inputReference.toLowerCase().includes(q)) ||
        (r.wasteBatchCode && r.wasteBatchCode.toLowerCase().includes(q)) ||
        (r.model && r.model.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="AI Analysis History"
        description="Recorded log of AI visual assessments, processing recommendations, queries, and prompt versioning metadata."
        breadcrumbs={[
          { label: "MangoCycle AI", href: "/ai" },
          { label: "Analysis History" },
        ]}
      />

      <AiDisclaimer
        label="AI Audit & Traceability Framework"
        description="Every AI interaction is recorded with prompt versioning and model identifiers for reproducibility and scientific governance per 15-AI-ARCHITECTURE.md §8."
        compact
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search AI audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-medium"
        >
          <option value="all">All AI Features</option>
          <option value="visual_assessment">Visual Assessment</option>
          <option value="processing_advice">Processing Advice</option>
          <option value="ask_mangocycle">Ask MangoCycle</option>
          <option value="sustainability_insights">Sustainability Insights</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12">
          <LoadingState message="Loading AI interaction audit log..." />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-text-secondary text-xs">
            No matching AI analysis records found in audit log.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((rec) => {
            const Icon = TYPE_ICONS[rec.analysisType] || Sparkles;
            const label = TYPE_LABELS[rec.analysisType] || rec.analysisType;

            return (
              <Card key={rec.id} className="hover:border-border/80 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary text-xs">
                          {label}
                        </span>
                        {rec.wasteBatchCode && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-secondary border border-border text-primary font-semibold">
                            {rec.wasteBatchCode}
                          </span>
                        )}
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">
                          {rec.promptVersion || "v1.0"}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">
                        {rec.inputReference || "Platform query execution"}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto text-[10px] text-text-secondary border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 font-mono">
                    <span className="text-text-primary font-medium">{rec.model}</span>
                    <span>{formatDate(rec.createdAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
