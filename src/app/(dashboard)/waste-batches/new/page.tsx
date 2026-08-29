"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WasteBatchForm } from "@/components/waste/WasteBatchForm";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { wasteBatchService } from "@/data/services";
import { WasteSource } from "@/data/contracts/waste-batch";
import { WasteBatchFormInput } from "@/lib/validators/waste-batch";

export default function NewWasteBatchPage() {
  const router = useRouter();
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSources() {
      try {
        const result = await wasteBatchService.getWasteSources();
        setSources(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load waste sources."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadSources();
  }, []);

  const handleSubmit = async (formData: WasteBatchFormInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await wasteBatchService.createWasteBatch({
        waste_type: formData.waste_type,
        source_id: formData.source_id || null,
        weight_kg: formData.weight_kg,
        collection_date: formData.collection_date,
        location: formData.location || null,
        visual_condition: formData.visual_condition || null,
        moisture_status: formData.moisture_status || null,
        storage_duration_days: formData.storage_duration_days || 0,
        notes: formData.notes || null,
      });

      router.push(`/waste-batches/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to register waste batch."
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading waste registration form..." />
      </div>
    );
  }

  if (error && sources.length === 0) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Load Form"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Register Waste Batch"
        description="Record newly collected mango waste material into the platform for processing tracking."
        breadcrumbs={[
          { label: "Waste Batches", href: "/waste-batches" },
          { label: "Register New Batch" },
        ]}
      />

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          {error}
        </div>
      )}

      <WasteBatchForm
        sources={sources}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        mode="create"
      />
    </div>
  );
}
