import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading platform data...",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center text-text-secondary min-h-[220px]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
