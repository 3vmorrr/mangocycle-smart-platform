import React from "react";
import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PublicTraceNotFoundProps {
  batchCode: string;
  recordType?: "waste" | "product";
}

export const PublicTraceNotFound: React.FC<PublicTraceNotFoundProps> = ({
  batchCode,
  recordType = "product",
}) => {
  const typeLabel = recordType === "waste" ? "waste batch" : "product formulation";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <SearchX className="w-8 h-8" />
      </div>

      <span className="text-[11px] uppercase font-bold tracking-widest text-text-secondary mb-1">
        Traceability Verification
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
        Batch Record Not Found
      </h1>

      <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-6 text-balance">
        No registered {typeLabel} record matches the identifier{" "}
        <strong className="font-mono text-text-primary px-1.5 py-0.5 rounded bg-surface border border-border">
          {batchCode || "Unknown"}
        </strong>
        . Please verify the QR barcode or contact the platform administrator.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};
