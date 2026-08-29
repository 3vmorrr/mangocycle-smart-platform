"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportViewer } from "@/components/reports/ReportViewer";
import { reportService } from "@/data/services";
import { ReportData } from "@/data/contracts/report";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportService.getReportById(id);
      if (!data) {
        setError(`Report "${id}" was not found in session memory.`);
      } else {
        setReport(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load report details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading report data..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="py-12">
        <ErrorState
          title="Report Not Found"
          message={error || "The requested report does not exist."}
          onRetry={() => router.push("/reports")}
        />
      </div>
    );
  }

  return <ReportViewer report={report} />;
}
