import { ReportParameters, ReportData, ReportHistoryItem } from "@/data/contracts/report";
import { apiRequest } from "./http";

// In-memory session store for session-generated reports in current tab
const sessionReports: Map<string, ReportData> = new Map();

export const supabaseReportAdapter = {
  async generateReport(params: ReportParameters): Promise<ReportData> {
    const report = await apiRequest<ReportData>("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });

    if (report && report.metadata?.id) {
      sessionReports.set(report.metadata.id, report);
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          const list = Array.from(sessionReports.values());
          sessionStorage.setItem("mangocycle_session_reports", JSON.stringify(list));
        } catch {
          // ignore session storage quota errors
        }
      }
    }

    return report;
  },

  async getReportById(id: string): Promise<ReportData | null> {
    if (sessionReports.has(id)) {
      return sessionReports.get(id)!;
    }

    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem("mangocycle_session_reports");
        if (stored) {
          const parsed = JSON.parse(stored) as ReportData[];
          const found = parsed.find((r) => r.metadata?.id === id);
          if (found) {
            sessionReports.set(found.metadata.id, found);
            return found;
          }
        }
      } catch {
        // non-blocking
      }
    }

    return null;
  },

  async getReportHistory(): Promise<ReportHistoryItem[]> {
    const reports: ReportData[] = [];

    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem("mangocycle_session_reports");
        if (stored) {
          const parsed = JSON.parse(stored) as ReportData[];
          parsed.forEach((r) => {
            if (r.metadata?.id && !sessionReports.has(r.metadata.id)) {
              sessionReports.set(r.metadata.id, r);
            }
          });
        }
      } catch {
        // non-blocking
      }
    }

    sessionReports.forEach((r) => reports.push(r));

    return reports.map((r) => ({
      id: r.metadata.id,
      title: r.metadata.title,
      reportType: r.metadata.reportType,
      reportTypeLabel: r.metadata.reportTypeLabel,
      periodLabel: r.metadata.periodLabel,
      generatedByName: r.metadata.generatedByName,
      createdAt: r.metadata.generatedAt,
      updatedAt: r.metadata.generatedAt,
    }));
  },
};
