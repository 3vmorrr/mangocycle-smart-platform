"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Edit3,
  FlaskConical,
  Calendar,
  Layers,
  User,
  Trash2,
  Activity,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LabAttachmentList } from "@/components/laboratory/LabAttachmentList";
import { laboratoryService, authService } from "@/data/services";
import { LaboratoryTest, LaboratoryAttachment } from "@/data/contracts/laboratory";
import { UserProfile } from "@/data/contracts/auth";
import { formatDate } from "@/lib/utils/formatters";
import { hasMinimumRole } from "@/lib/constants/navigation";

const LAB_STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-surface-secondary text-text-secondary border-border",
  },
};

export default function LaboratoryTestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [test, setTest] = useState<LaboratoryTest | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTest = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, user] = await Promise.all([
        laboratoryService.getLaboratoryTestById(id),
        authService.getCurrentUser(),
      ]);

      if (!data) {
        setError(`Laboratory Test record "${id}" could not be found.`);
      } else {
        setTest(data);
      }
      setCurrentUser(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load laboratory test details."
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const canEdit = currentUser
    ? hasMinimumRole(currentUser.role, "researcher")
    : false;

  const canDelete = currentUser
    ? hasMinimumRole(currentUser.role, "admin")
    : false;

  const handleDelete = async () => {
    if (
      !test ||
      !window.confirm(
        `Are you sure you want to permanently delete this laboratory test record (${test.testType})? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await laboratoryService.deleteLaboratoryTest(test.id);
      router.push("/laboratory");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete test record.");
      setIsDeleting(false);
    }
  };

  const handleDownloadAttachment = async (att: LaboratoryAttachment) => {
    if (!test) return;
    try {
      const res = await laboratoryService.getAttachmentDownloadUrl(test.id, att.id);
      if (res?.signedUrl) {
        window.open(res.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download attachment.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingState message="Loading laboratory test details and attachments..." />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="py-12">
        <ErrorState
          title="Laboratory Test Not Found"
          message={error || "The requested laboratory test does not exist."}
          onRetry={() => router.push("/laboratory")}
        />
      </div>
    );
  }

  const statusDef = LAB_STATUS_BADGES[test.status] || LAB_STATUS_BADGES.pending;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <PageHeader
        title={test.testType}
        description={`Assay recorded on ${formatDate(test.testDate)}`}
        breadcrumbs={[
          { label: "Laboratory", href: "/laboratory" },
          { label: test.testType },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {canEdit && (
              <Link href={`/laboratory/${test.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit Test
                </Button>
              </Link>
            )}

            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recorded Results & Attachments (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Analytical Measurements & Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Recorded Assay Results</CardTitle>
                </div>
                <CardDescription>
                  Quantitative parameters and qualitative analytical summary.
                </CardDescription>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusDef.className}`}
              >
                {statusDef.label}
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Quantitative Metric Highlight */}
              {test.numericResult !== null ? (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-secondary">
                    Quantitative Metric Output
                  </span>
                  <span className="font-mono font-extrabold text-xl text-primary">
                    {test.numericResult} {test.resultUnit || ""}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border/60 bg-surface-secondary/20 text-xs text-text-secondary italic">
                  No quantitative numeric value recorded for this assay.
                </div>
              )}

              {/* Qualitative Result Summary */}
              {test.resultSummary && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                    Descriptive Result Summary
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-surface text-xs text-text-primary leading-relaxed font-medium">
                    {test.resultSummary}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card B: Attachments & Spectra Files */}
          <LabAttachmentList
            attachments={test.attachments}
            onDownloadMock={handleDownloadAttachment}
          />

          {/* Card C: Internal Researcher Notes */}
          {test.researcherNotes && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-base">Internal Researcher Notes</CardTitle>
                </div>
                <CardDescription>
                  Confidential procedure notes, blank corrections, and solvent preparation records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-text-primary leading-relaxed font-medium">
                  {test.researcherNotes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Linked Batches & System Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Associated Batches */}
          <Card variant="accent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Target Batch Linkage</CardTitle>
              </div>
              <CardDescription>
                Associated Product Batch or Waste Batch under characterization.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              {test.productBatchId ? (
                <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                    <span>Linked Product Batch</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/products/${test.productBatchId}`}
                      className="font-mono font-bold text-sm text-text-primary hover:text-primary transition-colors"
                    >
                      {test.productBatchCode || test.productBatchId}
                    </Link>
                    <Link
                      href={`/products/${test.productBatchId}`}
                      className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      View Product →
                    </Link>
                  </div>
                </div>
              ) : null}

              {test.wasteBatchId ? (
                <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-text-secondary flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Linked Waste Batch</span>
                  </span>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/waste-batches/${test.wasteBatchId}`}
                      className="font-mono font-bold text-sm text-text-primary hover:text-primary transition-colors"
                    >
                      {test.wasteBatchCode || test.wasteBatchId}
                    </Link>
                    <Link
                      href={`/waste-batches/${test.wasteBatchId}`}
                      className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      View Waste →
                    </Link>
                  </div>
                </div>
              ) : null}

              {!test.productBatchId && !test.wasteBatchId && (
                <div className="p-4 text-center text-xs text-text-secondary italic">
                  No batch linked to this test record.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: System Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">System Metadata</CardTitle>
              <CardDescription>Internal audit tracking and creation record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between">
                <span>Recorded By</span>
                <span className="font-medium text-text-primary flex items-center gap-1">
                  <User className="w-3 h-3 text-primary" />
                  {test.creatorName || "Researcher"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-text-secondary" />
                  <span>Test Date</span>
                </span>
                <span className="font-mono">{formatDate(test.testDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Created Timestamp</span>
                <span className="font-mono">{formatDate(test.createdAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Modified</span>
                <span className="font-mono">{formatDate(test.updatedAt, "en-US", { hour: "numeric", minute: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
