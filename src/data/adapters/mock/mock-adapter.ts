import {
  MOCK_USERS,
  MOCK_AUDIT_LOGS,
  MOCK_WASTE_SOURCES,
  MOCK_WASTE_BATCHES,
  MOCK_PRODUCT_BATCHES,
  MOCK_LABORATORY_TESTS,
  MOCK_AI_INSIGHT,
} from "./mock-data";
import {
  WasteBatch,
  WasteBatchListItem,
  WasteBatchFilters,
  WasteSource,
  WasteType,
  CreateWasteBatchInput,
  UpdateWasteBatchInput,
  AdvanceStageInput,
  RejectBatchInput,
  BatchStageHistory,
} from "@/data/contracts/waste-batch";
import {
  ProductBatch,
  ProductBatchListItem,
  ProductBatchFilters,
  CreateProductBatchInput,
  UpdateProductBatchInput,
  LinkedWasteBatchSummary,
} from "@/data/contracts/product-batch";
import {
  LaboratoryTest,
  LaboratoryTestListItem,
  LaboratoryTestFilters,
  CreateLaboratoryTestInput,
  UpdateLaboratoryTestInput,
  LaboratoryAttachment,
} from "@/data/contracts/laboratory";
import {
  DashboardData,
  DateRangeOption,
  AttentionBatchItem,
  WasteByTypePoint,
} from "@/data/contracts/dashboard";
import {
  PublicWasteTraceability,
  PublicStageEvent,
  PublicProductTraceability,
  PublicProductWasteSource,
} from "@/data/contracts/traceability";
import {
  AiAnalysisRecord,
  AiWasteVisualAnalysis,
  AnalyzeWasteImageInput,
  ProcessingAdvisorResponse,
  ProcessingRule,
  AskMangoCycleMessage,
  AskMangoCycleToolCall,
  AiSustainabilityInsightResponse,
  SustainabilityCalculatedMetrics,
} from "@/data/contracts/ai";
import {
  ReportData,
  ReportMetadata,
  ReportParameters,
  ReportHistoryItem,
  ReportType,
  ReportKPI,
  WasteReportRow,
  ProductReportRow,
  LabReportRow,
  ReportChartPoint,
} from "@/data/contracts/report";
import {
  IoTDevice,
  IoTReading,
  IoTReadingFilter,
  SimulateReadingInput,
  IoTWeightPoint,
} from "@/data/contracts/iot";
import {
  UserProfile,
  SessionInfo,
  UserRole,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthResult,
} from "@/data/contracts/auth";
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  AuditLogEntry,
  AuditLogFilters,
  SystemSettingsState,
  AiConfigurationState,
} from "@/data/contracts/admin";
import { PaginatedResult } from "@/data/contracts/types";
import { CANONICAL_PROCESSING_STAGES } from "@/lib/constants/stages";

const WASTE_TYPE_DISPLAY: Record<WasteType, string> = {
  mango_peel: "Mango Peel (قشور المانجو)",
  mango_seed: "Mango Seed / Kernel (بذور ونوى المانجو)",
  mixed_mango_waste: "Mixed Mango Waste (مخلفات مانجو مختلطة)",
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  in_production: "In Production",
  testing: "Testing",
  completed: "Completed",
  released: "Released",
  rejected: "Rejected",
};

const LAB_STATUS_LABELS: Record<string, string> = {
  pending: "Lab Pending",
  in_progress: "Testing Active",
  passed: "Lab Passed",
  failed: "Lab Failed",
  not_applicable: "N/A",
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  waste_summary: "Monthly Waste Management Report",
  product_traceability: "Product Traceability Report",
  laboratory_summary: "Laboratory Testing Summary Report",
  sustainability: "Sustainability & Circular Impact Report",
  batch_report: "Waste Batch Lifecycle Report",
};

/**
 * Mock Data Adapter (In-Memory Prototype Repository)
 * 
 * ARCHITECTURAL CONTRACT:
 * - Shared in-memory collections across auth, dashboard, waste, product, laboratory, AI, reports, IoT, and administration modules.
 * - Deterministic First: Calculations done by code/database, AI only summarizes pre-calculated metrics.
 * - Strict allowlist projection for public DTOs & CSV export models.
 */

export class MockDataAdapter {
  private users: UserProfile[] = JSON.parse(JSON.stringify(MOCK_USERS));
  private currentUser: UserProfile = this.users[0]; // Default: Super Admin demo account
  private auditLogs: AuditLogEntry[] = JSON.parse(JSON.stringify(MOCK_AUDIT_LOGS));

  private systemSettings: SystemSettingsState = {
    platformName: "MangoCycle Smart Platform",
    organizationName: "Agricultural Bio-Valorization Research Center",
    contactEmail: "admin@mangocycle.local",
    publicTraceabilityEnabled: true,
    scientificFormulasPending: true,
    totalWasteProcessedFormulaStatus: "pending_definition",
    biologicalYieldFormulaStatus: "pending_definition",
    updatedAt: "2026-01-28T09:00:00.000Z",
  };

  private aiConfig: AiConfigurationState = {
    provider: "mock",
    modelWasteAnalyzer: "gpt-4o (multimodal vision simulation)",
    modelProcessingAdvisor: "gpt-4o (rule evaluation engine + narrator)",
    modelAskMangoCycle: "gpt-4o (tool-calling query assistant)",
    rateLimitUserPerMin: 10,
    temperature: 0.2,
    updatedAt: "2026-01-28T09:00:00.000Z",
  };

  private wasteBatches: WasteBatch[] = JSON.parse(JSON.stringify(MOCK_WASTE_BATCHES));
  private productBatches: ProductBatch[] = JSON.parse(JSON.stringify(MOCK_PRODUCT_BATCHES));
  private labTests: LaboratoryTest[] = JSON.parse(JSON.stringify(MOCK_LABORATORY_TESTS));
  private wasteSources: WasteSource[] = JSON.parse(JSON.stringify(MOCK_WASTE_SOURCES));

  private iotDevices: IoTDevice[] = [
    {
      id: "dev-001",
      deviceCode: "BIN-001",
      name: "Agri-Lab Smart Bin #1",
      location: "Campus Farm Unit B",
      isActive: true,
      status: "active",
      lastSeenAt: "2026-01-28T09:15:00.000Z",
      latestReadingKg: 0.735,
      latestReadingAt: "2026-01-28T09:15:00.000Z",
      createdAt: "2026-01-01T08:00:00.000Z",
      updatedAt: "2026-01-28T09:15:00.000Z",
    },
    {
      id: "dev-002",
      deviceCode: "BIN-002",
      name: "Factory A Smart Bin #2",
      location: "Line 3 Processing Shed",
      isActive: true,
      status: "active",
      lastSeenAt: "2026-01-28T08:50:00.000Z",
      latestReadingKg: 3.420,
      latestReadingAt: "2026-01-28T08:50:00.000Z",
      createdAt: "2026-01-05T08:00:00.000Z",
      updatedAt: "2026-01-28T08:50:00.000Z",
    },
    {
      id: "dev-003",
      deviceCode: "BIN-003",
      name: "Storage Facility Bin #3",
      location: "Cold Storage Room 2",
      isActive: false,
      status: "offline",
      lastSeenAt: "2026-01-20T11:00:00.000Z",
      latestReadingKg: 0.0,
      latestReadingAt: "2026-01-20T11:00:00.000Z",
      createdAt: "2026-01-10T08:00:00.000Z",
      updatedAt: "2026-01-20T11:00:00.000Z",
    },
  ];

  private iotReadings: IoTReading[] = [
    {
      id: "rd-001",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.735,
      recordedAt: "2026-01-28T09:15:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T09:15:00.000Z",
      updatedAt: "2026-01-28T09:15:00.000Z",
    },
    {
      id: "rd-002",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.720,
      recordedAt: "2026-01-28T09:00:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T09:00:00.000Z",
      updatedAt: "2026-01-28T09:00:00.000Z",
    },
    {
      id: "rd-003",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.650,
      recordedAt: "2026-01-28T08:30:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T08:30:00.000Z",
      updatedAt: "2026-01-28T08:30:00.000Z",
    },
    {
      id: "rd-004",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.510,
      recordedAt: "2026-01-28T08:00:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T08:00:00.000Z",
      updatedAt: "2026-01-28T08:00:00.000Z",
    },
    {
      id: "rd-005",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.320,
      recordedAt: "2026-01-28T07:30:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T07:30:00.000Z",
      updatedAt: "2026-01-28T07:30:00.000Z",
    },
    {
      id: "rd-006",
      deviceId: "dev-001",
      deviceCode: "BIN-001",
      weightKg: 0.000,
      recordedAt: "2026-01-28T07:00:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T07:00:00.000Z",
      updatedAt: "2026-01-28T07:00:00.000Z",
    },
    {
      id: "rd-007",
      deviceId: "dev-002",
      deviceCode: "BIN-002",
      weightKg: 3.420,
      recordedAt: "2026-01-28T08:50:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T08:50:00.000Z",
      updatedAt: "2026-01-28T08:50:00.000Z",
    },
    {
      id: "rd-008",
      deviceId: "dev-002",
      deviceCode: "BIN-002",
      weightKg: 3.380,
      recordedAt: "2026-01-28T08:20:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T08:20:00.000Z",
      updatedAt: "2026-01-28T08:20:00.000Z",
    },
    {
      id: "rd-009",
      deviceId: "dev-002",
      deviceCode: "BIN-002",
      weightKg: 2.850,
      recordedAt: "2026-01-28T07:50:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T07:50:00.000Z",
      updatedAt: "2026-01-28T07:50:00.000Z",
    },
    {
      id: "rd-010",
      deviceId: "dev-002",
      deviceCode: "BIN-002",
      weightKg: 1.500,
      recordedAt: "2026-01-28T07:10:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T07:10:00.000Z",
      updatedAt: "2026-01-28T07:10:00.000Z",
    },
    {
      id: "rd-011",
      deviceId: "dev-002",
      deviceCode: "BIN-002",
      weightKg: 0.000,
      recordedAt: "2026-01-28T06:30:00.000Z",
      source: "simulated",
      createdAt: "2026-01-28T06:30:00.000Z",
      updatedAt: "2026-01-28T06:30:00.000Z",
    },
  ];

  private aiRecords: AiAnalysisRecord[] = [
    {
      id: "ai-rec-001",
      analysisType: "visual_assessment",
      wasteBatchId: "wb-001",
      wasteBatchCode: "MW-2026-001",
      productBatchId: null,
      productBatchCode: null,
      inputReference: "Demo Image: mango_peel_intake_01.jpg",
      promptVersion: "waste-analyzer-v1.0",
      model: "gpt-4o (multimodal vision)",
      inputData: { fileName: "mango_peel_intake_01.jpg", sizeBytes: 245120 },
      outputData: {
        waste_type: "mango_peel",
        visual_condition: "good",
        visible_discoloration: "minor",
        visible_surface_irregularities: "none",
        manual_review_recommended: false,
      },
      status: "completed",
      humanReviewed: true,
      requestedBy: "usr-super-01",
      requesterName: "Dr. Areej Al-Ghamdi",
      createdAt: "2026-01-20T10:15:00.000Z",
      updatedAt: "2026-01-20T10:15:00.000Z",
    },
    {
      id: "ai-rec-002",
      analysisType: "processing_advice",
      wasteBatchId: "wb-003",
      wasteBatchCode: "MW-2026-003",
      productBatchId: null,
      productBatchCode: null,
      inputReference: "Batch Evaluation: MW-2026-003",
      promptVersion: "processing-advisor-v1.0",
      model: "gpt-4o",
      inputData: { batchCode: "MW-2026-003", moistureStatus: "high" },
      outputData: {
        ruleId: "R001",
        recommendation: "Prioritize drying stage before further processing",
      },
      status: "completed",
      humanReviewed: false,
      requestedBy: "usr-super-01",
      requesterName: "Dr. Areej Al-Ghamdi",
      createdAt: "2026-01-24T14:30:00.000Z",
      updatedAt: "2026-01-24T14:30:00.000Z",
    },
  ];

