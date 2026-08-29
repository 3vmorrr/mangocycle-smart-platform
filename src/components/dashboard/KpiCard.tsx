import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  accentColor?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-primary/10 text-primary",
  accentColor,
  className,
}) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-150 hover:shadow-md",
        accentColor && `border-s-4 ${accentColor}`,
        className
      )}
    >
      <CardHeader className="p-4 sm:p-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-text-secondary truncate">{title}</span>
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
              iconBgColor
            )}
          >
            {icon}
          </div>
        </div>

        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-secondary mt-1 font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};
