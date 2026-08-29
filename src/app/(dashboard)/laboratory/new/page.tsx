"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { LabTestForm } from "@/components/laboratory/LabTestForm";
import { laboratoryService } from "@/data/services";
import { LaboratoryTestFormValues } from "@/lib/validators/laboratory";
import { AttachmentInput } from "@/data/contracts/laboratory";

function CreateLabTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") || undefined;
  const preselectedWasteId = searchParams.get("wasteId") || undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    values: LaboratoryTestFormValues,
    attachments?: AttachmentInput[]
  ) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await laboratoryService.createLaboratoryTest({
        test_type: values.test_type,
        waste_batch_id: values.waste_batch_id || null,
        product_batch_id: values.product_batch_id || null,
        test_date: values.test_date || null,
        status: values.status,
        result_summary: values.result_summary || null,
        numeric_result: values.numeric_result ?? null,
        result_unit: values.result_unit || null,
        researcher_notes: values.researcher_notes || null,
        attachments,
      });

      router.push(`/laboratory/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record laboratory test."
      );
      setIsSubmitting(false);
    }
  };

  const initialData = (preselectedProductId || preselectedWasteId) ? {
    id: "",
    testType: "UV-Vis Spectroscopy",
    wasteBatchId: preselectedWasteId || null,
    productBatchId: preselectedProductId || null,
    testDate: new Date().toISOString().split("T")[0],
    status: "completed" as const,
    resultSummary: null,
    numericResult: null,
    resultUnit: null,
    researcherNotes: null,
    createdBy: null,
    createdAt: "",
    updatedAt: "",
  } : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          <strong>Registration Error:</strong> {error}
        </div>
      )}

      <LabTestForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        cancelHref="/laboratory"
      />
    </div>
  );
}

export default function CreateLaboratoryTestPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Record Laboratory Test"
        description="Log analytical characterizations, spectroscopy measurements, or bioassay results for a batch."
        breadcrumbs={[
          { label: "Laboratory", href: "/laboratory" },
          { label: "New Test" },
        ]}
      />

      <Suspense fallback={<LoadingState message="Initializing test form..." />}>
        <CreateLabTestContent />
      </Suspense>
    </div>
  );
}
