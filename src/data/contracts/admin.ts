/**
 * Administration contracts per 05-DATABASE-SCHEMA.md (§3.13, §3.14) & 07-AUTH-AND-RBAC.md
 */

import { UserRole } from "./auth";
import { BaseEntity } from "./types";

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: UserRole | "all";
  isActive?: boolean | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogEntry extends BaseEntity {
  actorId: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AppSettingItem {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface SystemSettingsState {
  platformName: string;
  organizationName: string;
  contactEmail: string;
  publicTraceabilityEnabled: boolean;
  scientificFormulasPending: boolean;
  totalWasteProcessedFormulaStatus: "pending_definition";
  biologicalYieldFormulaStatus: "pending_definition";
  updatedAt: string;
}

export interface AiConfigurationState {
  provider: "openai" | "anthropic" | "mock";
  modelWasteAnalyzer: string;
  modelProcessingAdvisor: string;
  modelAskMangoCycle: string;
  rateLimitUserPerMin: number;
  temperature: number;
  updatedAt: string;
}
