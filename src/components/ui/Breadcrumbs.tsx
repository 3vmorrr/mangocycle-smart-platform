import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  showHome = true,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-text-secondary overflow-x-auto py-1", className)}
    >
      <ol className="flex items-center space-x-1.5 rtl:space-x-reverse">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center hover:text-text-primary transition-colors focus-ring rounded"
              title="Dashboard"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-text-secondary/50 mx-1 shrink-0 rtl:rotate-180" />
              {isLast || !item.href ? (
                <span
                  className="font-medium text-text-primary truncate max-w-[200px]"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-text-primary transition-colors truncate max-w-[150px] focus-ring rounded"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
