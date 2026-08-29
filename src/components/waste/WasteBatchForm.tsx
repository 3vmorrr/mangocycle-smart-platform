"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  wasteBatchFormSchema,
  WasteBatchFormInput,
} from "@/lib/validators/waste-batch";
import { WasteSource, WasteBatch } from "@/data/contracts/waste-batch";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Save, AlertCircle, Info, Radio, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SmartBinPickerModal } from "@/components/iot/SmartBinPickerModal";

interface WasteBatchFormProps {
  initialData?: Partial<WasteBatch>;
  sources: WasteSource[];
  onSubmit: (data: WasteBatchFormInput) => Promise<void>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const WasteBatchForm: React.FC<WasteBatchFormProps> = ({
  initialData,
  sources,
  onSubmit,
  isLoading = false,
  mode = "create",
}) => {
  const today = new Date().toISOString().split("T")[0];
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [iotProvenance, setIotProvenance] = React.useState<{
    deviceCode: string;
    timestamp: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WasteBatchFormInput>({
    resolver: zodResolver(wasteBatchFormSchema),
    defaultValues: {
      waste_type: initialData?.wasteType || "mango_peel",
      source_id: initialData?.sourceId || "",
      weight_kg: initialData?.weightKg !== undefined ? initialData.weightKg : ("" as unknown as number),
      collection_date: initialData?.collectionDate || today,
      location: initialData?.location || "",
      visual_condition: initialData?.visualCondition || undefined,
      moisture_status: initialData?.moistureStatus || undefined,
      storage_duration_days: initialData?.storageDurationDays !== undefined && initialData.storageDurationDays !== null
        ? initialData.storageDurationDays
        : 0,
      notes: initialData?.notes || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Core Waste Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Waste Characteristics & Intake</CardTitle>
          <CardDescription>
            Record raw material type, intake scale weight, and collection provenance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Waste Type */}
            <div>
              <label
                htmlFor="waste_type"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Waste Type <span className="text-danger">*</span>
              </label>
              <select
                id="waste_type"
                {...register("waste_type")}
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                  errors.waste_type
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
              >
                <option value="mango_peel">Mango Peel (قشور المانجو)</option>
                <option value="mango_seed">Mango Seed / Kernel (بذور ونوى المانجو)</option>
                <option value="mixed_mango_waste">Mixed Mango Waste (مخلفات مانجو مختلطة)</option>
              </select>
              {errors.waste_type && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.waste_type.message}</span>
                </p>
              )}
            </div>

            {/* Waste Source */}
            <div>
              <label
                htmlFor="source_id"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Waste Source / Origin
              </label>
              <select
                id="source_id"
                {...register("source_id")}
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                  errors.source_id
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
              >
                <option value="">-- Select Source (Optional) --</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.name}
                  </option>
                ))}
              </select>
              {errors.source_id && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.source_id.message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight (kg) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="weight_kg"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Initial Weight (kg) <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Radio className="w-3 h-3" />
                  <span>Select from Smart Bin</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="weight_kg"
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="10000"
                  placeholder="e.g. 2.50"
                  {...register("weight_kg")}
                  className={cn(
                    "w-full ps-3 pe-10 py-2 text-xs rounded-lg border bg-surface text-text-primary font-mono placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all",
                    errors.weight_kg
                      ? "border-danger focus:ring-danger/20"
                      : "border-border focus:ring-primary/20 focus:border-primary"
                  )}
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary">
                  kg
                </span>
              </div>

              {iotProvenance && (
                <div className="mt-1.5 p-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-[10px] text-text-primary flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                    <span>Pre-filled from Smart Bin <strong>{iotProvenance.deviceCode}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIotProvenance(null)}
                    className="text-text-secondary hover:text-danger text-[10px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {errors.weight_kg ? (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.weight_kg.message}</span>
                </p>
              ) : !iotProvenance ? (
                <p className="text-[10px] text-text-secondary mt-1">
                  Must be greater than 0 kg and up to 10,000 kg. Manual entry is always active.
                </p>
              ) : null}
            </div>

            {/* Collection Date */}
            <div>
              <label
                htmlFor="collection_date"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Collection Date <span className="text-danger">*</span>
              </label>
              <input
                id="collection_date"
                type="date"
                max={today}
                {...register("collection_date")}
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary focus:outline-none focus:ring-2 transition-all",
                  errors.collection_date
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
              >
              </input>
              {errors.collection_date && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.collection_date.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Intake Location / Facility Unit
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Campus Farm Unit B, Intake Bay 2"
              maxLength={500}
              {...register("location")}
              className={cn(
                "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all",
                errors.location
                  ? "border-danger focus:ring-danger/20"
                  : "border-border focus:ring-primary/20 focus:border-primary"
              )}
            />
            {errors.location && (
              <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.location.message}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Qualitative Condition Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Physical Condition & Storage</CardTitle>
          <CardDescription>
            Manual visual inspection and storage parameters at reception.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Visual Condition */}
            <div>
              <label
                htmlFor="visual_condition"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Visual Condition
              </label>
              <select
                id="visual_condition"
                {...register("visual_condition")}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">-- Unspecified --</option>
                <option value="good">Good (Clean, fresh material)</option>
                <option value="moderate">Moderate (Slight browning)</option>
                <option value="poor">Poor (Degraded/High moisture)</option>
              </select>
            </div>

            {/* Moisture Status (Conservative Manual Label) */}
            <div>
              <label
                htmlFor="moisture_status"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Manual Moisture Status
              </label>
              <select
                id="moisture_status"
                {...register("moisture_status")}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">-- Unspecified --</option>
                <option value="dry">Dry (جاف)</option>
                <option value="moderate">Moderate (متوسط الرطوبة)</option>
                <option value="high">High (عالي الرطوبة)</option>
              </select>
              <span className="text-[10px] text-text-secondary/70 mt-1 block">
                Manual qualitative observation
              </span>
            </div>

            {/* Storage Duration Days */}
            <div>
              <label
                htmlFor="storage_duration_days"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Storage Duration (Days)
              </label>
              <input
                id="storage_duration_days"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...register("storage_duration_days")}
                className={cn(
                  "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary font-mono placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all",
                  errors.storage_duration_days
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20 focus:border-primary"
                )}
              />
              {errors.storage_duration_days && (
                <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.storage_duration_days.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Operational & Research Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={2000}
              placeholder="e.g. Tommy Atkins variety peels, received cleanly after pulping, requires immediate drying tunnel schedule."
              {...register("notes")}
              className={cn(
                "w-full px-3 py-2 text-xs rounded-lg border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all",
                errors.notes
                  ? "border-danger focus:ring-danger/20"
                  : "border-border focus:ring-primary/20 focus:border-primary"
              )}
            />
            {errors.notes && (
              <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.notes.message}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Disclaimer Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-surface text-xs text-text-secondary">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-text-primary">
            {mode === "create" ? "Batch Code Generation" : "Stage Preservation"}
          </p>
          <p className="text-[11px]">
            {mode === "create"
              ? "A unique public identifier in format MW-YYYY-NNN will be assigned upon creation. The batch will enter the Collected stage."
              : "Historical processing stage records are immutable and will be preserved."}
          </p>
        </div>
      </div>

      {/* 4. Action Buttons */}
      <CardFooter className="p-0 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {mode === "create" ? "Register Waste Batch" : "Save Batch Changes"}
        </Button>
      </CardFooter>

      <SmartBinPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectWeight={(weight, deviceCode, timestamp) => {
          setValue("weight_kg", weight, { shouldValidate: true });
          setIotProvenance({ deviceCode, timestamp });
        }}
      />
    </form>
  );
};
