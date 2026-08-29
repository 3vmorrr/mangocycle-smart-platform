"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProcessingStage } from "@/lib/constants/stages";

interface StageAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStageName: string;
  nextStage: ProcessingStage;
  onConfirm: (notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const StageAdvanceModal: React.FC<StageAdvanceModalProps> = ({
  isOpen,
  onClose,
  currentStageName,
  nextStage,
  onConfirm,
  isLoading = false,
}) => {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onConfirm(notes);
      setNotes("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to advance stage.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advance-stage-title"
      >
        <div className="flex items-center justify-between">
          <h3 id="advance-stage-title" className="text-base font-bold text-text-primary">
            Advance Processing Stage
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transition Summary Box */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-secondary/40 flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Current Stage
            </span>
            <p className="font-bold text-text-primary">{currentStageName}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0" />
          <div className="space-y-0.5 text-end">
            <span className="text-[10px] uppercase font-semibold text-text-secondary">
              Next Stage
            </span>
            <p className="font-bold text-primary">{nextStage.name}</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary">
          {nextStage.description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="stage-notes"
              className="block text-xs font-semibold text-text-primary mb-1.5"
            >
              Stage Notes (Optional)
            </label>
            <textarea
              id="stage-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Washing cycle complete using deionized water. Ready for oven drying."
              maxLength={1000}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
              variant="primary"
              size="sm"
              isLoading={isLoading}
              leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
            >
              Confirm Advancement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
