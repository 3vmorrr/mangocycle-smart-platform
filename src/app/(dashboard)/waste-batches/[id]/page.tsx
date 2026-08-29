"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Edit3,
  QrCode,
  AlertTriangle,
  Calendar,
  MapPin,
  Scale,
  Building,
  User,
  Clock,
  ExternalLink,
  FlaskConical,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProcessingTimeline } from "@/components/waste/ProcessingTimeline";
import { StageAdvanceModal } from "@/components/waste/StageAdvanceModal";
import { RejectBatchModal } from "@/components/waste/RejectBatchModal";
import { WasteBatchQrModal } from "@/components/waste/WasteBatchQrModal";
import {
  wasteBatchService,
  productBatchService,
  laboratoryService,
  authService,
} from "@/data/services";
import { WasteBatch } from "@/data/contracts/waste-batch";
import { ProductBatchListItem } from "@/data/contracts/product-batch";
import { LaboratoryTestListItem } from "@/data/contracts/laboratory";
import { UserProfile } from "@/data/contracts/auth";
import { CANONICAL_PROCESSING_STAGES } from "@/lib/constants/stages";
import { formatDate, formatWeightKg, formatNumber } from "@/lib/utils/formatters";
import { hasMinimumRole } from "@/lib/constants/navigation";

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel (قشور المانجو)",
  mango_seed: "Mango Seed / Kernel (بذور ونوى المانجو)",
  mixed_mango_waste: "Mixed Mango Waste (مخلفات مانجو مختلطة)",
};

const CONDITION_LABELS: Record<string, string> = {
  good: "Good (Fresh material, low degradation)",
  moderate: "Moderate (Acceptable quality, slight browning)",
  poor: "Poor (High moisture / accelerated oxidation)",
};

const MOISTURE_LABELS: Record<string, string> = {
  dry: "Dry (جاف)",
  moderate: "Moderate (متوسط)",
  high: "High (عالي)",
};

