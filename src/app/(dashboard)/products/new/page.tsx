"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductBatchForm } from "@/components/products/ProductBatchForm";
import { productBatchService } from "@/data/services";
import { ProductBatchFormValues } from "@/lib/validators/product-batch";

export default function CreateProductBatchPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: ProductBatchFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await productBatchService.createProductBatch({
        product_name: values.product_name,
        product_type: values.product_type || null,
        production_date: values.production_date || null,
        quantity_produced: values.quantity_produced ?? null,
        unit: values.unit || null,
        status: values.status,
        notes: values.notes || null,
        waste_batch_ids: values.waste_batch_ids,
      });

      router.push(`/products/${created.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create product batch."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Create Product Batch"
        description="Register a new biological product formulation and link contributing input waste batches."
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: "New Batch" },
        ]}
      />

      {error && (
        <div className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-xs text-danger">
          <strong>Registration Error:</strong> {error}
        </div>
      )}

      <ProductBatchForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        cancelHref="/products"
      />
    </div>
  );
}
