"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SustainabilityInsightsCard } from "@/components/ai/SustainabilityInsightsCard";

export default function SustainabilityInsightsPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="AI Sustainability Insights"
        description="Automated narrative summary synthesizing verified platform metrics on circular waste diversion and throughput."
        breadcrumbs={[
          { label: "MangoCycle AI", href: "/ai" },
          { label: "Sustainability Insights" },
        ]}
      />

      <SustainabilityInsightsCard />
    </div>
  );
}
