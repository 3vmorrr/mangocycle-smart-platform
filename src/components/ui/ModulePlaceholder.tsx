import React from "react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";
import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  phase: string;
  category?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  phase,
  category = "Operations",
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: category }, { label: title }]}
      />

      <EmptyState
        icon={<Construction className="w-6 h-6 text-amber-500" />}
        title={`${title} — Scheduled for ${phase}`}
        description={`The foundation for this module has been prepared. Implementation will take place during ${phase} according to the phased roadmap.`}
      />
    </div>
  );
};
