"use client";

import React, { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, ExternalLink, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getWasteTraceabilityUrl } from "@/lib/utils/url";

interface WasteBatchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchCode: string;
  wasteTypeLabel?: string;
}

export const WasteBatchQrModal: React.FC<WasteBatchQrModalProps> = ({
  isOpen,
  onClose,
  batchCode,
  wasteTypeLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = getWasteTraceabilityUrl(batchCode);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="text-base font-bold text-text-primary">
                Public Traceability QR
              </h3>
              <p className="text-xs text-text-secondary">
                Physical-to-digital verification barcode
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container (Print area) */}
        <div className="p-6 rounded-xl border border-border bg-white text-black flex flex-col items-center justify-center shadow-inner space-y-3 print:border-none print:shadow-none">
          <div className="p-2 bg-white rounded-lg">
            <QRCodeSVG
              value={publicUrl}
              size={200}
              level="M"
              includeMargin={false}
              className="w-44 h-44 sm:w-48 sm:h-48"
            />
          </div>

          <div className="text-center space-y-0.5">
            <span className="font-mono font-bold text-sm tracking-wider text-black block">
              {batchCode}
            </span>
            {wasteTypeLabel && (
              <span className="text-[11px] font-medium text-neutral-600 block">
                {wasteTypeLabel}
              </span>
            )}
            <span className="text-[10px] text-neutral-400 block pt-1 uppercase tracking-widest font-semibold">
              MangoCycle Smart Platform
            </span>
          </div>
        </div>

        {/* URL Box & Actions */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-text-secondary">
            Public Traceability URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-secondary/50 text-text-primary font-mono select-all focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              title="Copy Public Link"
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print QR Card</span>
          </button>

          <Link
            href={`/trace/waste/${batchCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark font-semibold transition-colors"
          >
            <span>Open Public Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