  private generatedReports: ReportData[] = [
    {
      metadata: {
        id: "rep-001",
        title: "Monthly Waste Intake & Operations Report — January 2026",
        reportType: "waste_summary",
        reportTypeLabel: "Monthly Waste Management Report",
        generatedAt: "2026-01-31T09:00:00.000Z",
        periodLabel: "2026-01-01 to 2026-01-31",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        generatedByName: "Dr. Areej Al-Ghamdi",
        isDemoData: true,
      },
      kpis: [
        { label: "Total Waste Diverted", value: "47.50", unit: "kg", subtext: "Recorded intake mass" },
        { label: "Total Batches Intake", value: 5, subtext: "Registered waste lots" },
        { label: "Completed Batches", value: 1, subtext: "Extraction lifecycle finished" },
        { label: "Active in Pipeline", value: 4, subtext: "In drying, grinding, or extraction" },
      ],
      methodNotes: [
        "Data aggregated from verified waste_batches and batch_stage_history platform records.",
        "Total Waste Processed formula is currently pending formal scientific definition and is omitted.",
      ],
    },
  ];

  // --- 1. Authentication Operations (07-AUTH-AND-RBAC.md) ---

  async login(input: LoginInput): Promise<AuthResult> {
    const qEmail = input.email.trim().toLowerCase();
    const found = this.users.find((u) => u.email.toLowerCase() === qEmail);

    if (!found) {
      return {
        success: false,
        error: "Invalid email or password. Please verify credentials.",
      };
    }

    if (!found.isActive) {
      return {
        success: false,
        error: "This account has been deactivated. Please contact an administrator.",
      };
    }

    this.currentUser = found;

    return {
      success: true,
      user: JSON.parse(JSON.stringify(this.currentUser)),
    };
  }

  async logout(): Promise<void> {
    // Switch to observer/viewer or clear session
    const viewerAccount = this.users.find((u) => u.role === "viewer" && u.isActive);
    if (viewerAccount) {
      this.currentUser = viewerAccount;
    }
  }

  async switchDemoRole(role: UserRole): Promise<UserProfile> {
    const matchingUser = this.users.find((u) => u.role === role && u.isActive);
    if (matchingUser) {
      this.currentUser = matchingUser;
    } else {
      this.currentUser = {
        ...this.currentUser,
        role,
      };
    }
    return JSON.parse(JSON.stringify(this.currentUser));
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ success: boolean; message: string }> {
    // Generic response preventing email address enumeration per 08-SECURITY.md §3.1
    return {
      success: true,
      message: `If an account matches "${input.email}", password reset instructions have been generated (in production, a time-limited link is sent via configured email provider).`,
    };
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ success: boolean; message: string }> {
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    return {
      success: true,
      message: "Password has been updated. You may now sign in with your new credentials.",
    };
  }

  async getCurrentSession(): Promise<SessionInfo> {
    return {
      user: JSON.parse(JSON.stringify(this.currentUser)),
      isAuthenticated: true,
      isDemoSession: true,
    };
  }

  async getCurrentUser(): Promise<UserProfile> {
    return JSON.parse(JSON.stringify(this.currentUser));
  }

  // --- 2. Administration Operations (05-DATABASE-SCHEMA.md & 07-AUTH-AND-RBAC.md) ---

