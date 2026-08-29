"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProcessingAdvisorCard } from "@/components/ai/ProcessingAdvisorCard";

export default function ProcessingAdvisorPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="AI Processing Advisor"
        description="Scientific rule evaluation engine and AI decision-support narrative for mango waste batch optimization."
        breadcrumbs={[
          { label: "MangoCycle AI", href: "/ai" },
          { label: "Processing Advisor" },
        ]}
      />

      <ProcessingAdvisorCard />
    </div>
  );
}
