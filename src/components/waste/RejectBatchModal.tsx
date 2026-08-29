"use client";

import React, { useState } from "react";
import { AlertTriangle, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RejectBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchCode: string;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RejectBatchModal: React.FC<RejectBatchModalProps> = ({
  isOpen,
  onClose,
  batchCode,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for rejecting this batch.");
      return;
    }
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject batch.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-danger/30 bg-surface shadow-xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-batch-title"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 id="reject-batch-title" className="text-base font-bold text-text-primary">
              Reject Waste Batch
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          You are about to remove batch <strong className="text-text-primary font-mono">{batchCode}</strong> from the processing pipeline. This action is recorded in the stage history and cannot be undone.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reject-reason"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Rejection Reason <span className="text-danger">*</span>
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Severe contamination / excessive mold observed during inspection."
              maxLength={1000}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-danger flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isLoading}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