  async getUsers(filters?: UserFilters): Promise<PaginatedResult<UserProfile>> {
    let items = [...this.users];

    if (filters?.role && filters.role !== "all") {
      items = items.filter((u) => u.role === filters.role);
    }

    if (filters?.isActive !== undefined && filters.isActive !== "all") {
      items = items.filter((u) => u.isActive === filters.isActive);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: JSON.parse(JSON.stringify(paginated)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    const found = this.users.find((u) => u.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async createUser(input: CreateUserInput): Promise<UserProfile> {
    const qEmail = input.email.trim().toLowerCase();
    const existing = this.users.find((u) => u.email.toLowerCase() === qEmail);
    if (existing) {
      throw new Error(`A user with email "${input.email}" already exists.`);
    }

    // Role privilege ceiling per 07-AUTH-AND-RBAC.md §5
    if (input.role === "super_admin" && this.currentUser.role !== "super_admin") {
      throw new Error("Only Super Administrators can create other Super Admin accounts.");
    }

    const now = new Date().toISOString();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      role: input.role,
      avatarUrl: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.unshift(newUser);

    // Record audit event
    this.recordAuditLog({
      action: "user.created",
      entityType: "profile",
      entityId: newUser.id,
      beforeValue: null,
      afterValue: { email: newUser.email, role: newUser.role, fullName: newUser.fullName },
    });

    return JSON.parse(JSON.stringify(newUser));
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserProfile> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User "${id}" not found.`);
    }

    const targetUser = this.users[index];
    const beforeValue = {
      fullName: targetUser.fullName,
      role: targetUser.role,
      isActive: targetUser.isActive,
    };

    // Role assignment rules per 07-AUTH-AND-RBAC.md §5
    if (input.role && input.role !== targetUser.role) {
      if (this.currentUser.id === targetUser.id) {
        throw new Error("Self-promotion or self-role change is not permitted.");
      }
      if (input.role === "super_admin" && this.currentUser.role !== "super_admin") {
        throw new Error("Only Super Administrators can assign the Super Admin role.");
      }
      if (targetUser.role === "super_admin" && this.currentUser.role !== "super_admin") {
        throw new Error("Only Super Administrators can modify Super Admin accounts.");
      }
    }

    // Deactivation rule per 07-AUTH-AND-RBAC.md §4.8
    if (input.isActive === false && targetUser.isActive) {
      if (this.currentUser.id === targetUser.id) {
        throw new Error("You cannot deactivate your own account.");
      }
      if (targetUser.role === "super_admin" && this.currentUser.role !== "super_admin") {
        throw new Error("Only Super Administrators can deactivate Super Admin accounts.");
      }
    }

    const now = new Date().toISOString();
    const updatedUser: UserProfile = {
      ...targetUser,
      fullName: input.fullName !== undefined ? input.fullName : targetUser.fullName,
      role: input.role || targetUser.role,
      isActive: input.isActive !== undefined ? input.isActive : targetUser.isActive,
      updatedAt: now,
    };

    this.users[index] = updatedUser;

    // Log role change audit event
    if (input.role && input.role !== beforeValue.role) {
      this.recordAuditLog({
        action: "user.role_changed",
        entityType: "profile",
        entityId: targetUser.id,
        beforeValue: { role: beforeValue.role },
        afterValue: { role: updatedUser.role },
      });
    }

    // Log deactivation audit event
    if (input.isActive === false && beforeValue.isActive) {
      this.recordAuditLog({
        action: "user.deactivated",
        entityType: "profile",
        entityId: targetUser.id,
        beforeValue: { isActive: true },
        afterValue: { isActive: false },
      });
    }

    return JSON.parse(JSON.stringify(updatedUser));
  }

  async deactivateUser(id: string): Promise<UserProfile> {
    return this.updateUser(id, { isActive: false });
  }

  async reactivateUser(id: string): Promise<UserProfile> {
    return this.updateUser(id, { isActive: true });
  }

  // --- Audit Logs ---
  async getAuditLogs(filters?: AuditLogFilters): Promise<PaginatedResult<AuditLogEntry>> {
    let items = [...this.auditLogs];

    if (filters?.action && filters.action !== "all") {
      items = items.filter((a) => a.action === filters.action);
    }
    if (filters?.entityType && filters.entityType !== "all") {
      items = items.filter((a) => a.entityType === filters.entityType);
    }
    if (filters?.actorId) {
      items = items.filter((a) => a.actorId === filters.actorId);
    }
    if (filters?.startDate) {
      items = items.filter((a) => a.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      items = items.filter((a) => a.createdAt <= filters.endDate!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.action.toLowerCase().includes(q) ||
          (a.actorName && a.actorName.toLowerCase().includes(q)) ||
          a.entityType.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: JSON.parse(JSON.stringify(paginated)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  private recordAuditLog(log: Omit<AuditLogEntry, "id" | "actorId" | "actorName" | "actorRole" | "createdAt" | "updatedAt">): void {
    const now = new Date().toISOString();
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.fullName || this.currentUser.email,
      actorRole: this.currentUser.role,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      beforeValue: log.beforeValue || null,
      afterValue: log.afterValue || null,
      ipAddress: "127.0.0.1",
      createdAt: now,
      updatedAt: now,
    };
    this.auditLogs.unshift(entry);
  }

  // --- System Settings ---
  async getSystemSettings(): Promise<SystemSettingsState> {
    return JSON.parse(JSON.stringify(this.systemSettings));
  }

  async updateSystemSettings(input: Partial<SystemSettingsState>): Promise<SystemSettingsState> {
    if (this.currentUser.role !== "super_admin") {
      throw new Error("Only Super Administrators can edit application system settings.");
    }
    const now = new Date().toISOString();
    this.systemSettings = {
      ...this.systemSettings,
      ...input,
      // Preserve unresolved scientific status per governance
      scientificFormulasPending: true,
      totalWasteProcessedFormulaStatus: "pending_definition",
      biologicalYieldFormulaStatus: "pending_definition",
      updatedAt: now,
    };

    this.recordAuditLog({
      action: "settings.updated",
      entityType: "app_settings",
      entityId: null,
      beforeValue: null,
      afterValue: { ...this.systemSettings },
    });

    return JSON.parse(JSON.stringify(this.systemSettings));
  }

  // --- AI Configuration ---
  async getAiConfiguration(): Promise<AiConfigurationState> {
    return JSON.parse(JSON.stringify(this.aiConfig));
  }

  async updateAiConfiguration(input: Partial<AiConfigurationState>): Promise<AiConfigurationState> {
    const now = new Date().toISOString();
    this.aiConfig = {
      ...this.aiConfig,
      ...input,
      updatedAt: now,
    };
    return JSON.parse(JSON.stringify(this.aiConfig));
  }

  // --- Waste Sources ---
  async getWasteSources(): Promise<WasteSource[]> {
    return this.wasteSources.map((s) => ({ ...s }));
  }

  // --- Waste Batches (Queries) ---
  async getWasteBatches(
    filters?: WasteBatchFilters
  ): Promise<PaginatedResult<WasteBatchListItem>> {
    let items = this.wasteBatches.map((b) => ({
      id: b.id,
      batchCode: b.batchCode,
      wasteType: b.wasteType,
      sourceName: b.sourceName || "Unknown Source",
      weightKg: b.weightKg,
      collectionDate: b.collectionDate,
      currentStatus: b.currentStatus,
      updatedAt: b.updatedAt,
    }));

    if (filters?.status && filters.status !== "all") {
      items = items.filter((b) => b.currentStatus === filters.status);
    }
    if (filters?.wasteType && filters.wasteType !== "all") {
      items = items.filter((b) => b.wasteType === filters.wasteType);
    }
    if (filters?.sourceId && filters.sourceId !== "all") {
      const matchingBatches = this.wasteBatches.filter((b) => b.sourceId === filters.sourceId);
      const matchingIds = new Set(matchingBatches.map((b) => b.id));
      items = items.filter((b) => matchingIds.has(b.id));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (b) =>
          b.batchCode.toLowerCase().includes(q) ||
          b.sourceName.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getWasteBatchById(idOrCode: string): Promise<WasteBatch | null> {
    const query = idOrCode.trim().toUpperCase();
    const found = this.wasteBatches.find(
      (b) => b.id === idOrCode || b.batchCode.toUpperCase() === query
    );
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async getWasteBatchByCode(batchCode: string): Promise<WasteBatch | null> {
    return this.getWasteBatchById(batchCode);
  }

  // --- Public Waste Traceability ---
  async getPublicWasteTraceability(
    batchCode: string
  ): Promise<PublicWasteTraceability | null> {
    const query = batchCode.trim().toUpperCase();
    const batch = this.wasteBatches.find(
      (b) => b.batchCode.toUpperCase() === query || b.id === batchCode
    );

    if (!batch) return null;

    const source = batch.sourceId
      ? this.wasteSources.find((s) => s.id === batch.sourceId)
      : null;
    const publicSourceName = source?.name || batch.sourceName || "Registered Source";

    const linkedProducts = this.productBatches.filter((p) =>
      p.linkedWasteBatches?.some(
        (wb) => wb.id === batch.id || wb.batchCode.toUpperCase() === batch.batchCode.toUpperCase()
      )
    );
    const linkedProductBatchCodes = linkedProducts.map((p) => p.batchCode);

    const currentStageIndex = CANONICAL_PROCESSING_STAGES.findIndex(
      (s) => s.id === batch.currentStatus
    );

    const publicTimeline: PublicStageEvent[] = CANONICAL_PROCESSING_STAGES.map((stage, idx) => {
      const event = batch.stageHistory?.find(
        (h) => h.stageName.toLowerCase() === stage.name.toLowerCase()
      );
      const isCompleted =
        batch.currentStatus !== "rejected" &&
        (currentStageIndex > idx || batch.currentStatus === "completed");
      const isCurrent = batch.currentStatus !== "rejected" && batch.currentStatus === stage.id;

      return {
        stageName: stage.name,
        stageOrder: stage.stageOrder,
        enteredAt: event?.enteredAt || (isCompleted ? batch.createdAt : ""),
        isCompleted,
        isCurrent,
      };
    });

    const currentStageDef = CANONICAL_PROCESSING_STAGES.find((s) => s.id === batch.currentStatus);
    const currentStatusLabel =
      batch.currentStatus === "rejected"
        ? "Rejected from Processing"
        : currentStageDef?.name || batch.currentStatus;

    return {
      batchCode: batch.batchCode,
      wasteType: batch.wasteType,
      wasteTypeLabel: WASTE_TYPE_DISPLAY[batch.wasteType] || batch.wasteType,
      sourceName: publicSourceName,
      weightKg: batch.weightKg,
      collectionDate: batch.collectionDate,
      location: batch.location || null,
      currentStatus: batch.currentStatus,
      currentStatusLabel,
      timeline: publicTimeline,
      linkedProductBatchCodes,
      linkedProductBatchCode: linkedProductBatchCodes.length > 0 ? linkedProductBatchCodes[0] : null,
      sustainability: {
        wasteDivertedKg: batch.weightKg,
        summary: "100% of recorded material diverted from agricultural disposal into circular value recovery.",
      },
      recordTimestamp: new Date().toISOString(),
    };
  }

  // --- Public Product Traceability ---
  async getPublicProductTraceability(
    batchCode: string
  ): Promise<PublicProductTraceability | null> {
    const query = batchCode.trim().toUpperCase();
    const product = this.productBatches.find(
      (p) => p.batchCode.toUpperCase() === query || p.id === batchCode
    );

    if (!product) return null;

    const sourceWasteBatches: PublicProductWasteSource[] = (product.linkedWasteBatches || []).map((linked) => {
      const liveWaste = this.wasteBatches.find(
        (w) => w.id === linked.id || w.batchCode.toUpperCase() === linked.batchCode.toUpperCase()
      );
      const wasteType = liveWaste?.wasteType || (linked.wasteType as WasteType) || "mango_peel";
      const currentStatus = liveWaste?.currentStatus || "completed";
      const stageDef = CANONICAL_PROCESSING_STAGES.find((s) => s.id === currentStatus);

      return {
        batchCode: liveWaste?.batchCode || linked.batchCode,
        wasteType,
        wasteTypeLabel: WASTE_TYPE_DISPLAY[wasteType] || wasteType,
        sourceName: liveWaste?.sourceName || linked.sourceName || "Registered Source",
        weightKg: liveWaste?.weightKg ?? linked.weightKg,
        collectionDate: liveWaste?.collectionDate || linked.collectionDate,
        currentStatus,
        currentStatusLabel: stageDef?.name || currentStatus,
        traceUrl: `/trace/waste/${liveWaste?.batchCode || linked.batchCode}`,
      };
    });

    const totalWasteUsedKg = sourceWasteBatches.reduce((acc, wb) => acc + wb.weightKg, 0);
    const distinctSources = new Set(sourceWasteBatches.map((wb) => wb.sourceName));

    const processingJourneySummary = [
      "Waste Collection & Registration",
      "Sorting & Quality Verification",
      "Washing & Preparation",
      "Drying & Moisture Control",
      "Grinding to Particle Matrix",
      "Biological Extraction",
      "Formulation & Synthesis",
      "Laboratory Quality Testing",
      "Batch Certification",
    ];

    return {
      batchCode: product.batchCode,
      productName: product.productName,
      productType: product.productType || null,
      productionDate: product.productionDate || null,
      quantityProduced: product.quantityProduced ?? null,
      unit: product.unit || null,
      status: product.status,
      statusLabel: PRODUCT_STATUS_LABELS[product.status] || product.status,
      labTestingStatus: product.labTestingStatus,
      labTestingStatusLabel: LAB_STATUS_LABELS[product.labTestingStatus] || product.labTestingStatus,
      sourceWasteBatches,
      totalWasteUsedKg: Number(totalWasteUsedKg.toFixed(2)),
      processingJourneySummary,
      sustainability: {
        totalWasteDivertedKg: Number(totalWasteUsedKg.toFixed(2)),
        sourceCount: distinctSources.size,
        summary: `Formulated from ${sourceWasteBatches.length} recorded agricultural waste batch(es), diverting ${totalWasteUsedKg.toFixed(2)} kg of organic waste into bio-based products.`,
      },
      recordTimestamp: new Date().toISOString(),
    };
  }

  // --- Waste Batches (Mutations) ---
  async createWasteBatch(input: CreateWasteBatchInput): Promise<WasteBatch> {
    const currentYear = new Date().getFullYear();
    const prefix = `MW-${currentYear}-`;

    const existingSequences = this.wasteBatches
      .map((b) => b.batchCode)
      .filter((code) => code.startsWith(prefix))
      .map((code) => parseInt(code.replace(prefix, ""), 10))
      .filter((num) => !isNaN(num));

    const nextSeq = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
    const batchCode = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    const source = this.wasteSources.find((s) => s.id === input.source_id);
    const id = `wb-${Date.now()}`;
    const now = new Date().toISOString();

    const initialStageHistory: BatchStageHistory = {
      id: `sh-${Date.now()}`,
      batchId: id,
      stageName: "Collected",
      stageOrder: 1,
      enteredAt: now,
      performedBy: this.currentUser.id,
      performerName: this.currentUser.fullName || undefined,
      notes: input.notes ?? "Initial batch collection intake recorded",
      createdAt: now,
    };

    const newBatch: WasteBatch = {
      id,
      batchCode,
      sourceId: input.source_id ?? null,
      sourceName: source?.name || "Unassigned Source",
      wasteType: input.waste_type,
      weightKg: input.weight_kg,
      collectionDate: input.collection_date,
      location: input.location ?? null,
      visualCondition: input.visual_condition ?? null,
      moistureStatus: input.moisture_status ?? null,
      storageDurationDays: input.storage_duration_days ?? 0,
      currentStatus: "collected",
      notes: input.notes ?? null,
      createdBy: this.currentUser.id,
      creatorName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
      stageHistory: [initialStageHistory],
    };

    this.wasteBatches.unshift(newBatch);

    this.recordAuditLog({
      action: "batch.created",
      entityType: "waste_batch",
      entityId: newBatch.id,
      beforeValue: null,
      afterValue: { batchCode: newBatch.batchCode, weightKg: newBatch.weightKg },
    });

    return JSON.parse(JSON.stringify(newBatch));
  }

  async updateWasteBatch(
    idOrCode: string,
    input: UpdateWasteBatchInput
  ): Promise<WasteBatch> {
    const query = idOrCode.trim().toUpperCase();
    const index = this.wasteBatches.findIndex(
      (b) => b.id === idOrCode || b.batchCode.toUpperCase() === query
    );

    if (index === -1) {
      throw new Error(`Waste Batch "${idOrCode}" not found.`);
    }

    const batch = this.wasteBatches[index];
    const source = input.source_id
      ? this.wasteSources.find((s) => s.id === input.source_id)
      : null;

    const updatedBatch: WasteBatch = {
      ...batch,
      wasteType: input.waste_type || batch.wasteType,
      sourceId: input.source_id !== undefined ? (input.source_id ?? null) : batch.sourceId,
      sourceName: source ? source.name : (input.source_id === null ? "Unassigned" : batch.sourceName),
      weightKg: input.weight_kg !== undefined ? input.weight_kg : batch.weightKg,
      collectionDate: input.collection_date || batch.collectionDate,
      location: input.location !== undefined ? (input.location ?? null) : batch.location,
      visualCondition: input.visual_condition !== undefined ? (input.visual_condition ?? null) : batch.visualCondition,
      moistureStatus: input.moisture_status !== undefined ? (input.moisture_status ?? null) : batch.moistureStatus,
      storageDurationDays: input.storage_duration_days !== undefined ? (input.storage_duration_days ?? null) : batch.storageDurationDays,
      notes: input.notes !== undefined ? (input.notes ?? null) : batch.notes,
      updatedAt: new Date().toISOString(),
    };

    this.wasteBatches[index] = updatedBatch;
    return JSON.parse(JSON.stringify(updatedBatch));
  }

  async advanceBatchStage(
    idOrCode: string,
    input: AdvanceStageInput
  ): Promise<WasteBatch> {
    const query = idOrCode.trim().toUpperCase();
    const index = this.wasteBatches.findIndex(
      (b) => b.id === idOrCode || b.batchCode.toUpperCase() === query
    );

    if (index === -1) {
      throw new Error(`Waste Batch "${idOrCode}" not found.`);
    }

    const batch = this.wasteBatches[index];

    if (batch.currentStatus === "completed" || batch.currentStatus === "rejected") {
      throw new Error(`Cannot advance batch with terminal status "${batch.currentStatus}".`);
    }

    const currentStageIndex = CANONICAL_PROCESSING_STAGES.findIndex(
      (s) => s.id === batch.currentStatus
    );

    if (currentStageIndex === -1 || currentStageIndex >= CANONICAL_PROCESSING_STAGES.length - 1) {
      throw new Error(`Invalid stage transition for batch status "${batch.currentStatus}".`);
    }

    const nextStage = CANONICAL_PROCESSING_STAGES[currentStageIndex + 1];
    const now = new Date().toISOString();

    const stageEvent: BatchStageHistory = {
      id: `sh-${Date.now()}`,
      batchId: batch.id,
      stageName: nextStage.name,
      stageOrder: nextStage.stageOrder,
      enteredAt: now,
      performedBy: this.currentUser.id,
      performerName: this.currentUser.fullName || undefined,
      notes: input.notes ?? `Advanced to ${nextStage.name} stage`,
      createdAt: now,
    };

    const history = batch.stageHistory ? [...batch.stageHistory, stageEvent] : [stageEvent];

    const updatedBatch: WasteBatch = {
      ...batch,
      currentStatus: nextStage.id,
      updatedAt: now,
      stageHistory: history,
    };

    this.wasteBatches[index] = updatedBatch;

    this.recordAuditLog({
      action: "batch.stage_changed",
      entityType: "waste_batch",
      entityId: batch.id,
      beforeValue: { stage: batch.currentStatus },
      afterValue: { stage: nextStage.id },
    });

    return JSON.parse(JSON.stringify(updatedBatch));
  }

  async rejectBatch(idOrCode: string, input: RejectBatchInput): Promise<WasteBatch> {
    const query = idOrCode.trim().toUpperCase();
    const index = this.wasteBatches.findIndex(
      (b) => b.id === idOrCode || b.batchCode.toUpperCase() === query
    );

    if (index === -1) {
      throw new Error(`Waste Batch "${idOrCode}" not found.`);
    }

    const batch = this.wasteBatches[index];

    if (batch.currentStatus === "rejected" || batch.currentStatus === "completed") {
      throw new Error(`Batch is already in a terminal state "${batch.currentStatus}".`);
    }

    const now = new Date().toISOString();
    const stageEvent: BatchStageHistory = {
      id: `sh-${Date.now()}`,
      batchId: batch.id,
      stageName: "Rejected",
      stageOrder: 99,
      enteredAt: now,
      performedBy: this.currentUser.id,
      performerName: this.currentUser.fullName || undefined,
      notes: `Batch rejected from pipeline. Reason: ${input.reason}`,
      createdAt: now,
    };

    const history = batch.stageHistory ? [...batch.stageHistory, stageEvent] : [stageEvent];

    const updatedBatch: WasteBatch = {
      ...batch,
      currentStatus: "rejected",
      updatedAt: now,
      stageHistory: history,
    };

    this.wasteBatches[index] = updatedBatch;
    return JSON.parse(JSON.stringify(updatedBatch));
  }

  // --- Product Batches (Queries & Mutations) ---
  async getProductBatches(
    filters?: ProductBatchFilters
  ): Promise<PaginatedResult<ProductBatchListItem>> {
    let items: ProductBatchListItem[] = this.productBatches.map((p) => {
      const linkedWaste = (p.linkedWasteBatches || []).map((w) => w.batchCode);
      return {
        id: p.id,
        batchCode: p.batchCode,
        productName: p.productName,
        productType: p.productType || null,
        productionDate: p.productionDate,
        quantityProduced: p.quantityProduced,
        unit: p.unit,
        status: p.status,
        labTestingStatus: p.labTestingStatus,
        linkedWasteCount: p.linkedWasteBatches?.length || 0,
        linkedWasteCodes: linkedWaste,
        updatedAt: p.updatedAt,
      };
    });

    if (filters?.status && filters.status !== "all") {
      items = items.filter((p) => p.status === filters.status);
    }
    if (filters?.productType && filters.productType !== "all") {
      items = items.filter((p) => p.productType === filters.productType);
    }
    if (filters?.labTestingStatus && filters.labTestingStatus !== "all") {
      items = items.filter((p) => p.labTestingStatus === filters.labTestingStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.batchCode.toLowerCase().includes(q) ||
          p.productName.toLowerCase().includes(q) ||
          (p.productType && p.productType.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => (b.productionDate || b.updatedAt).localeCompare(a.productionDate || a.updatedAt));

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getProductBatchById(idOrCode: string): Promise<ProductBatch | null> {
    const query = idOrCode.trim().toUpperCase();
    const found = this.productBatches.find(
      (p) => p.id === idOrCode || p.batchCode.toUpperCase() === query
    );
    if (!found) return null;

    const refreshedLinked: LinkedWasteBatchSummary[] = (found.linkedWasteBatches || []).map((linked) => {
      const current = this.wasteBatches.find((w) => w.id === linked.id || w.batchCode === linked.batchCode);
      if (current) {
        return {
          id: current.id,
          batchCode: current.batchCode,
          wasteType: current.wasteType,
          sourceName: current.sourceName || "Unassigned Source",
          weightKg: current.weightKg,
          collectionDate: current.collectionDate,
          currentStatus: current.currentStatus,
        };
      }
      return linked;
    });

    return {
      ...found,
      linkedWasteBatches: refreshedLinked,
    };
  }

  async getProductBatchByCode(batchCode: string): Promise<ProductBatch | null> {
    return this.getProductBatchById(batchCode);
  }

  async createProductBatch(input: CreateProductBatchInput): Promise<ProductBatch> {
    const currentYear = new Date().getFullYear();
    const prefix = `BF-${currentYear}-`;

    const existingSequences = this.productBatches
      .map((p) => p.batchCode)
      .filter((code) => code.startsWith(prefix))
      .map((code) => parseInt(code.replace(prefix, ""), 10))
      .filter((num) => !isNaN(num));

    const nextSeq = existingSequences.length > 0 ? Math.max(...existingSequences) + 1 : 1;
    const batchCode = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    const selectedWasteBatches: LinkedWasteBatchSummary[] = input.waste_batch_ids
      .map((id) => this.wasteBatches.find((w) => w.id === id || w.batchCode === id))
      .filter((w): w is WasteBatch => !!w)
      .map((w) => ({
        id: w.id,
        batchCode: w.batchCode,
        wasteType: w.wasteType,
        sourceName: w.sourceName || "Unassigned Source",
        weightKg: w.weightKg,
        collectionDate: w.collectionDate,
        currentStatus: w.currentStatus,
      }));

    const id = `pb-${Date.now()}`;
    const now = new Date().toISOString();

    const newProduct: ProductBatch = {
      id,
      batchCode,
      productName: input.product_name,
      productType: input.product_type || null,
      productionDate: input.production_date || now.split("T")[0],
      quantityProduced: input.quantity_produced ?? null,
      unit: input.unit || null,
      status: input.status || "in_production",
      labTestingStatus: "pending",
      notes: input.notes || null,
      createdBy: this.currentUser.id,
      creatorName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
      linkedWasteBatches: selectedWasteBatches,
    };

    this.productBatches.unshift(newProduct);

    this.recordAuditLog({
      action: "product.created",
      entityType: "product_batch",
      entityId: newProduct.id,
      beforeValue: null,
      afterValue: { batchCode: newProduct.batchCode, productName: newProduct.productName },
    });

    return JSON.parse(JSON.stringify(newProduct));
  }

  async updateProductBatch(
    idOrCode: string,
    input: UpdateProductBatchInput
  ): Promise<ProductBatch> {
    const query = idOrCode.trim().toUpperCase();
    const index = this.productBatches.findIndex(
      (p) => p.id === idOrCode || p.batchCode.toUpperCase() === query
    );

    if (index === -1) {
      throw new Error(`Product Batch "${idOrCode}" not found.`);
    }

    const current = this.productBatches[index];
    let linkedWasteBatches = current.linkedWasteBatches;

    if (input.waste_batch_ids) {
      linkedWasteBatches = input.waste_batch_ids
        .map((id) => this.wasteBatches.find((w) => w.id === id || w.batchCode === id))
        .filter((w): w is WasteBatch => !!w)
        .map((w) => ({
          id: w.id,
          batchCode: w.batchCode,
          wasteType: w.wasteType,
          sourceName: w.sourceName || "Unassigned Source",
          weightKg: w.weightKg,
          collectionDate: w.collectionDate,
          currentStatus: w.currentStatus,
        }));
    }

    const updated: ProductBatch = {
      ...current,
      productName: input.product_name !== undefined ? input.product_name : current.productName,
      productType: input.product_type !== undefined ? input.product_type : current.productType,
      productionDate: input.production_date !== undefined ? input.production_date : current.productionDate,
      quantityProduced: input.quantity_produced !== undefined ? input.quantity_produced : current.quantityProduced,
      unit: input.unit !== undefined ? input.unit : current.unit,
      status: input.status || current.status,
      labTestingStatus: input.lab_testing_status || current.labTestingStatus,
      notes: input.notes !== undefined ? input.notes : current.notes,
      linkedWasteBatches,
      updatedAt: new Date().toISOString(),
    };

    this.productBatches[index] = updated;
    return JSON.parse(JSON.stringify(updated));
  }

  // --- Laboratory Tests (Queries & Mutations) ---
  async getLaboratoryTests(
    filters?: LaboratoryTestFilters
  ): Promise<PaginatedResult<LaboratoryTestListItem>> {
    let items: LaboratoryTestListItem[] = this.labTests.map((t) => {
      const product = t.productBatchId
        ? this.productBatches.find((p) => p.id === t.productBatchId)
        : null;
      const waste = t.wasteBatchId
        ? this.wasteBatches.find((w) => w.id === t.wasteBatchId)
        : null;

      const targetBatchCode =
        t.productBatchCode ||
        product?.batchCode ||
        t.wasteBatchCode ||
        waste?.batchCode ||
        "Unassigned";

      const targetBatchType: "waste" | "product" | "unassigned" = t.productBatchId
        ? "product"
        : t.wasteBatchId
        ? "waste"
        : "unassigned";

      const targetBatchId = t.productBatchId || t.wasteBatchId || null;

      return {
        id: t.id,
        testType: t.testType,
        targetBatchCode,
        targetBatchType,
        targetBatchId,
        testDate: t.testDate,
        status: t.status,
        numericResultFormatted:
          t.numericResult !== null
            ? `${t.numericResult} ${t.resultUnit || ""}`.trim()
            : null,
        resultSummary: t.resultSummary,
        attachmentCount: t.attachments?.length || 0,
        updatedAt: t.updatedAt,
      };
    });

    if (filters?.status && filters.status !== "all") {
      items = items.filter((t) => t.status === filters.status);
    }
    if (filters?.testType && filters.testType !== "all") {
      items = items.filter((t) => t.testType.toLowerCase().includes(filters.testType!.toLowerCase()));
    }
    if (filters?.targetBatchType && filters.targetBatchType !== "all") {
      items = items.filter((t) => t.targetBatchType === filters.targetBatchType);
    }
    if (filters?.wasteBatchId) {
      items = items.filter((t) => t.targetBatchId === filters.wasteBatchId);
    }
    if (filters?.productBatchId) {
      items = items.filter((t) => t.targetBatchId === filters.productBatchId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (t) =>
          t.testType.toLowerCase().includes(q) ||
          t.targetBatchCode.toLowerCase().includes(q) ||
          (t.resultSummary && t.resultSummary.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => (b.testDate || b.updatedAt).localeCompare(a.testDate || a.updatedAt));

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getLaboratoryTestById(id: string): Promise<LaboratoryTest | null> {
    const found = this.labTests.find((t) => t.id === id);
    if (!found) return null;

    const product = found.productBatchId
      ? this.productBatches.find((p) => p.id === found.productBatchId)
      : null;
    const waste = found.wasteBatchId
      ? this.wasteBatches.find((w) => w.id === found.wasteBatchId)
      : null;

    return {
      ...found,
      productBatchCode: product?.batchCode || found.productBatchCode || null,
      wasteBatchCode: waste?.batchCode || found.wasteBatchCode || null,
    };
  }

  async createLaboratoryTest(input: CreateLaboratoryTestInput): Promise<LaboratoryTest> {
    const id = `lab-${Date.now()}`;
    const now = new Date().toISOString();

    const product = input.product_batch_id
      ? this.productBatches.find(
          (p) => p.id === input.product_batch_id || p.batchCode === input.product_batch_id
        )
      : null;

    const waste = input.waste_batch_id
      ? this.wasteBatches.find(
          (w) => w.id === input.waste_batch_id || w.batchCode === input.waste_batch_id
        )
      : null;

    const attachments: LaboratoryAttachment[] = (input.attachments || []).map((att, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      testId: id,
      fileName: att.fileName,
      fileSizeBytes: att.fileSizeBytes,
      mimeType: att.mimeType,
      storagePath: `laboratory-attachments/${id}/${att.fileName}`,
      uploadedBy: this.currentUser.id,
      createdAt: now,
      updatedAt: now,
    }));

    const newTest: LaboratoryTest = {
      id,
      testType: input.test_type,
      wasteBatchId: waste?.id || (input.waste_batch_id ?? null),
      wasteBatchCode: waste?.batchCode || null,
      productBatchId: product?.id || (input.product_batch_id ?? null),
      productBatchCode: product?.batchCode || null,
      testDate: input.test_date || now.split("T")[0],
      status: input.status,
      resultSummary: input.result_summary || null,
      numericResult: input.numeric_result ?? null,
      resultUnit: input.result_unit || null,
      researcherNotes: input.researcher_notes || null,
      createdBy: this.currentUser.id,
      creatorName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
      attachments,
    };

    this.labTests.unshift(newTest);

    if (product) {
      const prodIndex = this.productBatches.findIndex((p) => p.id === product.id);
      if (prodIndex !== -1) {
        if (input.status === "completed") {
          this.productBatches[prodIndex].labTestingStatus = "passed";
        } else if (input.status === "failed") {
          this.productBatches[prodIndex].labTestingStatus = "failed";
        } else if (input.status === "in_progress") {
          this.productBatches[prodIndex].labTestingStatus = "in_progress";
        }
      }
    }

    return JSON.parse(JSON.stringify(newTest));
  }

  async updateLaboratoryTest(
    id: string,
    input: UpdateLaboratoryTestInput
  ): Promise<LaboratoryTest> {
    const index = this.labTests.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Laboratory Test "${id}" not found.`);
    }

    const current = this.labTests[index];
    const now = new Date().toISOString();

    const product = input.product_batch_id
      ? this.productBatches.find(
          (p) => p.id === input.product_batch_id || p.batchCode === input.product_batch_id
        )
      : null;

    const waste = input.waste_batch_id
      ? this.wasteBatches.find(
          (w) => w.id === input.waste_batch_id || w.batchCode === input.waste_batch_id
        )
      : null;

    let attachments = current.attachments || [];
    if (input.attachments) {
      const newAtts: LaboratoryAttachment[] = input.attachments.map((att, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        testId: id,
        fileName: att.fileName,
        fileSizeBytes: att.fileSizeBytes,
        mimeType: att.mimeType,
        storagePath: `laboratory-attachments/${id}/${att.fileName}`,
        uploadedBy: this.currentUser.id,
        createdAt: now,
        updatedAt: now,
      }));
      attachments = [...attachments, ...newAtts];
    }

    const updated: LaboratoryTest = {
      ...current,
      testType: input.test_type !== undefined ? input.test_type : current.testType,
      wasteBatchId:
        input.waste_batch_id !== undefined
          ? (waste?.id || input.waste_batch_id || null)
          : current.wasteBatchId,
      wasteBatchCode: waste?.batchCode || current.wasteBatchCode,
      productBatchId:
        input.product_batch_id !== undefined
          ? (product?.id || input.product_batch_id || null)
          : current.productBatchId,
      productBatchCode: product?.batchCode || current.productBatchCode,
      testDate: input.test_date !== undefined ? input.test_date : current.testDate,
      status: input.status || current.status,
      resultSummary: input.result_summary !== undefined ? input.result_summary : current.resultSummary,
      numericResult: input.numeric_result !== undefined ? input.numeric_result : current.numericResult,
      resultUnit: input.result_unit !== undefined ? input.result_unit : current.resultUnit,
      researcherNotes: input.researcher_notes !== undefined ? input.researcher_notes : current.researcherNotes,
      attachments,
      updatedAt: now,
    };

    this.labTests[index] = updated;

    if (updated.productBatchId) {
      const prodIndex = this.productBatches.findIndex((p) => p.id === updated.productBatchId);
      if (prodIndex !== -1) {
        if (updated.status === "completed") {
          this.productBatches[prodIndex].labTestingStatus = "passed";
        } else if (updated.status === "failed") {
          this.productBatches[prodIndex].labTestingStatus = "failed";
        } else if (updated.status === "in_progress") {
          this.productBatches[prodIndex].labTestingStatus = "in_progress";
        }
      }
    }

    return JSON.parse(JSON.stringify(updated));
  }

  async deleteLaboratoryTest(id: string): Promise<boolean> {
    const index = this.labTests.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Laboratory Test "${id}" not found.`);
    }
    this.labTests.splice(index, 1);
    return true;
  }

  // --- 4. MangoCycle AI Operations ---

  async analyzeWasteImage(input: AnalyzeWasteImageInput): Promise<AiWasteVisualAnalysis> {
    const now = new Date().toISOString();
    const batch = input.wasteBatchId
      ? this.wasteBatches.find((b) => b.id === input.wasteBatchId || b.batchCode === input.wasteBatchId)
      : null;

    let analysis: AiWasteVisualAnalysis;

    if (input.demoScenario === "peel_discolored" || (batch && batch.visualCondition === "poor")) {
      analysis = {
        wasteType: "mango_peel",
        wasteTypeLabel: "Mango Peel (قشور المانجو)",
        visualCondition: "poor",
        visualConditionLabel: "Poor (High surface browning / degradation)",
        visibleDiscoloration: "moderate",
        visibleSurfaceIrregularities: "moderate",
        visibleFindings: [
          "Pronounced surface discoloration and oxidation spots observed",
          "Uneven texture with localized dark patches",
          "Moisture-induced softening visible on peel margins",
          "No macroscopic mold colonies detected",
        ],
        manualReviewRecommended: true,
        confidenceNote: "Visual assessment only — based on macroscopic image features. Not a substitute for laboratory moisture or microbiological analysis.",
        model: "gpt-4o (multimodal vision simulation)",
        analyzedAt: now,
      };
    } else if (input.demoScenario === "seed_clean" || (batch && batch.wasteType === "mango_seed")) {
      analysis = {
        wasteType: "mango_seed",
        wasteTypeLabel: "Mango Seed / Kernel (بذور ونوى المانجو)",
        visualCondition: "good",
        visualConditionLabel: "Good (Clean kernel matrix)",
        visibleDiscoloration: "none",
        visibleSurfaceIrregularities: "minor",
        visibleFindings: [
          "Intact fibrous husk structure with uniform fibrous density",
          "Negligible surface browning detected on outer seed coat",
          "Dry fibrous appearance suitable for mechanical grinding preparation",
        ],
        manualReviewRecommended: false,
        confidenceNote: "Visual assessment only — based on macroscopic image features. Not a substitute for laboratory analysis.",
        model: "gpt-4o (multimodal vision simulation)",
        analyzedAt: now,
      };
    } else {
      analysis = {
        wasteType: "mango_peel",
        wasteTypeLabel: "Mango Peel (قشور المانجو)",
        visualCondition: "moderate",
        visualConditionLabel: "Moderate (Acceptable intake quality)",
        visibleDiscoloration: "minor",
        visibleSurfaceIrregularities: "minor",
        visibleFindings: [
          "Yellow-orange peel pigmentation with minor localized surface spotting",
          "Normal agricultural intake residue observed",
          "No visible fungal growth or rot detected on surface",
        ],
        manualReviewRecommended: false,
        confidenceNote: "Visual assessment only — based on image features. Not a substitute for laboratory analysis.",
        model: "gpt-4o (multimodal vision simulation)",
        analyzedAt: now,
      };
    }

    const record: AiAnalysisRecord = {
      id: `ai-${Date.now()}`,
      analysisType: "visual_assessment",
      wasteBatchId: batch?.id || null,
      wasteBatchCode: batch?.batchCode || null,
      productBatchId: null,
      productBatchCode: null,
      inputReference: `Image: ${input.imageName}`,
      promptVersion: "waste-analyzer-v1.0",
      model: analysis.model,
      inputData: {
        imageName: input.imageName,
        sizeBytes: input.imageSize,
        mimeType: input.imageMime,
        wasteBatchCode: batch?.batchCode || null,
      },
      outputData: { ...analysis },
      status: "completed",
      humanReviewed: false,
      requestedBy: this.currentUser.id,
      requesterName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.aiRecords.unshift(record);
    return analysis;
  }

  async getProcessingAdvice(batchIdOrCode: string): Promise<ProcessingAdvisorResponse> {
    const query = batchIdOrCode.trim().toUpperCase();
    const batch = this.wasteBatches.find(
      (b) => b.id === batchIdOrCode || b.batchCode.toUpperCase() === query
    );

    if (!batch) {
      throw new Error(`Waste Batch "${batchIdOrCode}" not found.`);
    }

    const now = new Date().toISOString();
    const currentStageDef = CANONICAL_PROCESSING_STAGES.find((s) => s.id === batch.currentStatus);
    const triggeredRules: ProcessingRule[] = [];

    if (batch.moistureStatus === "high") {
      triggeredRules.push({
        id: "R001",
        name: "High Moisture Intake Protocol",
        recommendation: "Prioritize drying stage before further processing",
        priority: "high",
        rationale: "Elevated water content accelerates microbial fermentation and enzymatic browning. Thermal or solar drying must be initiated to stabilize the biological matrix.",
        requiresScientificValidation: true,
      });
    }

    if ((batch.storageDurationDays ?? 0) > 7) {
      triggeredRules.push({
        id: "R002",
        name: "Extended Storage Inspection",
        recommendation: "Manual review required — extended storage may affect bioactive yield",
        priority: "high",
        rationale: "Storage duration exceeds 7 days. Secondary metabolite degradation (polyphenols/mangiferin) may require re-testing prior to extraction.",
        requiresScientificValidation: true,
      });
    }

    if (batch.visualCondition === "poor") {
      triggeredRules.push({
        id: "R003",
        name: "Visual Degradation Alert",
        recommendation: "Manual physical sorting inspection recommended before processing",
        priority: "high",
        rationale: "Severe discoloration or tissue breakdown recorded. Operator inspection must isolate degraded fractions to prevent contamination of downstream extraction lots.",
        requiresScientificValidation: true,
      });
    }

    if (batch.currentStatus === "collected") {
      triggeredRules.push({
        id: "R004",
        name: "Collection Intake Flow",
        recommendation: "Advance to Sorting & Quality Check to prevent ambient storage degradation",
        priority: "medium",
        rationale: "Fresh raw waste is susceptible to rapid moisture loss and oxidation. Transitioning to washing and sorting ensures optimal recovery.",
        requiresScientificValidation: false,
      });
    }

    if (batch.wasteType === "mango_seed" && batch.currentStatus === "dried") {
      triggeredRules.push({
        id: "R005",
        name: "Seed Kernel Grinding Parameter",
        recommendation: "Proceed to Grinding — seed kernels require heavy-duty mechanical milling",
        priority: "medium",
        rationale: "Mango endocarps have dense lignocellulosic walls requiring high-torque blade milling to achieve target particle sizes for solvent diffusion.",
        requiresScientificValidation: false,
      });
    }

    if (batch.currentStatus === "ground") {
      triggeredRules.push({
        id: "R006",
        name: "Extraction Readiness",
        recommendation: "Particle matrix is ready for biological extraction protocols",
        priority: "low",
        rationale: "Homogenized powder can now be loaded into extraction vessels with ethanol/water or aqueous Aloe vera solvent mixtures.",
        requiresScientificValidation: false,
      });
    }

    let aiExplanation = "";
    if (triggeredRules.length === 0) {
      aiExplanation = `Batch ${batch.batchCode} is operating under normal pipeline parameters with no critical rule alerts. Continue standard workflow progression towards ${currentStageDef?.name || batch.currentStatus}.`;
    } else {
      const highPriorityCount = triggeredRules.filter((r) => r.priority === "high").length;
      aiExplanation = `Evaluation of ${batch.batchCode} triggered ${triggeredRules.length} operational rule(s)${
        highPriorityCount > 0 ? ` including ${highPriorityCount} high-priority action(s)` : ""
      }. ${triggeredRules.map((r) => r.rationale).join(" ")}`;
    }

    const response: ProcessingAdvisorResponse = {
      batchCode: batch.batchCode,
      wasteType: batch.wasteType,
      currentStatus: batch.currentStatus,
      currentStatusLabel: currentStageDef?.name || batch.currentStatus,
      moistureStatus: batch.moistureStatus,
      storageDurationDays: batch.storageDurationDays,
      visualCondition: batch.visualCondition,
      triggeredRules,
      aiExplanation,
      scientificValidationNote: "All rule thresholds are prototype configuration values pending final calibration by the research team.",
      model: "gpt-4o (rule evaluation engine + natural language narrator)",
      analyzedAt: now,
    };

    const record: AiAnalysisRecord = {
      id: `ai-${Date.now()}`,
      analysisType: "processing_advice",
      wasteBatchId: batch.id,
      wasteBatchCode: batch.batchCode,
      productBatchId: null,
      productBatchCode: null,
      inputReference: `Batch Advice: ${batch.batchCode}`,
      promptVersion: "processing-advisor-v1.0",
      model: response.model,
      inputData: {
        batchCode: batch.batchCode,
        currentStatus: batch.currentStatus,
        moistureStatus: batch.moistureStatus,
        storageDurationDays: batch.storageDurationDays,
      },
      outputData: { ...response },
      status: "completed",
      humanReviewed: false,
      requestedBy: this.currentUser.id,
      requesterName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.aiRecords.unshift(record);
    return response;
  }

  async queryAskMangoCycle(question: string): Promise<AskMangoCycleMessage> {
    const q = question.toLowerCase().trim();
    const now = new Date().toISOString();
    const toolCalls: AskMangoCycleToolCall[] = [];
    let answerText = "";

    if (q.includes("how much") || q.includes("total waste") || q.includes("weight") || q.includes("collected")) {
      const totalWeight = this.wasteBatches.reduce((acc, b) => acc + b.weightKg, 0);
      const batchCount = this.wasteBatches.length;

      toolCalls.push({
        toolName: "get_total_waste",
        parameters: { period: "all" },
        result: {
          total_weight_kg: Number(totalWeight.toFixed(2)),
          batch_count: batchCount,
        },
      });

      answerText = `A total of **${totalWeight.toFixed(2)} kg** of mango waste has been recorded across **${batchCount} batches** in the platform repository.`;
    } else if (q.includes("active") || q.includes("in progress") || q.includes("status")) {
      const activeBatches = this.wasteBatches.filter(
        (b) => b.currentStatus !== "completed" && b.currentStatus !== "rejected"
      );

      toolCalls.push({
        toolName: "get_batches_by_status",
        parameters: { status: "active" },
        result: {
          active_count: activeBatches.length,
          batch_codes: activeBatches.map((b) => b.batchCode),
        },
      });

      answerText = `There are currently **${activeBatches.length} active waste batches** undergoing processing:\n\n` +
        activeBatches.map((b) => `• **${b.batchCode}** (${b.wasteType}, ${b.weightKg} kg) — Stage: *${b.currentStatus}*`).join("\n");
    } else if (q.includes("mw-") || q.includes("waste batch")) {
      const match = question.match(/MW-\d{4}-\d{3}/i);
      const targetCode = match ? match[0].toUpperCase() : "MW-2026-001";
      const batch = this.wasteBatches.find((b) => b.batchCode.toUpperCase() === targetCode);

      if (batch) {
        toolCalls.push({
          toolName: "get_batch_details",
          parameters: { batch_code: targetCode },
          result: {
            batchCode: batch.batchCode,
            wasteType: batch.wasteType,
            weightKg: batch.weightKg,
            sourceName: batch.sourceName,
            collectionDate: batch.collectionDate,
            currentStatus: batch.currentStatus,
          },
        });

        answerText = `Here are the recorded operational details for **${batch.batchCode}**:\n\n` +
          `• **Waste Classification:** ${WASTE_TYPE_DISPLAY[batch.wasteType] || batch.wasteType}\n` +
          `• **Intake Weight:** ${batch.weightKg} kg\n` +
          `• **Origin Source:** ${batch.sourceName || "Unassigned"}\n` +
          `• **Collection Date:** ${batch.collectionDate}\n` +
          `• **Current Stage:** *${batch.currentStatus}*`;
      } else {
        answerText = `I searched the platform database for waste batch **${targetCode}**, but no matching record was found.`;
      }
    } else if (q.includes("bf-") || q.includes("product batch") || q.includes("formulation")) {
      const match = question.match(/BF-\d{4}-\d{3}/i);
      const targetCode = match ? match[0].toUpperCase() : "BF-2026-001";
      const product = this.productBatches.find((p) => p.batchCode.toUpperCase() === targetCode);

      if (product) {
        toolCalls.push({
          toolName: "get_product_batch_details",
          parameters: { batch_code: targetCode },
          result: {
            batchCode: product.batchCode,
            productName: product.productName,
            productType: product.productType,
            productionDate: product.productionDate,
            quantityProduced: product.quantityProduced,
            unit: product.unit,
            status: product.status,
            labTestingStatus: product.labTestingStatus,
            linkedWasteCount: product.linkedWasteBatches?.length || 0,
          },
        });

        answerText = `Here are the details for product formulation **${product.batchCode}**:\n\n` +
          `• **Product Formulation:** ${product.productName} ${product.productType ? `(${product.productType})` : ""}\n` +
          `• **Production Output:** ${product.quantityProduced ?? "N/A"} ${product.unit || ""}\n` +
          `• **Lifecycle Status:** ${PRODUCT_STATUS_LABELS[product.status] || product.status}\n` +
          `• **Laboratory Testing Status:** ${LAB_STATUS_LABELS[product.labTestingStatus] || product.labTestingStatus}\n` +
          `• **Contributing Waste Batches:** ${product.linkedWasteBatches?.length || 0} recorded input(s)`;
      } else {
        answerText = `I searched for product batch **${targetCode}**, but no matching record was found in the database.`;
      }
    } else if (q.includes("source") || q.includes("supplier") || q.includes("factory")) {
      const sourceMap: Record<string, number> = {};
      this.wasteBatches.forEach((b) => {
        const name = b.sourceName || "Other Source";
        sourceMap[name] = (sourceMap[name] || 0) + b.weightKg;
      });

      const ranking = Object.entries(sourceMap)
        .sort(([, a], [, b]) => b - a)
        .map(([name, weight]) => ({ name, weight_kg: Number(weight.toFixed(2)) }));

      toolCalls.push({
        toolName: "get_waste_by_source",
        parameters: { period: "all" },
        result: { sources: ranking },
      });

      answerText = `Here is the waste intake breakdown by agricultural/industrial supplier:\n\n` +
        ranking.map((s, idx) => `${idx + 1}. **${s.name}** — ${s.weight_kg} kg`).join("\n");
    } else if (q.includes("lab") || q.includes("spectroscopy") || q.includes("tem") || q.includes("test")) {
      const recent = this.labTests.slice(0, 3).map((t) => ({
        testType: t.testType,
        targetBatchCode: t.productBatchCode || t.wasteBatchCode || "Unassigned",
        testDate: t.testDate,
        status: t.status,
        result: t.numericResult ? `${t.numericResult} ${t.resultUnit || ""}` : t.resultSummary,
      }));

      toolCalls.push({
        toolName: "get_recent_lab_results",
        parameters: { limit: 3 },
        result: { tests: recent },
      });

      answerText = `Here are the latest recorded laboratory characterizations:\n\n` +
        recent.map((t) => `• **${t.testType}** on ${t.targetBatchCode} (${t.testDate}): Status *${t.status}* ${t.result ? `[${t.result}]` : ""}`).join("\n");
    } else if (q.includes("kpi") || q.includes("dashboard") || q.includes("overview")) {
      const totalWeight = this.wasteBatches.reduce((acc, b) => acc + b.weightKg, 0);
      const completed = this.wasteBatches.filter((b) => b.currentStatus === "completed").length;

      toolCalls.push({
        toolName: "get_dashboard_metrics",
        parameters: {},
        result: {
          total_waste_kg: Number(totalWeight.toFixed(2)),
          total_batches: this.wasteBatches.length,
          completed_batches: completed,
          product_batches: this.productBatches.length,
        },
      });

      answerText = `**Current Platform KPIs:**\n\n` +
        `• **Total Waste Diverted:** ${totalWeight.toFixed(2)} kg\n` +
        `• **Total Waste Batches:** ${this.wasteBatches.length}\n` +
        `• **Completed Batches:** ${completed}\n` +
        `• **Product Formulations:** ${this.productBatches.length}`;
    } else {
      answerText = `I am Ask MangoCycle, a data assistant for the MangoCycle platform. I can answer questions about:\n\n` +
        `• **Total waste collected & metrics** (e.g. *"How much waste has been collected?"*)\n` +
        `• **Active and completed batches** (e.g. *"Show active batches"*)\n` +
        `• **Specific batch details** (e.g. *"Show details for MW-2026-001"* or *"BF-2026-001"*)\n` +
        `• **Supplier contributions** (e.g. *"Which source supplied the most waste?"*)\n` +
        `• **Recent laboratory test results** (e.g. *"Show recent lab tests"*)\n\n` +
        `Please ask a question related to these platform areas.`;
    }

    const message: AskMangoCycleMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: answerText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      isAiGenerated: true,
      timestamp: now,
      model: "gpt-4o (tool-calling query assistant)",
    };

    this.aiRecords.unshift({
      id: `ai-${Date.now()}`,
      analysisType: "ask_mangocycle",
      wasteBatchId: null,
      productBatchId: null,
      inputReference: `Query: ${question}`,
      promptVersion: "ask-mangocycle-v1.0",
      model: message.model || "gpt-4o",
      inputData: { question },
      outputData: { response: answerText, toolCalls },
      status: "completed",
      humanReviewed: false,
      requestedBy: this.currentUser.id,
      requesterName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return message;
  }

  async getSustainabilityInsights(period = "2026-01"): Promise<AiSustainabilityInsightResponse> {
    const totalWaste = this.wasteBatches.reduce((acc, b) => acc + b.weightKg, 0);
    const completedBatches = this.wasteBatches.filter((b) => b.currentStatus === "completed");
    const activeBatches = this.wasteBatches.filter(
      (b) => b.currentStatus !== "completed" && b.currentStatus !== "rejected"
    );

    const sourceMap: Record<string, number> = {};
    this.wasteBatches.forEach((b) => {
      const src = b.sourceName || "Other Source";
      sourceMap[src] = (sourceMap[src] || 0) + b.weightKg;
    });

    const wasteBySource = Object.entries(sourceMap).map(([sourceName, weightKg]) => ({
      sourceName,
      weightKg: Number(weightKg.toFixed(2)),
    }));

    const topSourceEntry = wasteBySource.sort((a, b) => b.weightKg - a.weightKg)[0] || null;
    const topSource = topSourceEntry
      ? { name: topSourceEntry.sourceName, weightKg: topSourceEntry.weightKg }
      : null;

    const typeConfigs: { type: WasteType; label: string }[] = [
      { type: "mango_peel", label: "Mango Peel" },
      { type: "mango_seed", label: "Mango Seed" },
      { type: "mixed_mango_waste", label: "Mixed Mango Waste" },
    ];

    const wasteByType = typeConfigs.map(({ type, label }) => {
      const matching = this.wasteBatches.filter((b) => b.wasteType === type);
      const weight = matching.reduce((acc, b) => acc + b.weightKg, 0);
      return {
        wasteType: type,
        label,
        weightKg: Number(weight.toFixed(2)),
      };
    });

    const metrics: SustainabilityCalculatedMetrics = {
      totalWasteCollectedKg: Number(totalWaste.toFixed(2)),
      totalWasteProcessedKg: null,
      totalBatches: this.wasteBatches.length,
      completedBatches: completedBatches.length,
      activeBatches: activeBatches.length,
      productBatchesCount: this.productBatches.length,
      wasteBySource,
      wasteByType,
      topSource,
    };

    const narrativeBullets: string[] = [
      `**${totalWaste.toFixed(2)} kg** of agricultural mango waste has been diverted from landfill disposal through verified intake workflows.`,
      `**${completedBatches.length} batch(es)** have completed full processing lifecycle stages, with **${activeBatches.length} batch(es)** currently active in intermediate preparation and extraction.`,
      topSource
        ? `**${topSource.name}** is currently the primary contributing supplier, accounting for ${topSource.weightKg.toFixed(2)} kg of collected organic material.`
        : "Multiple commercial and agricultural suppliers are actively contributing raw waste inputs.",
      `**${this.productBatches.length} bio-formulation batch(es)** have been synthesized downstream, closing the circular valorization loop.`,
    ];

    const aiSummary =
      `During ${period}, the MangoCycle circular platform diverted ${totalWaste.toFixed(2)} kg of organic waste across ${this.wasteBatches.length} batches. ` +
      `Operational throughput shows ${completedBatches.length} batch(es) fully processed and ${this.productBatches.length} bio-based formulations synthesized. ` +
      `Supply diversity encompasses ${wasteBySource.length} distinct supplier(s).`;

    const now = new Date().toISOString();

    const response: AiSustainabilityInsightResponse = {
      period,
      metrics,
      narrativeBullets,
      aiSummary,
      model: "gpt-4o (sustainability narrator)",
      generatedAt: now,
    };

    this.aiRecords.unshift({
      id: `ai-${Date.now()}`,
      analysisType: "sustainability_insights",
      wasteBatchId: null,
      productBatchId: null,
      inputReference: `Period Insights: ${period}`,
      promptVersion: "sustainability-insights-v1.0",
      model: response.model,
      inputData: { period, totalWasteKg: metrics.totalWasteCollectedKg },
      outputData: { ...response },
      status: "completed",
      humanReviewed: false,
      requestedBy: this.currentUser.id,
      requesterName: this.currentUser.fullName || undefined,
      createdAt: now,
      updatedAt: now,
    });

    return response;
  }

  async getAiAnalysisHistory(): Promise<AiAnalysisRecord[]> {
    return JSON.parse(JSON.stringify(this.aiRecords));
  }

  // --- 5. Reporting & Sustainability (20-REPORTING.md) ---

  async generateReport(params: ReportParameters): Promise<ReportData> {
    const id = `rep-${Date.now()}`;
    const now = new Date().toISOString();
    const typeLabel = REPORT_TYPE_LABELS[params.reportType] || params.reportType;

    let periodLabel = "All Recorded Time";
    if (params.startDate && params.endDate) {
      periodLabel = `${params.startDate} to ${params.endDate}`;
    } else if (params.startDate) {
      periodLabel = `Since ${params.startDate}`;
    } else if (params.endDate) {
      periodLabel = `Up to ${params.endDate}`;
    }

    const metadata: ReportMetadata = {
      id,
      title: `${typeLabel} — ${periodLabel}`,
      reportType: params.reportType,
      reportTypeLabel: typeLabel,
      generatedAt: now,
      periodLabel,
      startDate: params.startDate || null,
      endDate: params.endDate || null,
      generatedByName: this.currentUser.fullName || "Authorized Staff",
      isDemoData: true,
    };

    let filteredWaste = [...this.wasteBatches];
    let filteredProducts = [...this.productBatches];
    let filteredLab = [...this.labTests];

    if (params.startDate) {
      filteredWaste = filteredWaste.filter((b) => b.collectionDate >= params.startDate!);
      filteredProducts = filteredProducts.filter((p) => p.productionDate !== null && p.productionDate !== undefined && p.productionDate >= params.startDate!);
      filteredLab = filteredLab.filter((t) => t.testDate !== null && t.testDate !== undefined && t.testDate >= params.startDate!);
    }
    if (params.endDate) {
      filteredWaste = filteredWaste.filter((b) => b.collectionDate <= params.endDate!);
      filteredProducts = filteredProducts.filter((p) => p.productionDate !== null && p.productionDate !== undefined && p.productionDate <= params.endDate!);
      filteredLab = filteredLab.filter((t) => t.testDate !== null && t.testDate !== undefined && t.testDate <= params.endDate!);
    }

    if (params.wasteBatchId) {
      filteredWaste = filteredWaste.filter((b) => b.id === params.wasteBatchId || b.batchCode === params.wasteBatchId);
    }
    if (params.productBatchId) {
      filteredProducts = filteredProducts.filter((p) => p.id === params.productBatchId || p.batchCode === params.productBatchId);
    }

    const totalWeight = filteredWaste.reduce((acc, b) => acc + b.weightKg, 0);
    const completedBatches = filteredWaste.filter((b) => b.currentStatus === "completed").length;
    const activeBatches = filteredWaste.filter(
      (b) => b.currentStatus !== "completed" && b.currentStatus !== "rejected"
    ).length;

    const kpis: ReportKPI[] = [];
    const methodNotes: string[] = [
      "Report generated from deterministic platform repositories without manual value overrides.",
      "Total Waste Processed formula and biological Yield ratio are currently awaiting authoritative definition by the scientific team and are omitted.",
      "Date-filtered reporting intervals match strictly on recorded controlling dates (collectionDate for waste, productionDate for products, testDate for lab assays). Records missing a controlling date are excluded from specific interval queries.",
    ];

    let wasteRows: WasteReportRow[] | undefined;
    let productRows: ProductReportRow[] | undefined;
    let labRows: LabReportRow[] | undefined;
    let distributionByType: ReportChartPoint[] | undefined;
    let distributionBySource: ReportChartPoint[] | undefined;

    if (params.reportType === "waste_summary" || params.reportType === "sustainability") {
      kpis.push(
        { label: "Total Waste Diverted", value: totalWeight.toFixed(2), unit: "kg", subtext: "Intake mass diverted from disposal" },
        { label: "Intake Batches", value: filteredWaste.length, subtext: "Recorded waste lots" },
        { label: "Completed Lifecycles", value: completedBatches, subtext: "Processed batches" },
        { label: "Active in Pipeline", value: activeBatches, subtext: "Intermediate stages" }
      );

      wasteRows = filteredWaste.map((b) => ({
        batchCode: b.batchCode,
        wasteType: b.wasteType,
        wasteTypeLabel: WASTE_TYPE_DISPLAY[b.wasteType] || b.wasteType,
        sourceName: b.sourceName || "Unassigned",
        weightKg: b.weightKg,
        collectionDate: b.collectionDate,
        currentStatus: b.currentStatus,
        currentStatusLabel: CANONICAL_PROCESSING_STAGES.find((s) => s.id === b.currentStatus)?.name || b.currentStatus,
        stageCount: b.stageHistory?.length || 1,
      }));

      const typeMap: Record<string, number> = {};
      filteredWaste.forEach((b) => {
        typeMap[b.wasteType] = (typeMap[b.wasteType] || 0) + b.weightKg;
      });
      distributionByType = Object.entries(typeMap).map(([type, weight]) => ({
        name: WASTE_TYPE_DISPLAY[type as WasteType] || type,
        value: Number(weight.toFixed(2)),
      }));

      const sourceMap: Record<string, number> = {};
      filteredWaste.forEach((b) => {
        const name = b.sourceName || "Other Source";
        sourceMap[name] = (sourceMap[name] || 0) + b.weightKg;
      });
      distributionBySource = Object.entries(sourceMap).map(([name, weight]) => ({
        name,
        value: Number(weight.toFixed(2)),
      }));
    }

    if (params.reportType === "product_traceability" || params.reportType === "sustainability") {
      if (params.reportType === "product_traceability") {
        kpis.push(
          { label: "Product Batches", value: filteredProducts.length, subtext: "Synthesized formulations" },
          { label: "Passed Lab Testing", value: filteredProducts.filter((p) => p.labTestingStatus === "passed").length, subtext: "Batches with lab_testing_status = passed" },
          { label: "Upstream Waste Batches", value: filteredProducts.reduce((acc, p) => acc + (p.linkedWasteBatches?.length || 0), 0), subtext: "Linked waste inputs" }
        );
      }

      productRows = filteredProducts.map((p) => ({
        batchCode: p.batchCode,
        productName: p.productName,
        productType: p.productType,
        productionDate: p.productionDate,
        quantityProduced: p.quantityProduced,
        unit: p.unit,
        status: p.status,
        statusLabel: PRODUCT_STATUS_LABELS[p.status] || p.status,
        labTestingStatus: p.labTestingStatus,
        labTestingStatusLabel: LAB_STATUS_LABELS[p.labTestingStatus] || p.labTestingStatus,
        linkedWasteCount: p.linkedWasteBatches?.length || 0,
        linkedWasteCodes: (p.linkedWasteBatches || []).map((w) => w.batchCode),
      }));
    }

    if (params.reportType === "laboratory_summary") {
      kpis.push(
        { label: "Laboratory Assays", value: filteredLab.length, subtext: "Recorded analytical tests" },
        { label: "Completed Assays", value: filteredLab.filter((t) => t.status === "completed").length, subtext: "Assay protocols completed" },
        { label: "Active Assays", value: filteredLab.filter((t) => t.status === "in_progress").length, subtext: "In testing" }
      );

      labRows = filteredLab.map((t) => {
        const product = t.productBatchId ? this.productBatches.find((p) => p.id === t.productBatchId) : null;
        const waste = t.wasteBatchId ? this.wasteBatches.find((w) => w.id === t.wasteBatchId) : null;
        return {
          testType: t.testType,
          targetBatchCode: t.productBatchCode || product?.batchCode || t.wasteBatchCode || waste?.batchCode || "Unassigned",
          targetBatchType: t.productBatchId ? "product" : t.wasteBatchId ? "waste" : "unassigned",
          testDate: t.testDate || null,
          status: t.status,
          numericResultFormatted: t.numericResult !== null ? `${t.numericResult} ${t.resultUnit || ""}`.trim() : null,
          resultSummary: t.resultSummary,
        };
      });
      methodNotes.push("Confidential internal researcher methodology notes and raw binary spectrum files are excluded from standard reports.");
      methodNotes.push("Laboratory testing status reflects recorded platform workflow state ('passed' status) and does not constitute independent scientific certification or efficacy guarantee.");
    }

    if (params.reportType === "batch_report") {
      const targetBatch = filteredWaste[0] || this.wasteBatches[0];
      if (targetBatch) {
        kpis.push(
          { label: "Batch Code", value: targetBatch.batchCode, subtext: "Intake Identifier" },
          { label: "Recorded Mass", value: targetBatch.weightKg, unit: "kg", subtext: "Intake weight" },
          { label: "Current Stage", value: CANONICAL_PROCESSING_STAGES.find((s) => s.id === targetBatch.currentStatus)?.name || targetBatch.currentStatus, subtext: "Lifecycle Status" },
          { label: "Intake Date", value: targetBatch.collectionDate, subtext: "Registered on" }
        );

        wasteRows = [
          {
            batchCode: targetBatch.batchCode,
            wasteType: targetBatch.wasteType,
            wasteTypeLabel: WASTE_TYPE_DISPLAY[targetBatch.wasteType] || targetBatch.wasteType,
            sourceName: targetBatch.sourceName || "Unassigned",
            weightKg: targetBatch.weightKg,
            collectionDate: targetBatch.collectionDate,
            currentStatus: targetBatch.currentStatus,
            currentStatusLabel: CANONICAL_PROCESSING_STAGES.find((s) => s.id === targetBatch.currentStatus)?.name || targetBatch.currentStatus,
            stageCount: targetBatch.stageHistory?.length || 1,
          },
        ];
      }
    }

    let aiNarrative: ReportData["aiNarrative"] | undefined;
    if (params.includeAiNarrative !== false) {
      const narrativeBullets: string[] = [
        `During this period (${periodLabel}), **${totalWeight.toFixed(2)} kg** of organic mango waste was diverted across **${filteredWaste.length} batch(es)**.`,
        `Throughput tracking indicates **${completedBatches} batch(es)** completed processing and **${activeBatches} batch(es)** remain active in intermediate processing.`,
        `Downstream formulation includes **${filteredProducts.length} bio-formulation batch(es)** recorded in the platform database.`,
      ];

      aiNarrative = {
        summary: `This report synthesizes verified platform activity for ${periodLabel}. Total recorded intake stands at ${totalWeight.toFixed(2)} kg across ${filteredWaste.length} waste lots, supporting ${filteredProducts.length} product formulations. All numerical values reflect deterministic platform records.`,
        bulletPoints: narrativeBullets,
        model: "gpt-4o (report narrator)",
        generatedAt: now,
      };
    }

    const report: ReportData = {
      metadata,
      kpis,
      wasteRows,
      productRows,
      labRows,
      distributionByType,
      distributionBySource,
      aiNarrative,
      methodNotes,
    };

    this.generatedReports.unshift(report);
    return JSON.parse(JSON.stringify(report));
  }

  async getReportById(id: string): Promise<ReportData | null> {
    const found = this.generatedReports.find((r) => r.metadata.id === id);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  async getReportHistory(): Promise<ReportHistoryItem[]> {
    return this.generatedReports.map((r) => ({
      id: r.metadata.id,
      title: r.metadata.title,
      reportType: r.metadata.reportType,
      reportTypeLabel: r.metadata.reportTypeLabel,
      periodLabel: r.metadata.periodLabel,
      generatedByName: r.metadata.generatedByName,
      createdAt: r.metadata.generatedAt,
      updatedAt: r.metadata.generatedAt,
    }));
  }

  // --- 6. IoT & Smart Bin Operations (22-IOT-ARCHITECTURE.md) ---

  async getIoTDevices(): Promise<IoTDevice[]> {
    return JSON.parse(JSON.stringify(this.iotDevices));
  }

  async getIoTDeviceById(idOrCode: string): Promise<IoTDevice | null> {
    const query = idOrCode.trim().toUpperCase();
    const found = this.iotDevices.find(
      (d) => d.id === idOrCode || d.deviceCode.toUpperCase() === query
    );
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  async getIoTReadings(filter?: IoTReadingFilter): Promise<IoTReading[]> {
    let items = [...this.iotReadings];

    if (filter?.deviceId) {
      const q = filter.deviceId.trim().toUpperCase();
      items = items.filter(
        (r) => r.deviceId === filter.deviceId || r.deviceCode.toUpperCase() === q
      );
    }

    if (filter?.startDate) {
      items = items.filter((r) => r.recordedAt >= filter.startDate!);
    }
    if (filter?.endDate) {
      items = items.filter((r) => r.recordedAt <= filter.endDate!);
    }

    items.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

    if (filter?.limit) {
      items = items.slice(0, filter.limit);
    }

    return JSON.parse(JSON.stringify(items));
  }

  async getLatestReadingForDevice(deviceIdOrCode: string): Promise<IoTReading | null> {
    const q = deviceIdOrCode.trim().toUpperCase();
    const deviceReadings = this.iotReadings.filter(
      (r) => r.deviceId === deviceIdOrCode || r.deviceCode.toUpperCase() === q
    );
    if (deviceReadings.length === 0) return null;
    deviceReadings.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    return JSON.parse(JSON.stringify(deviceReadings[0]));
  }

  async simulateIoTReading(input: SimulateReadingInput): Promise<IoTReading> {
    if (input.weightKg < 0 || input.weightKg > 1000) {
      throw new Error("Simulated reading weight must be between 0 and 1,000 kg.");
    }

    const device = this.iotDevices.find(
      (d) => d.id === input.deviceId || d.deviceCode.toUpperCase() === input.deviceId.toUpperCase()
    );

    if (!device) {
      throw new Error(`Smart Bin device "${input.deviceId}" not found.`);
    }

    const now = input.recordedAt || new Date().toISOString();
    const readingId = `rd-${Date.now()}`;

    const newReading: IoTReading = {
      id: readingId,
      deviceId: device.id,
      deviceCode: device.deviceCode,
      weightKg: Number(input.weightKg.toFixed(3)),
      recordedAt: now,
      source: "simulated",
      createdAt: now,
      updatedAt: now,
    };

    this.iotReadings.unshift(newReading);

    device.latestReadingKg = newReading.weightKg;
    device.latestReadingAt = now;
    device.lastSeenAt = now;
    device.status = "active";
    device.updatedAt = now;

    return JSON.parse(JSON.stringify(newReading));
  }

  async getIoTWeightTrend(deviceIdOrCode?: string): Promise<IoTWeightPoint[]> {
    let readings = [...this.iotReadings];
    if (deviceIdOrCode) {
      const q = deviceIdOrCode.trim().toUpperCase();
      readings = readings.filter(
        (r) => r.deviceId === deviceIdOrCode || r.deviceCode.toUpperCase() === q
      );
    }

    readings.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

    return readings.map((r) => ({
      timestamp: r.recordedAt,
      weightKg: r.weightKg,
      deviceCode: r.deviceCode,
    }));
  }

  // --- Dashboard Data ---
  async getDashboardData(dateRange: DateRangeOption = "all"): Promise<DashboardData> {
    let batches = [...this.wasteBatches];
    if (dateRange === "7d") {
      batches = batches.filter((b) => b.collectionDate >= "2026-01-22");
    } else if (dateRange === "30d") {
      batches = batches.filter((b) => b.collectionDate >= "2026-01-01");
    }

    const totalWaste = batches.reduce((acc, b) => acc + b.weightKg, 0);
    const completedBatches = batches.filter((b) => b.currentStatus === "completed");
    const activeBatches = batches.filter(
      (b) => b.currentStatus !== "completed" && b.currentStatus !== "rejected"
    );

    const sourceMap: Record<string, number> = {};
    batches.forEach((b) => {
      const src = b.sourceName || "Other Source";
      sourceMap[src] = (sourceMap[src] || 0) + b.weightKg;
    });

    const wasteBySource = Object.entries(sourceMap).map(([sourceName, weightKg]) => ({
      sourceName,
      weightKg: Number(weightKg.toFixed(2)),
      percentage: totalWaste > 0 ? Math.round((weightKg / totalWaste) * 100) : 0,
    }));

    const typeConfigs: { type: WasteType; label: string }[] = [
      { type: "mango_peel", label: "Mango Peel" },
      { type: "mango_seed", label: "Mango Seed" },
      { type: "mixed_mango_waste", label: "Mixed Mango Waste" },
    ];

    const wasteByType: WasteByTypePoint[] = typeConfigs.map(({ type, label }) => {
      const matching = batches.filter((b) => b.wasteType === type);
      const weight = matching.reduce((acc, b) => acc + b.weightKg, 0);
      return {
        wasteType: type,
        label,
        weightKg: Number(weight.toFixed(2)),
        batchCount: matching.length,
      };
    });

    const batchesByStage = CANONICAL_PROCESSING_STAGES.map((stage) => {
      const count = batches.filter((b) => b.currentStatus === stage.id).length;
      return {
        stageId: stage.id,
        stageName: stage.name,
        count,
      };
    });

    const timeMap: Record<string, { weight: number; count: number }> = {};
    batches.forEach((b) => {
      const d = b.collectionDate;
      if (!timeMap[d]) {
        timeMap[d] = { weight: 0, count: 0 };
      }
      timeMap[d].weight += b.weightKg;
      timeMap[d].count += 1;
    });

    const wasteOverTime = Object.entries(timeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, val]) => ({
        date,
        weightKg: Number(val.weight.toFixed(2)),
        batchCount: val.count,
      }));

    const recentBatches = batches.slice(0, 5).map((b) => ({
      id: b.id,
      batchCode: b.batchCode,
      wasteType: b.wasteType,
      sourceName: b.sourceName || "Source",
      weightKg: b.weightKg,
      collectionDate: b.collectionDate,
      currentStatus: b.currentStatus,
      updatedAt: b.updatedAt,
    }));

    const attentionItems: AttentionBatchItem[] = [];
    const flaggedDemoBatch = batches.find((b) => b.id === "wb-003" && b.currentStatus === "collected");
    if (flaggedDemoBatch) {
      attentionItems.push({
        id: flaggedDemoBatch.id,
        batchCode: flaggedDemoBatch.batchCode,
        wasteType: flaggedDemoBatch.wasteType,
        sourceName: flaggedDemoBatch.sourceName || "Source",
        weightKg: flaggedDemoBatch.weightKg,
        collectionDate: flaggedDemoBatch.collectionDate,
        currentStatus: flaggedDemoBatch.currentStatus,
        updatedAt: flaggedDemoBatch.updatedAt,
        attentionReason: "Manual intake note: High moisture recorded at reception (Requires immediate drying)",
        urgency: "medium",
      });
    }

    const recentLabActivity: LaboratoryTestListItem[] = this.labTests.slice(0, 5).map((t) => {
      const product = t.productBatchId
        ? this.productBatches.find((p) => p.id === t.productBatchId)
        : null;
      const waste = t.wasteBatchId
        ? this.wasteBatches.find((w) => w.id === t.wasteBatchId)
        : null;

      const targetBatchCode =
        t.productBatchCode ||
        product?.batchCode ||
        t.wasteBatchCode ||
        waste?.batchCode ||
        "Unassigned";

      const targetBatchType: "waste" | "product" | "unassigned" = t.productBatchId
        ? "product"
        : t.wasteBatchId
        ? "waste"
        : "unassigned";

      return {
        id: t.id,
        testType: t.testType,
        targetBatchCode,
        targetBatchType,
        targetBatchId: t.productBatchId || t.wasteBatchId || null,
        testDate: t.testDate,
        status: t.status,
        numericResultFormatted:
          t.numericResult !== null
            ? `${t.numericResult} ${t.resultUnit || ""}`.trim()
            : null,
        resultSummary: t.resultSummary,
        attachmentCount: t.attachments?.length || 0,
        updatedAt: t.updatedAt,
      };
    });

    return {
      metrics: {
        totalWasteCollectedKg: Number(totalWaste.toFixed(2)),
        totalWasteProcessedKg: null,
        totalWasteBatchesCount: batches.length,
        activeBatchesCount: activeBatches.length,
        completedBatchesCount: completedBatches.length,
        productBatchesCount: this.productBatches.length,
        divertedWasteKg: Number(totalWaste.toFixed(2)),
        processingEfficiencyRate: null,
      },
      wasteOverTime,
      wasteBySource,
      wasteByType,
      batchesByStage,
      recentBatches,
      batchesRequiringAttention: attentionItems,
      recentLabActivity,
      aiInsights: { ...MOCK_AI_INSIGHT },
      smartBins: this.iotDevices.map((d) => ({
        id: d.id,
        deviceId: d.deviceCode,
        name: d.name || d.deviceCode,
        location: d.location || "Unassigned Location",
        currentWeightKg: d.latestReadingKg ?? 0,
        status: d.status,
        lastReadingAt: d.latestReadingAt || d.lastSeenAt || d.createdAt,
      })),
    };
  }
}

export const mockAdapter = new MockDataAdapter();
