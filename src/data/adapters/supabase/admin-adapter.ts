import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  AuditLogEntry,
  AuditLogFilters,
  SystemSettingsState,
} from "@/data/contracts/admin";
import { UserProfile } from "@/data/contracts/auth";
import { PaginatedResult } from "@/data/contracts/types";
import { apiRequest } from "./http";

export const supabaseAdminAdapter = {
  getUsers(filters: UserFilters = {}): Promise<PaginatedResult<UserProfile>> {
    const params = new URLSearchParams();
    if (filters.role !== undefined) params.set("role", filters.role);
    if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    return apiRequest(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
  },
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      return (await apiRequest<{ user: UserProfile }>(`/api/admin/users/${encodeURIComponent(id)}`)).user;
    } catch {
      return null;
    }
  },
  async createUser(input: CreateUserInput): Promise<UserProfile> {
    return (await apiRequest<{ user: UserProfile }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    })).user;
  },
  async updateUser(id: string, input: UpdateUserInput): Promise<UserProfile> {
    return (await apiRequest<{ user: UserProfile }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })).user;
  },
  deactivateUser(id: string): Promise<UserProfile> {
    return this.updateUser(id, { isActive: false });
  },
  reactivateUser(id: string): Promise<UserProfile> {
    return this.updateUser(id, { isActive: true });
  },
  getAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedResult<AuditLogEntry>> {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.actorId) params.set("actorId", filters.actorId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
    return apiRequest(`/api/admin/audit-logs?${params.toString()}`, { cache: "no-store" });
  },
  async getSystemSettings(): Promise<SystemSettingsState> {
    return (await apiRequest<{ settings: SystemSettingsState }>("/api/admin/settings", { cache: "no-store" })).settings;
  },
  async updateSystemSettings(input: Partial<SystemSettingsState>): Promise<SystemSettingsState> {
    return (await apiRequest<{ settings: SystemSettingsState }>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(input),
    })).settings;
  },
};
