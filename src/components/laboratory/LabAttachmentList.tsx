import React from "react";
import { FileText, Image as ImageIcon, FileSpreadsheet, Download, Paperclip } from "lucide-react";
import { LaboratoryAttachment } from "@/data/contracts/laboratory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface LabAttachmentListProps {
  attachments?: LaboratoryAttachment[];
  onDownloadMock?: (att: LaboratoryAttachment) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("image")) {
    return <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />;
  }
  if (mimeType.includes("sheet") || mimeType.includes("csv")) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-amber-600 shrink-0" />;
}

export const LabAttachmentList: React.FC<LabAttachmentListProps> = ({
  attachments = [],
  onDownloadMock,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Spectra & Instrument Attachments</CardTitle>
          </div>
          <CardDescription>
            Raw data outputs, UV-Vis spectra, electron micrographs, and assay logs.
          </CardDescription>
        </div>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
          {attachments.length} file{attachments.length === 1 ? "" : "s"}
        </span>
      </CardHeader>

      <CardContent className="pt-2">
        {attachments.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-secondary">
            No instrument data or analytical files attached to this laboratory record.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(att.mimeType || "")}
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary truncate">
                      {att.fileName}
                    </p>
                    <span className="font-mono text-[11px] text-text-secondary">
                      {formatBytes(att.fileSizeBytes)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDownloadMock?.(att)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-secondary text-text-primary hover:text-primary transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
