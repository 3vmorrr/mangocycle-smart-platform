import { DashboardData, DateRangeOption } from "@/data/contracts/dashboard";
import { apiRequest } from "./http";

export const supabaseDashboardAdapter = {
  async getDashboardData(
    dateRange: DateRangeOption = "all"
  ): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (dateRange && dateRange !== "all") {
      params.set("dateRange", dateRange);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest<DashboardData>(`/api/dashboard${query}`, {
      cache: "no-store",
    });
  },
};
