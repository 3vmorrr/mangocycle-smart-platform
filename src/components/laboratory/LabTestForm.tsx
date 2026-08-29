"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FlaskConical,
  Layers,
  Paperclip,
  AlertCircle,
  Save,
  Trash2,
  FileText,
  Upload,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  laboratoryTestFormSchema,
  LaboratoryTestFormValues,
} from "@/lib/validators/laboratory";
import {
  LaboratoryTest,
  AttachmentInput,
  LabTestStatus,
} from "@/data/contracts/laboratory";
import { ProductBatchListItem } from "@/data/contracts/product-batch";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { productBatchService, wasteBatchService } from "@/data/services";
import { cn } from "@/lib/utils/cn";

interface LabTestFormProps {
  initialData?: LaboratoryTest | null;
  onSubmit: (values: LaboratoryTestFormValues, attachments?: AttachmentInput[]) => Promise<void>;
  isSubmitting?: boolean;
  cancelHref?: string;
}

interface RawFormValues {
  test_type: string;
  waste_batch_id: string;
  product_batch_id: string;
  test_date: string;
  status: LabTestStatus;
  result_summary: string;
  numeric_result: string | number;
  result_unit: string;
  researcher_notes: string;
}

const COMMON_TEST_TYPES = [
  "UV-Vis Spectroscopy",
  "TEM (Transmission Electron Microscopy)",
  "XRD (X-Ray Diffraction)",
  "FTIR (Fourier Transform Infrared)",
  "Antimicrobial Efficacy Assay",
  "Antioxidant Activity Assay",
  "In Vitro Antifungal Assay",
  "In Vivo Field Evaluation",
];

