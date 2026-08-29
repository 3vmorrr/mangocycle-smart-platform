"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AskMangoCycleChat } from "@/components/ai/AskMangoCycleChat";

export default function AskMangoCyclePage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Ask MangoCycle"
        description="Conversational query assistant powered by approved read-only tool calling over platform batches, formulations, and metrics."
        breadcrumbs={[
          { label: "MangoCycle AI", href: "/ai" },
          { label: "Ask MangoCycle" },
        ]}
      />

      <AskMangoCycleChat />
    </div>
  );
}
