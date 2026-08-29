"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductBatchForm } from "@/components/products/ProductBatchForm";
import { productBatchService } from "@/data/services";
import { ProductBatch } from "@/data/contracts/product-batch";
import { ProductBatchFormValues } from "@/lib/validators/product-batch";

export default function EditProductBatchPage() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = (params?.id as string) || "";

  const [product, setProduct] = useState<ProductBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!idOrCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await productBatchService.getProductBatchById(idOrCode);
      if (!data) {
        setError(`Product Batch "${idOrCode}" not found.`);
      } else {
        setProduct(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load product batch."
      );
    } finally {
      setIsLoading(false);
    }
  }, [idOrCode]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (values: ProductBatchFormValues) => {
    if (!product) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await productBatchService.updateProductBatch(product.id, {
        product_name: values.product_name,
        product_type: values.product_type || null,
        production_date: values.production_date || null,
        quantity_produced: values.quantity_produced ?? null,
        unit: values.unit || null,
        status: values.status,
        notes: values.notes || null,
        waste_batch_ids: values.waste_batch_ids,
      });

      router.push(`/products/${product.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update product batch."
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading product batch form..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12">
        <ErrorState
          title="Product Batch Not Found"
          message={error || "The requested product batch does not exist."}
          onRetry={() => router.push("/products")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`Edit ${product.batchCode}`}
        description={`Modifying ${product.productName}`}
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: product.batchCode, href: `/products/${product.id}` },
          { label: "Edit" },
        ]}
      />

      <ProductBatchForm
        initialData={product}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        cancelHref={`/products/${product.id}`}
      />
    </div>
  );
}