const COMMON_UNITS = ["nm", "%", "mg/L", "mm", "µg/mL", "AU"];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const LabTestForm: React.FC<LabTestFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  cancelHref = "/laboratory",
}) => {
  const [productBatches, setProductBatches] = useState<ProductBatchListItem[]>([]);
  const [wasteBatches, setWasteBatches] = useState<WasteBatchListItem[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Local state for pending attachments to upload with this form
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentInput[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RawFormValues>({
    defaultValues: {
      test_type: initialData?.testType || "UV-Vis Spectroscopy",
      waste_batch_id: initialData?.wasteBatchId || "",
      product_batch_id: initialData?.productBatchId || "",
      test_date:
        initialData?.testDate || new Date().toISOString().split("T")[0],
      status: initialData?.status || "completed",
      result_summary: initialData?.resultSummary || "",
      numeric_result:
        initialData?.numericResult !== null && initialData?.numericResult !== undefined
          ? initialData.numericResult
          : "",
      result_unit: initialData?.resultUnit || "nm",
      researcher_notes: initialData?.researcherNotes || "",
    },
  });

  const selectedWasteId = watch("waste_batch_id");
  const selectedProductId = watch("product_batch_id");

  useEffect(() => {
    async function loadBatches() {
      setIsLoadingBatches(true);
      try {
        const [prodRes, wasteRes] = await Promise.all([
          productBatchService.getProductBatches({ pageSize: 100 }),
          wasteBatchService.getWasteBatches({ pageSize: 100 }),
        ]);
        setProductBatches(prodRes.items);
        setWasteBatches(wasteRes.items);
      } finally {
        setIsLoadingBatches(false);
      }
    }
    loadBatches();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAtts: AttachmentInput[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Max 10MB per 14-LABORATORY-MODULE.md §3.2
      if (file.size > 10 * 1024 * 1024) {
        setAttachmentError(`File "${file.name}" exceeds the 10 MB maximum limit.`);
        continue;
      }
      if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
        setAttachmentError(
          `File "${file.name}" has an unsupported format. Allowed formats: PDF, JPEG, PNG, TIFF, CSV, XLSX.`
        );
        continue;
      }

      newAtts.push({
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      });
    }

    if (newAtts.length > 0) {
      setPendingAttachments((prev) => [...prev, ...newAtts]);
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (raw: RawFormValues) => {
    const parsedNumeric =
      raw.numeric_result === "" || raw.numeric_result === null || raw.numeric_result === undefined
        ? null
        : Number(raw.numeric_result);

    const valuesToValidate: LaboratoryTestFormValues = {
      test_type: raw.test_type,
      waste_batch_id: raw.waste_batch_id || null,
      product_batch_id: raw.product_batch_id || null,
      test_date: raw.test_date || null,
      status: raw.status,
      result_summary: raw.result_summary || null,
      numeric_result: parsedNumeric,
      result_unit: raw.result_unit || null,
      researcher_notes: raw.researcher_notes || null,
    };

    const validation = laboratoryTestFormSchema.safeParse(valuesToValidate);
    if (!validation.success) {
      return;
    }

    await onSubmit(validation.data, pendingAttachments.length > 0 ? pendingAttachments : undefined);
  };

  const hasBatchSelected = Boolean(selectedWasteId || selectedProductId);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 1. Test Identity & Type Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Laboratory Assay Identity</CardTitle>
          </div>
          <CardDescription>
            Specify analytical test characterization type, test date, and workflow status.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Type Input */}
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="test_type"
                className="block text-xs font-semibold text-text-primary"
              >
                Test Characterization Type <span className="text-danger">*</span>
              </label>
              <input
                id="test_type"
                type="text"
                placeholder="e.g. UV-Vis Spectroscopy, TEM, Antimicrobial Assay"
                {...register("test_type", { required: "Test type is required" })}
                className={cn(
                  "w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-background text-text-primary focus:outline-none focus:ring-1 transition-colors",
                  errors.test_type
                    ? "border-danger focus:ring-danger"
                    : "border-border focus:border-primary focus:ring-primary"
                )}
              />
              {/* Quick Type Selection Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COMMON_TEST_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("test_type", type, { shouldValidate: true })}
                    className="px-2 py-0.5 text-[10px] rounded-md border border-border bg-surface hover:bg-surface-secondary text-text-secondary transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.test_type && (
                <p className="text-[11px] text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.test_type.message}</span>
                </p>
              )}
            </div>

            {/* Test Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="test_date"
                className="block text-xs font-semibold text-text-primary"
              >
                Assay Test Date
              </label>
              <input
                id="test_date"
                type="date"
                {...register("test_date")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label
                htmlFor="status"
                className="block text-xs font-semibold text-text-primary"
              >
                Test Workflow Status <span className="text-danger">*</span>
              </label>
              <select
                id="status"
                {...register("status")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              >
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Target Batch Linkage Card */}
      <Card variant="accent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">
              Target Batch Association <span className="text-danger">*</span>
            </CardTitle>
          </div>
          <CardDescription>
            Associate this test record with a Product Batch (BF-...) or Waste Batch (MW-...). At least one is required per 25-VALIDATION-RULES.md §4.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!hasBatchSelected && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please select at least one Product Batch or Waste Batch.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Batch Link */}
            <div className="space-y-1.5">
              <label
                htmlFor="product_batch_id"
                className="block text-xs font-semibold text-text-primary flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                <span>Link Product Batch (BF-...)</span>
              </label>
              <select
                id="product_batch_id"
                {...register("product_batch_id")}
                disabled={isLoadingBatches}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
              >
                <option value="">-- No Product Batch Linked --</option>
                {productBatches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.batchCode} — {p.productName} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Waste Batch Link */}
            <div className="space-y-1.5">
              <label
                htmlFor="waste_batch_id"
                className="block text-xs font-semibold text-text-primary flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Link Waste Batch (MW-...)</span>
              </label>
              <select
                id="waste_batch_id"
                {...register("waste_batch_id")}
                disabled={isLoadingBatches}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
              >
                <option value="">-- No Waste Batch Linked --</option>
                {wasteBatches.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.batchCode} — {w.wasteType} ({w.currentStatus})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Analytical Results & Measurements Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Recorded Results & Measurements</CardTitle>
          </div>
          <CardDescription>
            Record quantitative parameters (e.g. wavelength peak, nanoparticle size) and qualitative observations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Numeric Result */}
            <div className="space-y-1.5">
              <label
                htmlFor="numeric_result"
                className="block text-xs font-semibold text-text-primary"
              >
                Quantitative Metric Result
              </label>
              <input
                id="numeric_result"
                type="number"
                step="any"
                placeholder="e.g. 425, 22.4, 98.2"
                {...register("numeric_result")}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
              />
            </div>

            {/* Result Unit */}
            <div className="space-y-1.5">
              <label
                htmlFor="result_unit"
                className="block text-xs font-semibold text-text-primary"
              >
                Metric Unit
              </label>
              <div className="space-y-1.5">
                <input
                  id="result_unit"
                  type="text"
                  placeholder="e.g. nm, %, mg/L, mm"
                  {...register("result_unit")}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setValue("result_unit", u, { shouldValidate: true })}
                      className="px-2 py-0.5 text-[10px] rounded-md border border-border bg-surface hover:bg-surface-secondary text-text-secondary transition-colors"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Result Summary */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="result_summary"
              className="block text-xs font-semibold text-text-primary"
            >
              Analytical Result Summary
            </label>
            <textarea
              id="result_summary"
              rows={3}
              placeholder="Record descriptive observations (e.g., surface plasmon resonance peak at 425 nm, average spherical nanoparticle diameter 22.4 nm)..."
              {...register("result_summary")}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Researcher Notes (Private) */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="researcher_notes"
              className="block text-xs font-semibold text-text-primary"
            >
              Internal Researcher Notes (Private)
            </label>
            <textarea
              id="researcher_notes"
              rows={2}
              placeholder="Private methodology notes, blank corrections, solvent ratios, or instrument calibration details..."
              {...register("researcher_notes")}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. File Attachments Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Spectra & File Attachments</CardTitle>
          </div>
          <CardDescription>
            Attach export files (PDF, JPEG, PNG, TIFF, CSV, XLSX, max 10MB per file).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {attachmentError && (
            <div className="p-3 rounded-lg border border-danger/40 bg-danger/10 text-xs text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{attachmentError}</span>
            </div>
          )}

          {/* Upload Input */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-surface-secondary/30 transition-colors">
            <Upload className="w-8 h-8 text-text-secondary mx-auto mb-2" />
            <p className="text-xs font-semibold text-text-primary">
              Click to select or drop instrument export files
            </p>
            <p className="text-[11px] text-text-secondary mt-1">
              Supports PDF, PNG, JPG, TIFF, CSV, XLSX (up to 10 MB per file)
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.csv,.xlsx"
            />
            <label
              htmlFor="file-upload-input"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-secondary text-text-primary cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </label>
          </div>

          {/* Pending Attachments List */}
          {pendingAttachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-text-secondary block">
                Files to attach ({pendingAttachments.length}):
              </span>
              <div className="space-y-1.5">
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border bg-surface-secondary/40 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-medium text-text-primary truncate">
                        {att.fileName}
                      </span>
                      <span className="font-mono text-[10px] text-text-secondary">
                        ({Math.round(att.fileSizeBytes / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(idx)}
                      className="p-1 text-text-secondary hover:text-danger rounded transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Form Submit Actions */}
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
          disabled={!hasBatchSelected}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? "Update Laboratory Test" : "Record Laboratory Test"}
        </Button>
      </div>
    </form>
  );
};
