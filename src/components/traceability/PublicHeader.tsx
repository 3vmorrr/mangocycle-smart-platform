import React from "react";
import Link from "next/link";
import { Leaf, ShieldCheck, ArrowLeft } from "lucide-react";

export const PublicHeader: React.FC = () => {
  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Verification Badge */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-ring rounded-lg group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-text-primary block leading-none">
              MangoCycle
            </span>
            <span className="text-[10px] font-semibold text-text-secondary tracking-wide uppercase">
              Public Traceability
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Traceability Record</span>
            <span className="sm:hidden">Trace Record</span>
          </div>

          <Link
            href="/"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            title="Return to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
