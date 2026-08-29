import React from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Boxes,
  FlaskConical,
  Microscope,
  Leaf,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ReportType } from "@/data/contracts/report";

export interface ReportTemplate {
  type: ReportType;
  title: string;
  description: string;
  icon: typeof FileSpreadsheet;
  color: string;
  bg: string;
  scope: string;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: "waste_summary",
    title: "Monthly Waste Management Report",
    description:
      "Aggregated intake weight, supplier contributions, stage progression, and active lot inventory across selected date ranges.",
    icon: Boxes,
    color: "text-primary",
    bg: "bg-primary/10",
    scope: "Waste Batches & Suppliers",
  },
  {
    type: "sustainability",
    title: "Sustainability & Circular Impact Report",
    description:
      "Verified mass diversion summary, supplier diversity metrics, downstream bio-formulations, and circular utilization progress.",
    icon: Leaf,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    scope: "Platform-wide Circular Metrics",
  },
  {
    type: "product_traceability",
    title: "Product Traceability & Formulation Report",
    description:
      "Downstream product batch registry with linked contributing agricultural waste lots, production metrics, and testing status.",
    icon: FlaskConical,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    scope: "Product Batches & Lineage",
  },
  {
    type: "laboratory_summary",
    title: "Laboratory Testing Summary Report",
    description:
      "Consolidated analytical assay records, quantitative spectroscopic parameters, and characterization workflow status across batches.",
    icon: Microscope,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    scope: "Laboratory Characterizations",
  },
  {
    type: "batch_report",
    title: "Waste Batch Lifecycle Report",
    description:
      "Comprehensive end-to-end dossier for a single waste batch including intake weights, stage progression timestamps, and lab assays.",
    icon: Layers,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    scope: "Single Batch Dossier",
  },
];

export const ReportTemplateList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {REPORT_TEMPLATES.map((tmpl) => {
        const Icon = tmpl.icon;
        return (
          <Card
            key={tmpl.type}
            className="hover:border-primary/50 transition-all flex flex-col justify-between group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className={`w-9 h-9 rounded-xl ${tmpl.bg} ${tmpl.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-text-secondary font-semibold">
                  {tmpl.scope}
                </span>
              </div>
              <CardTitle className="text-sm pt-2 group-hover:text-primary transition-colors">
                {tmpl.title}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {tmpl.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <Link
                href={`/reports/generate?type=${tmpl.type}`}
                className="w-full"
              >
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary group-hover:text-primary-dark transition-colors">
                  <span>Configure Report</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
