"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Layers,
  FlaskConical,
  Scale,
  Check,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  productBatchFormSchema,
  ProductBatchFormValues,
} from "@/lib/validators/product-batch";
import { ProductBatch } from "@/data/contracts/product-batch";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { wasteBatchService } from "@/data/services";
import { formatWeightKg } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils/cn";

interface ProductBatchFormProps {
  initialData?: ProductBatch | null;
  onSubmit: (values: ProductBatchFormValues) => Promise<void>;
  isSubmitting?: boolean;
  cancelHref?: string;
}

interface RawFormValues {
  product_name: string;
  product_type: string;
  production_date: string;
  quantity_produced: string | number;
  unit: string;
  status: "in_production" | "testing" | "completed" | "released" | "rejected";
  notes: string;
  waste_batch_ids: string[];
}

const COMMON_PRODUCT_TYPES = [
  "Biofungicide",
  "NanoBiovera",
  "Nanoparticles",
  "Bio-Extract",
  "Organic Formulation",
];

const COMMON_UNITS = ["mL", "L", "kg", "g", "bottles", "units"];

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Peel",
  mango_seed: "Seed",
  mixed_mango_waste: "Mixed",
};

export const ProductBatchForm: React.FC<ProductBatchFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  cancelHref = "/products",
}) => {
  const [wasteBatches, setWasteBatches] = useState<WasteBatchListItem[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RawFormValues>({
    defaultValues: {
      product_name: initialData?.productName || "",
      product_type: initialData?.productType || "Biofungicide",
      production_date:
        initialData?.productionDate || new Date().toISOString().split("T")[0],
      quantity_produced: initialData?.quantityProduced !== null && initialData?.quantityProduced !== undefined ? initialData.quantityProduced : "",
      unit: initialData?.unit || "mL",
      status: initialData?.status || "in_production",
      notes: initialData?.notes || "",
      waste_batch_ids: initialData?.linkedWasteBatches?.map((w) => w.id) || [],
    },
  });

  const selectedWasteIds = watch("waste_batch_ids") || [];

  useEffect(() => {
    async function loadWasteBatches() {
      setIsLoadingBatches(true);
      try {
        const res = await wasteBatchService.getWasteBatches({ pageSize: 100 });
        setWasteBatches(res.items);
      } finally {
        setIsLoadingBatches(false);
      }
    }
    loadWasteBatches();
  }, []);

  const toggleWasteBatch = (batchId: string) => {
    const current = selectedWasteIds;
    const exists = current.includes(batchId);
    let updated: string[];
    if (exists) {
      updated = current.filter((id) => id !== batchId);
    } else {
      updated = [...current, batchId];
    }
    setValue("waste_batch_ids", updated, { shouldValidate: true });
  };

  const handleFormSubmit = async (raw: RawFormValues) => {
    const parsedQuantity =
      raw.quantity_produced === "" || raw.quantity_produced === null || raw.quantity_produced === undefined
        ? null
        : Number(raw.quantity_produced);

    const valuesToValidate: ProductBatchFormValues = {
      product_name: raw.product_name,
      product_type: raw.product_type || null,
      production_date: raw.production_date || null,
      quantity_produced: parsedQuantity,
      unit: raw.unit || null,
      status: raw.status,
      notes: raw.notes || null,
      waste_batch_ids: raw.waste_batch_ids,
    };

    const validation = productBatchFormSchema.safeParse(valuesToValidate);
    if (!validation.success) {
      return;
    }

    await onSubmit(validation.data);
  };

  const selectedBatches = wasteBatches.filter((b) => selectedWasteIds.includes(b.id));
  const totalSelectedWeight = selectedBatches.reduce((acc, b) => acc + (b.weightKg || 0), 0);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 1. Core Product Specifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Product Batch Identity</CardTitle>
          </div>
          <CardDescription>
            Specify product naming, formulation type, and output quantity metrics.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="product_name"
                className="block text-xs font-semibold text-text-primary"
              >
                Product Formulation Name <span className="text-danger">*</span>
              </label>
              <input
                id="product_name"
                type="text"
                placeholder="e.g. Biofungicide Formulation Alpha"
                {...register("product_name", { required: "Product name is required" })}
                className={cn(
                  "w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-text-primary focus:outline-none focus:ring-1 transition-colors",
                  errors.product_name
                    ? "border-danger focus:ring-danger"
                    : "border-border focus:border-primary focus:ring-primary"
                )}
              />
              {errors.product_name && (
                <p className="text-[11px] text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.product_name.message}</span>
                </p>
              )}
            </div>

            {/* Product Type */}
            <div className="space-y-1.5">
              <label
                htmlFor="product_type"
                className="block text-xs font-semibold text-text-primary"
              >
                Product Classification / Type
              </label>
              <div className="space-y-1.5">
                <input
                  id="product_type"
                  type="text"
                  placeholder="e.g. Biofungicide, NanoBiovera"
                  {...register("product_type")}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_PRODUCT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("product_type", type, { shouldValidate: true })}
                      className="px-2 py-0.5 text-[10px] rounded-md border border-border bg-surface hover:bg-surface-secondary text-text-secondary transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Production Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="production_date"
                className="block text-xs font-semibold text-text-primary"
              >
                Production Date
              </label>
              <input
                id="production_date"
                type="date"
                {...register("production_date")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Quantity Produced */}
            <div className="space-y-1.5">
              <label
                htmlFor="quantity_produced"
                className="block text-xs font-semibold text-text-primary"
              >
                Quantity Produced
              </label>
              <input
                id="quantity_produced"
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g. 500"
                {...register("quantity_produced")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label
                htmlFor="unit"
                className="block text-xs font-semibold text-text-primary"
              >
                Measurement Unit
              </label>
              <div className="space-y-1.5">
                <input
                  id="unit"
                  type="text"
                  placeholder="e.g. mL, L, kg, bottles"
                  {...register("unit")}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setValue("unit", u, { shouldValidate: true })}
                      className="px-2 py-0.5 text-[10px] rounded-md border border-border bg-surface hover:bg-surface-secondary text-text-secondary transition-colors"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-text-primary"
              >
                Initial Production Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="in_production">In Production</option>
                <option value="testing">Testing</option>
                <option value="completed">Completed</option>
                <option value="released">Released</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-text-primary"
            >
              Formulation / Synthesis Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Record extraction details, solvents, synthesis procedure, or research observations..."
              {...register("notes")}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Waste Batch Input Linking Multi-Selector */}
      <Card variant="accent">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">
                Input Waste Batches <span className="text-danger">*</span>
              </CardTitle>
            </div>
            <CardDescription>
              Select the source Waste Batch(es) that contributed raw material to this product.
            </CardDescription>
          </div>

          <div className="text-end">
            <span className="text-[10px] uppercase font-bold text-text-secondary block">
              Selected ({selectedWasteIds.length})
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-primary">
              {formatWeightKg(totalSelectedWeight)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {selectedWasteIds.length === 0 && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Select at least one input waste batch for traceability.</span>
            </div>
          )}

          {isLoadingBatches ? (
            <div className="p-6 text-center text-xs text-text-secondary">
              Loading registered waste batches...
            </div>
          ) : wasteBatches.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-secondary">
              No waste batches available. Please register a waste batch first.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
              {wasteBatches.map((wb) => {
                const isSelected = selectedWasteIds.includes(wb.id);

                return (
                  <button
                    key={wb.id}
                    type="button"
                    onClick={() => toggleWasteBatch(wb.id)}
                    className={cn(
                      "p-3 rounded-xl border text-start text-xs transition-all relative flex flex-col justify-between gap-2 focus:outline-none focus-ring",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-2xs ring-1 ring-primary/40"
                        : "border-border bg-surface hover:bg-surface-secondary/60 opacity-85"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div>
                        <span className="font-mono font-bold text-xs text-text-primary block">
                          {wb.batchCode}
                        </span>
                        <span className="text-[11px] font-medium text-text-secondary">
                          {WASTE_TYPE_LABELS[wb.wasteType] || wb.wasteType}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0",
                          isSelected
                            ? "bg-primary border-primary text-white"
                            : "border-border bg-surface"
                        )}
                        aria-hidden="true"
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="w-full pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px] text-text-secondary">
                      <span className="font-mono font-semibold text-text-primary flex items-center gap-1">
                        <Scale className="w-3 h-3 text-primary" />
                        {formatWeightKg(wb.weightKg)}
                      </span>
                      <StatusBadge status={wb.currentStatus} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Form Submit Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = cancelHref)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={selectedWasteIds.length === 0}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? "Update Product Batch" : "Register Product Batch"}
        </Button>
      </div>
    </form>
  );
};
