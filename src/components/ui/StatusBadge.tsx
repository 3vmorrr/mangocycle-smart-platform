import React from "react";
import { cn } from "@/lib/utils/cn";

export type StatusVariant =
  | "collected"
  | "sorted"
  | "washed"
  | "dried"
  | "ground"
  | "extraction"
  | "production"
  | "laboratory_testing"
  | "completed"
  | "rejected"
  | "pending"
  | "in_progress"
  | "passed"
  | "failed"
  | "released"
  | "testing"
  | "not_applicable";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  // Stage statuses
  collected: {
    label: "Collected",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  sorted: {
    label: "Sorted",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  washed: {
    label: "Washed",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  dried: {
    label: "Dried",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  ground: {
    label: "Ground",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  extraction: {
    label: "Extraction",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  production: {
    label: "Production",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  in_production: {
    label: "In Production",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  laboratory_testing: {
    label: "Lab Testing",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    border: "border-purple-200 dark:border-purple-800",
  },
  testing: {
    label: "Testing",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
    border: "border-purple-200 dark:border-purple-800",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  released: {
    label: "Released",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  passed: {
    label: "Passed",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-800",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
    border: "border-rose-200 dark:border-rose-800",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    border: "border-gray-200 dark:border-gray-800",
  },
  pending: {
    label: "Pending",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-800",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
  not_applicable: {
    label: "N/A",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    text: "text-gray-500 dark:text-gray-400",
    dot: "bg-gray-400",
    border: "border-gray-200 dark:border-gray-800",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  className,
  size = "sm",
  showDot = true,
}) => {
  const key = (variant || status).toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIG[key] || {
    label: status,
    bg: "bg-gray-50 dark:bg-gray-900/40",
    text: "text-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
    border: "border-gray-200 dark:border-gray-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors",
        config.bg,
        config.text,
        config.border,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
