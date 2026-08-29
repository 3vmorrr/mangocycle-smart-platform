"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LabTestForm } from "@/components/laboratory/LabTestForm";
import { laboratoryService } from "@/data/services";
import { LaboratoryTest, AttachmentInput } from "@/data/contracts/laboratory";
import { LaboratoryTestFormValues } from "@/lib/validators/laboratory";

export default function EditLaboratoryTestPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [test, setTest] = useState<LaboratoryTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTest = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await laboratoryService.getLaboratoryTestById(id);
      if (!data) {
        setError(`Laboratory Test "${id}" not found.`);
      } else {
        setTest(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load laboratory test record."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const handleSubmit = async (
    values: LaboratoryTestFormValues,
    attachments?: AttachmentInput[]
  ) => {
    if (!test) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await laboratoryService.updateLaboratoryTest(test.id, {
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

      router.push(`/laboratory/${test.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update laboratory test record."
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading laboratory test form..." />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="py-12">
        <ErrorState
          title="Laboratory Test Not Found"
          message={error || "The requested laboratory test record does not exist."}
          onRetry={() => router.push("/laboratory")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Edit ${test.testType}`}
        description="Modify recorded assay parameters, analytical results, or attach additional files."
        breadcrumbs={[
          { label: "Laboratory", href: "/laboratory" },
          { label: test.testType, href: `/laboratory/${test.id}` },
          { label: "Edit" },
        ]}
      />

      <LabTestForm
        initialData={test}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        cancelHref={`/laboratory/${test.id}`}
      />
    </div>
  );
}
