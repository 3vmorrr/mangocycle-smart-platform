import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiInsightSummary } from "@/data/contracts/dashboard";

interface AiSustainabilityInsightsCardProps {
  insight: AiInsightSummary;
}

export const AiSustainabilityInsightsCard: React.FC<AiSustainabilityInsightsCardProps> = ({
  insight,
}) => {
  return (
    <Card variant="accent" className="flex flex-col bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <CardTitle className="text-base">{insight.title}</CardTitle>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
            Demo AI Insight
          </span>
        </div>
        <CardDescription>
          Automated narrative summary interpreting verified database sustainability metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs pb-4">
        {/* Standard Disclaimer per 15-AI-ARCHITECTURE.md */}
        <div className="flex items-start gap-2 p-2.5 rounded bg-surface/80 border border-border/80 text-[11px] text-text-secondary">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>
            AI-generated narrative based on calculated platform metrics. Scientific decisions require verified laboratory data.
          </p>
        </div>

        {/* Narrative Summary */}
        <p className="text-text-primary leading-relaxed font-medium">
          {insight.summary}
        </p>

        {/* Key Findings List */}
        <div className="space-y-2 pt-1 border-t border-border/60">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            Key Observations:
          </span>
          <ul className="space-y-1.5">
            {insight.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href="/ai/insights"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <span>Full AI Sustainability Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
