"use client";

import React, { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { LoadingState } from "@/components/ui/LoadingState";

export default function GenerateReportPage() {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Generate Report"
        description="Configure report scope, date filters, target batch parameters, and optional AI narrative commentary."
        breadcrumbs={[
          { label: "Reports", href: "/reports" },
          { label: "Generate Report" },
        ]}
      />

      <Suspense fallback={<LoadingState message="Loading report configuration..." />}>
        <ReportFilters />
      </Suspense>
    </div>
  );
}
