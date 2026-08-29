"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { WasteBatchForm } from "@/components/waste/WasteBatchForm";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { wasteBatchService } from "@/data/services";
import { WasteBatch, WasteSource } from "@/data/contracts/waste-batch";
import { WasteBatchFormInput } from "@/lib/validators/waste-batch";

export default function EditWasteBatchPage() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = (params?.id as string) || "";

  const [batch, setBatch] = useState<WasteBatch | null>(null);
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!idOrCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const [batchData, sourcesData] = await Promise.all([
        wasteBatchService.getWasteBatchById(idOrCode),
        wasteBatchService.getWasteSources(),
      ]);

      if (!batchData) {
        setError(`Waste Batch "${idOrCode}" could not be found.`);
      } else {
        setBatch(batchData);
      }
      setSources(sourcesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load waste batch for editing."
      );
    } finally {
      setIsLoading(false);
    }
  }, [idOrCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (formData: WasteBatchFormInput) => {
    if (!batch) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await wasteBatchService.updateWasteBatch(batch.id, {
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

      router.push(`/waste-batches/${batch.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update waste batch."
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading waste batch for editing..." />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Edit Batch"
          message={error || "Waste batch record not found."}
          onRetry={() => router.push("/waste-batches")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Edit Batch ${batch.batchCode}`}
        description="Update operational notes, source origin, or physical characteristics."
        breadcrumbs={[
          { label: "Waste Batches", href: "/waste-batches" },
          { label: batch.batchCode, href: `/waste-batches/${batch.id}` },
          { label: "Edit" },
        ]}
      />

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          {error}
        </div>
      )}

      <WasteBatchForm
        initialData={batch}
        sources={sources}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        mode="edit"
      />
    </div>
  );
}
