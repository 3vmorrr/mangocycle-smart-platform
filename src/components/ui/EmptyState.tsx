import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  action,
  className,
}) => {
  const desc = description || message || "";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center rounded-lg border border-dashed border-border bg-surface/40 min-h-[260px]",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface border border-border/80 text-text-secondary mb-4 shadow-sm">
        {icon || <Inbox className="w-6 h-6 text-primary" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {desc && <p className="text-sm text-text-secondary max-w-sm mb-5 text-balance">{desc}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