export default function WasteBatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = (params?.id as string) || "";

  const [batch, setBatch] = useState<WasteBatch | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<ProductBatchListItem[]>([]);
  const [labTests, setLabTests] = useState<LaboratoryTestListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadBatch = useCallback(async () => {
    if (!idOrCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, allProducts, allTests, user] = await Promise.all([
        wasteBatchService.getWasteBatchById(idOrCode),
        productBatchService.getProductBatches(),
        laboratoryService.getLaboratoryTests(),
        authService.getCurrentUser(),
      ]);

      if (!data) {
        setError(`Waste Batch "${idOrCode}" could not be found.`);
      } else {
        setBatch(data);
        const matchingProducts = allProducts.items.filter((p) =>
          p.linkedWasteCodes?.includes(data.batchCode)
        );
        setLinkedProducts(matchingProducts);

        const matchingTests = allTests.items.filter(
          (t) =>
            t.targetBatchId === data.id ||
            t.targetBatchCode.toUpperCase() === data.batchCode.toUpperCase()
        );
        setLabTests(matchingTests);
      }
      setCurrentUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load waste batch details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [idOrCode]);

  useEffect(() => {
    loadBatch();
  }, [loadBatch]);

  const canAdvance =
    currentUser && batch && batch.currentStatus !== "completed" && batch.currentStatus !== "rejected"
      ? hasMinimumRole(currentUser.role, "operator")
      : false;

  const canEdit =
    currentUser && batch && batch.currentStatus !== "completed" && batch.currentStatus !== "rejected"
      ? hasMinimumRole(currentUser.role, "operator")
      : false;

  const canReject =
    currentUser && batch && batch.currentStatus !== "completed" && batch.currentStatus !== "rejected"
      ? hasMinimumRole(currentUser.role, "admin")
      : false;

  const canAddLab = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  const currentStageIndex = batch
    ? CANONICAL_PROCESSING_STAGES.findIndex((s) => s.id === batch.currentStatus)
    : -1;

  const nextStage =
    batch && currentStageIndex >= 0 && currentStageIndex < CANONICAL_PROCESSING_STAGES.length - 1
      ? CANONICAL_PROCESSING_STAGES[currentStageIndex + 1]
      : null;

  const currentStageObj =
    batch && currentStageIndex >= 0
      ? CANONICAL_PROCESSING_STAGES[currentStageIndex]
      : null;

  const handleAdvanceConfirm = async (notes: string) => {
    if (!batch) return;
    setIsAdvancing(true);
    try {
      const updated = await wasteBatchService.advanceBatchStage(batch.id, { notes });
      setBatch(updated);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!batch) return;
    setIsRejecting(true);
    try {
      const updated = await wasteBatchService.rejectBatch(batch.id, { reason });
      setBatch(updated);
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading waste batch details and timeline..." />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="py-12">
        <ErrorState
          title="Waste Batch Not Found"
          message={error || "The requested waste batch does not exist."}
          onRetry={() => router.push("/waste-batches")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header & Actions */}
      <PageHeader
        title={batch.batchCode}
        description={`Registered on ${formatDate(batch.collectionDate)} from ${batch.sourceName || "Unassigned Source"}`}
        breadcrumbs={[
          { label: "Waste Batches", href: "/waste-batches" },
          { label: batch.batchCode },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQrModalOpen(true)}
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
            >
              View QR Code
            </Button>

            <Link
              href={`/trace/waste/${batch.batchCode}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Public Page
              </Button>
            </Link>

            {canEdit && (
              <Link href={`/waste-batches/${batch.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit Batch
                </Button>
              </Link>
            )}

            {canAdvance && nextStage && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAdvanceModalOpen(true)}
                leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Advance to {nextStage.name}
              </Button>
            )}

            {canReject && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
              >
                Reject
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Characteristics, Timeline, and Laboratory Tests (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Processing Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Processing Journey</CardTitle>
                <CardDescription>
                  Audit-preserved timeline across all 9 canonical processing stages.
                </CardDescription>
              </div>
              <StatusBadge status={batch.currentStatus} size="md" />
            </CardHeader>
            <CardContent className="pt-2">
              <ProcessingTimeline
                currentStatus={batch.currentStatus}
                history={batch.stageHistory}
              />
            </CardContent>
          </Card>

          {/* Card B: Associated Laboratory Tests per 14-LABORATORY-MODULE.md §4.1 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Laboratory Testing Records</CardTitle>
                </div>
                <CardDescription>
                  Analytical characterizations associated with this waste batch.
                </CardDescription>
              </div>

              {canAddLab && (
                <Link href={`/laboratory/new?wasteId=${batch.id}`}>
                  <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Lab Test
                  </Button>
                </Link>
              )}
            </CardHeader>

            <CardContent className="pt-2 space-y-3">
              {labTests.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No laboratory tests associated with this waste batch yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {labTests.map((t) => (
                    <div
                      key={t.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <Link
                          href={`/laboratory/${t.id}`}
                          className="font-semibold text-text-primary hover:text-primary transition-colors block"
                        >
                          {t.testType}
                        </Link>
                        <span className="font-mono text-[11px] text-text-secondary">
                          {formatDate(t.testDate)}
                        </span>
                        {t.numericResultFormatted && (
                          <p className="font-mono font-bold text-primary text-xs">
                            Result: {t.numericResultFormatted}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            t.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200"
                          }`}
                        >
                          {t.status}
                        </span>
                        <Link
                          href={`/laboratory/${t.id}`}
                          className="text-primary hover:text-primary-dark font-semibold text-xs inline-flex items-center gap-0.5"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card C: Downstream Linked Product Formulations (REVERSE TRACEABILITY LINK) */}
          {linkedProducts.length > 0 && (
            <Card variant="accent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Formulated Biological Products</CardTitle>
                </div>
                <CardDescription>
                  Downstream products synthesized using raw material from this waste batch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${p.id}`}
                          className="font-mono font-bold text-sm text-text-primary hover:text-primary transition-colors"
                        >
                          {p.batchCode}
                        </Link>
                        <StatusBadge status={p.status} size="sm" />
                      </div>
                      <p className="font-semibold text-text-primary">
                        {p.productName} {p.productType ? `(${p.productType})` : ""}
                      </p>
                      {p.quantityProduced !== null && (
                        <p className="font-mono text-text-secondary text-[11px]">
                          Output: {formatNumber(p.quantityProduced)} {p.unit || ""}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/products/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors self-end sm:self-center shrink-0"
                    >
                      <span>View Product</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Card D: Operational Notes */}
          {batch.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Operational Notes</CardTitle>
                <CardDescription>Internal intake observations and handling guidelines.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/30 text-xs text-text-primary leading-relaxed font-medium">
                  {batch.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Batch Identity & Provenance (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Core Characteristics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Batch Profile</CardTitle>
              <CardDescription>Raw intake specifications and physical attributes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs divide-y divide-border/50">
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-primary" />
                  <span>Initial Weight</span>
                </span>
                <span className="font-mono font-bold text-sm text-text-primary">
                  {formatWeightKg(batch.weightKg)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary">Waste Classification</span>
                <span className="font-semibold text-text-primary">
                  {WASTE_TYPE_LABELS[batch.wasteType] || batch.wasteType}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Waste Source</span>
                </span>
                <span className="font-semibold text-text-primary">
                  {batch.sourceName || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Collection Date</span>
                </span>
                <span className="font-medium text-text-primary">
                  {formatDate(batch.collectionDate)}
                </span>
              </div>

              {batch.location && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-text-secondary flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                    <span>Intake Location</span>
                  </span>
                  <span className="font-medium text-text-primary truncate max-w-[200px]">
                    {batch.location}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Qualitative Condition & Storage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Physical Condition & Storage</CardTitle>
              <CardDescription>Qualitative assessments recorded at intake.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs divide-y divide-border/50">
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-secondary">Visual Condition</span>
                <span className="font-semibold text-text-primary">
                  {batch.visualCondition
                    ? CONDITION_LABELS[batch.visualCondition] || batch.visualCondition
                    : "Unspecified"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary">Manual Moisture Status</span>
                <span className="font-semibold text-text-primary">
                  {batch.moistureStatus
                    ? MOISTURE_LABELS[batch.moistureStatus] || batch.moistureStatus
                    : "Unspecified"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Storage Duration</span>
                </span>
                <span className="font-mono font-semibold text-text-primary">
                  {batch.storageDurationDays ?? 0} Day(s)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Provenance & System Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Metadata</CardTitle>
              <CardDescription>Internal audit tracking and creation record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Created By</span>
                <span className="font-medium text-text-primary flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" />
                  {batch.creatorName || "System Operator"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created Timestamp</span>
                <span className="font-mono">{formatDate(batch.createdAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Modified</span>
                <span className="font-mono">{formatDate(batch.updatedAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Waste Batch QR Modal */}
      <WasteBatchQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        batchCode={batch.batchCode}
        wasteTypeLabel={WASTE_TYPE_LABELS[batch.wasteType]}
      />

      {/* 4. Stage Advance Modal */}
      {nextStage && (
        <StageAdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          currentStageName={currentStageObj?.name || batch.currentStatus}
          nextStage={nextStage}
          onConfirm={handleAdvanceConfirm}
          isLoading={isAdvancing}
        />
      )}

      {/* 5. Reject Batch Modal */}
      <RejectBatchModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        batchCode={batch.batchCode}
        onConfirm={handleRejectConfirm}
        isLoading={isRejecting}
      />
    </div>
  );
}
