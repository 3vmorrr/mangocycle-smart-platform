"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Edit3,
  QrCode,
  Calendar,
  User,
  FlaskConical,
  Sparkles,
  ExternalLink,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { InputWasteBatchesCard } from "@/components/products/InputWasteBatchesCard";
import { ProductBatchQrModal } from "@/components/products/ProductBatchQrModal";
import {
  productBatchService,
  laboratoryService,
  authService,
} from "@/data/services";
import { ProductBatch } from "@/data/contracts/product-batch";
import { LaboratoryTestListItem } from "@/data/contracts/laboratory";
import { UserProfile } from "@/data/contracts/auth";
import { formatDate, formatNumber } from "@/lib/utils/formatters";
import { hasMinimumRole } from "@/lib/constants/navigation";

const LAB_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  passed: {
    label: "Lab Passed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  in_progress: {
    label: "Testing Active",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Lab Pending",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  failed: {
    label: "Lab Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  not_applicable: {
    label: "N/A",
    className: "bg-surface-secondary text-text-secondary border-border",
  },
};

export default function ProductBatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = (params?.id as string) || "";

  const [product, setProduct] = useState<ProductBatch | null>(null);
  const [labTests, setLabTests] = useState<LaboratoryTestListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!idOrCode) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, allTests, user] = await Promise.all([
        productBatchService.getProductBatchById(idOrCode),
        laboratoryService.getLaboratoryTests(),
        authService.getCurrentUser(),
      ]);

      if (!data) {
        setError(`Product Batch "${idOrCode}" could not be found.`);
      } else {
        setProduct(data);
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
        err instanceof Error ? err.message : "Failed to load product batch details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [idOrCode]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const canEdit = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading product batch details and input linkages..." />
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

  const labDef = LAB_STATUS_BADGES[product.labTestingStatus] || LAB_STATUS_BADGES.pending;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <PageHeader
        title={product.batchCode}
        description={`${product.productName} ${product.productType ? `(${product.productType})` : ""}`}
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: product.batchCode },
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
              href={`/trace/product/${product.batchCode}`}
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
              <Link href={`/products/${product.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit Product Batch
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* 2. Main 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Waste Batches & Lab Testing Summary (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Contributing Input Waste Batches */}
          <InputWasteBatchesCard
            linkedWasteBatches={product.linkedWasteBatches}
          />

          {/* Card B: Laboratory Verification Tests per 14-LABORATORY-MODULE.md §4.2 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Laboratory Assay Results</CardTitle>
                </div>
                <CardDescription>
                  Analytical characterizations (Spectroscopy, TEM, bioefficacy assays).
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${labDef.className}`}
                >
                  {labDef.label}
                </span>

                {canEdit && (
                  <Link href={`/laboratory/new?productId=${product.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Add Test
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              {labTests.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-secondary">
                  No laboratory assay records are associated with this product batch yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {labTests.map((t) => (
                    <div
                      key={t.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/laboratory/${t.id}`}
                            className="font-semibold text-text-primary hover:text-primary transition-colors"
                          >
                            {t.testType}
                          </Link>
                          <span className="font-mono text-[11px] text-text-secondary">
                            {formatDate(t.testDate)}
                          </span>
                        </div>
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

          {/* Card C: Formulation & Synthesis Notes */}
          {product.notes && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <CardTitle className="text-base">Synthesis & Formulation Notes</CardTitle>
                </div>
                <CardDescription>Research notes and procedure logs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/30 text-xs text-text-primary leading-relaxed font-medium">
                  {product.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Product Profile & Metadata (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Product Specifications Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Product Profile</CardTitle>
              <CardDescription>Biological product specifications and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs divide-y divide-border/50">
              <div className="flex items-center justify-between pt-1">
                <span className="text-text-secondary">Product Name</span>
                <span className="font-semibold text-text-primary text-end">
                  {product.productName}
                </span>
              </div>

              {product.productType && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-text-secondary">Product Type</span>
                  <span className="font-medium text-text-primary">
                    {product.productType}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Production Date</span>
                </span>
                <span className="font-medium text-text-primary">
                  {formatDate(product.productionDate)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary">Quantity Produced</span>
                <span className="font-mono font-bold text-sm text-text-primary">
                  {product.quantityProduced !== null
                    ? `${formatNumber(product.quantityProduced)} ${product.unit || ""}`
                    : "Unspecified"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary">Production Lifecycle Status</span>
                <StatusBadge status={product.status} size="sm" />
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-text-secondary">Lab Assay Verification</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${labDef.className}`}
                >
                  {labDef.label}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Public Product Traceability Card */}
          <Card variant="accent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Public Product Traceability</CardTitle>
              </div>
              <CardDescription>
                Public QR code and transparent digital traceability record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-text-secondary text-[11px] leading-relaxed">
                Scan or share the public QR code to provide judges, partners, and customers with transparent circular provenance from raw mango waste to this finished product.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsQrModalOpen(true)}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                >
                  Generate QR
                </Button>

                <Link
                  href={`/trace/product/${product.batchCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Public Record
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: System Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Metadata</CardTitle>
              <CardDescription>Internal creation and revision audit records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Registered By</span>
                <span className="font-medium text-text-primary flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" />
                  {product.creatorName || "Researcher"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created Timestamp</span>
                <span className="font-mono">{formatDate(product.createdAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Modified</span>
                <span className="font-mono">{formatDate(product.updatedAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Product Batch QR Modal */}
      <ProductBatchQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        batchCode={product.batchCode}
        productName={product.productName}
        productType={product.productType}
      />
    </div>
  );
}
