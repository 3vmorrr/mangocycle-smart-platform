"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { WasteVisualAnalyzerCard } from "@/components/ai/WasteVisualAnalyzerCard";

export default function WasteVisualAnalyzerPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="AI Waste Visual Analyzer"
        description="Multimodal vision inspection of mango waste photos for surface condition, visible discoloration, and sorting recommendations."
        breadcrumbs={[
          { label: "MangoCycle AI", href: "/ai" },
          { label: "Waste Visual Analyzer" },
        ]}
      />

      <WasteVisualAnalyzerCard />
    </div>
  );
}
