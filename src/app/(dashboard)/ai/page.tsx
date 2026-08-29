"use client";

import React from "react";
import Link from "next/link";
import {
  Eye,
  Sliders,
  MessageSquare,
  Leaf,
  History,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";

const AI_FEATURE_CARDS = [
  {
    title: "AI Waste Visual Analyzer",
    description:
      "Multimodal vision assessment of mango waste photos for surface condition, visible discoloration, and sorting inspection recommendations.",
    href: "/ai/waste-analyzer",
    icon: Eye,
    roleRequired: "Operator",
    badge: "Vision LLM",
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  {
    title: "AI Processing Advisor",
    description:
      "Hybrid decision-support tool combining deterministic scientific rules with AI narrative explanations to advise on drying, storage, and milling parameters.",
    href: "/ai/processing-advisor",
    icon: Sliders,
    roleRequired: "Operator",
    badge: "Rule Engine + LLM",
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    title: "Ask MangoCycle",
    description:
      "Natural language conversational interface powered by approved read-only tool calling over operational platform batches, formulations, and lab records.",
    href: "/ai/ask",
    icon: MessageSquare,
    roleRequired: "Viewer",
    badge: "Tool Calling",
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    title: "AI Sustainability Insights",
    description:
      "Automated narrative synthesizer translating verified platform metrics into stakeholder summaries of circular waste diversion and throughput.",
    href: "/ai/insights",
    icon: Leaf,
    roleRequired: "Viewer",
    badge: "Metrics Narrator",
    color: "text-teal-600",
    bg: "bg-teal-500/10",
  },
  {
    title: "AI Analysis History",
    description:
      "Recorded history of past AI visual assessments, processing recommendations, queries, and prompt versioning metadata.",
    href: "/ai/history",
    icon: History,
    roleRequired: "Researcher",
    badge: "Audit Log",
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
];

export default function AIHubPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <PageHeader
        title="MangoCycle AI"
        description="AI-assisted decision support, multimodal visual analysis, and natural language data exploration operating over verified platform records."
        breadcrumbs={[{ label: "AI Decision Support" }]}
      />

      {/* 2. Global AI Disclaimer */}
      <AiDisclaimer
        label="Platform AI Governance & Safety Framework"
        description="MangoCycle AI operates strictly as a decision-support layer. Calculations and scientific rules are executed deterministically before AI summarization. All AI outputs are labeled and must be validated by qualified personnel."
      />

      {/* 3. Core Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Deterministic First</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              Database computations and scientific rules evaluate first. AI only narrates and explains.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Strict Guardrails</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              No arbitrary SQL generation, no invented chemical/moisture claims, and no access to private notes.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-text-primary">Shared In-Memory State</h3>
            <p className="text-text-secondary leading-relaxed text-[11px]">
              AI assistants query the exact same operational repository data driving the platform dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* 4. AI Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AI_FEATURE_CARDS.map((feat) => {
          const Icon = feat.icon;
          return (
            <Card
              key={feat.title}
              className="hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {feat.title}
                      </CardTitle>
                      <span className="text-[10px] font-mono text-text-secondary">
                        Min Role: {feat.roleRequired}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary font-semibold">
                    {feat.badge}
                  </span>
                </div>
                <CardDescription className="text-xs pt-2 leading-relaxed">
                  {feat.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Link href={feat.href} className="w-full">
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary group-hover:text-primary-dark transition-colors">
                    <span>Open {feat.title}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
