/**
 * Unified Frontend Data Service Layer
 * 
 * ARCHITECTURE CONTRACT:
 * UI components import services exclusively from this module.
 * Currently, it delegates to the isolated MockDataAdapter.
 * Later, Codex will connect this layer to real Supabase / Server Actions
 * without requiring any modifications to UI presentation components.
 */

import { mockAdapter } from "../adapters/mock/mock-adapter";
import { supabaseAuthAdapter } from "../adapters/supabase/auth-adapter";
import { supabaseAdminAdapter } from "../adapters/supabase/admin-adapter";
import { supabaseWasteAdapter } from "../adapters/supabase/waste-adapter";
import { supabaseProductAdapter } from "../adapters/supabase/product-adapter";
import { supabaseLaboratoryAdapter } from "../adapters/supabase/laboratory-adapter";
import { supabaseDashboardAdapter } from "../adapters/supabase/dashboard-adapter";
import { supabaseTraceabilityAdapter } from "../adapters/supabase/traceability-adapter";
import { supabaseAiAdapter } from "../adapters/supabase/ai-adapter";
import { supabaseReportAdapter } from "../adapters/supabase/report-adapter";
import { supabaseIoTAdapter } from "../adapters/supabase/iot-adapter";
import { DateRangeOption } from "../contracts/dashboard";
import {
  WasteBatchFilters,
  CreateWasteBatchInput,
  UpdateWasteBatchInput,
  AdvanceStageInput,
  RejectBatchInput,
} from "../contracts/waste-batch";
import {
  ProductBatchFilters,
  CreateProductBatchInput,
  UpdateProductBatchInput,
} from "../contracts/product-batch";
import {
  LaboratoryTestFilters,
  CreateLaboratoryTestInput,
  UpdateLaboratoryTestInput,
} from "../contracts/laboratory";
import {
  AnalyzeWasteImageInput,
} from "../contracts/ai";
import {
  ReportParameters,
} from "../contracts/report";
import {
  IoTReadingFilter,
  SimulateReadingInput,
} from "../contracts/iot";
import {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../contracts/auth";
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  AuditLogFilters,
  SystemSettingsState,
  AiConfigurationState,
} from "../contracts/admin";

export const authService = {
  login: (input: LoginInput) => supabaseAuthAdapter.login(input),
  logout: () => supabaseAuthAdapter.logout(),
  forgotPassword: (input: ForgotPasswordInput) => supabaseAuthAdapter.forgotPassword(input),
  resetPassword: (input: ResetPasswordInput) => supabaseAuthAdapter.resetPassword(input),
  getCurrentSession: () => supabaseAuthAdapter.getCurrentSession(),
  getCurrentUser: () => supabaseAuthAdapter.getCurrentUser(),
};

export const adminService = {
  getUsers: (filters?: UserFilters) => supabaseAdminAdapter.getUsers(filters),
  getUserById: (id: string) => supabaseAdminAdapter.getUserById(id),
  createUser: (input: CreateUserInput) => supabaseAdminAdapter.createUser(input),
  updateUser: (id: string, input: UpdateUserInput) => supabaseAdminAdapter.updateUser(id, input),
  deactivateUser: (id: string) => supabaseAdminAdapter.deactivateUser(id),
  reactivateUser: (id: string) => supabaseAdminAdapter.reactivateUser(id),
  getAuditLogs: (filters?: AuditLogFilters) => supabaseAdminAdapter.getAuditLogs(filters),
  getSystemSettings: () => supabaseAdminAdapter.getSystemSettings(),
  updateSystemSettings: (input: Partial<SystemSettingsState>) => supabaseAdminAdapter.updateSystemSettings(input),
  getAiConfiguration: () => mockAdapter.getAiConfiguration(),
  updateAiConfiguration: (input: Partial<AiConfigurationState>) => mockAdapter.updateAiConfiguration(input),
};

export const wasteBatchService = {
  getWasteSources: () => supabaseWasteAdapter.getWasteSources(),
  getWasteBatches: (filters?: WasteBatchFilters) =>
    supabaseWasteAdapter.getWasteBatches(filters),
  getWasteBatchById: (idOrCode: string) =>
    supabaseWasteAdapter.getWasteBatchById(idOrCode),
  getWasteBatchByCode: (code: string) =>
    supabaseWasteAdapter.getWasteBatchByCode(code),
  getPublicWasteTraceability: (batchCode: string) =>
    supabaseTraceabilityAdapter.getPublicWasteTraceability(batchCode),
  createWasteBatch: (input: CreateWasteBatchInput) =>
    supabaseWasteAdapter.createWasteBatch(input),
  updateWasteBatch: (idOrCode: string, input: UpdateWasteBatchInput) =>
    supabaseWasteAdapter.updateWasteBatch(idOrCode, input),
  advanceBatchStage: (idOrCode: string, input: AdvanceStageInput) =>
    supabaseWasteAdapter.advanceBatchStage(idOrCode, input),
  rejectBatch: (idOrCode: string, input: RejectBatchInput) =>
    supabaseWasteAdapter.rejectBatch(idOrCode, input),
};

export const traceabilityService = {
  getPublicWasteTraceability: (batchCode: string) =>
    supabaseTraceabilityAdapter.getPublicWasteTraceability(batchCode),
  getPublicProductTraceability: (batchCode: string) =>
    supabaseTraceabilityAdapter.getPublicProductTraceability(batchCode),
};

export const productBatchService = {
  getProductBatches: (filters?: ProductBatchFilters) =>
    supabaseProductAdapter.getProductBatches(filters),
  getProductBatchById: (id: string) =>
    supabaseProductAdapter.getProductBatchById(id),
  getProductBatchByCode: (code: string) =>
    supabaseProductAdapter.getProductBatchByCode(code),
  createProductBatch: (input: CreateProductBatchInput) =>
    supabaseProductAdapter.createProductBatch(input),
  updateProductBatch: (idOrCode: string, input: UpdateProductBatchInput) =>
    supabaseProductAdapter.updateProductBatch(idOrCode, input),
};

export const laboratoryService = {
  getLaboratoryTests: (filters?: LaboratoryTestFilters) =>
    supabaseLaboratoryAdapter.getLaboratoryTests(filters),
  getLaboratoryTestById: (id: string) =>
    supabaseLaboratoryAdapter.getLaboratoryTestById(id),
  createLaboratoryTest: (input: CreateLaboratoryTestInput) =>
    supabaseLaboratoryAdapter.createLaboratoryTest(input),
  updateLaboratoryTest: (id: string, input: UpdateLaboratoryTestInput) =>
    supabaseLaboratoryAdapter.updateLaboratoryTest(id, input),
  deleteLaboratoryTest: (id: string) =>
    supabaseLaboratoryAdapter.deleteLaboratoryTest(id),
  uploadAttachment: (testId: string, file: File) =>
    supabaseLaboratoryAdapter.uploadAttachment(testId, file),
  getAttachmentDownloadUrl: (testId: string, attachmentId: string) =>
    supabaseLaboratoryAdapter.getAttachmentDownloadUrl(testId, attachmentId),
  deleteAttachment: (testId: string, attachmentId: string) =>
    supabaseLaboratoryAdapter.deleteAttachment(testId, attachmentId),
};

export const aiService = {
  analyzeWasteImage: (input: AnalyzeWasteImageInput) =>
    supabaseAiAdapter.analyzeWasteImage(input),
  getProcessingAdvice: (batchIdOrCode: string) =>
    supabaseAiAdapter.getProcessingAdvice(batchIdOrCode),
  queryAskMangoCycle: (question: string) =>
    supabaseAiAdapter.queryAskMangoCycle(question),
  getSustainabilityInsights: (period?: string) =>
    supabaseAiAdapter.getSustainabilityInsights(period),
  getAiAnalysisHistory: () =>
    supabaseAiAdapter.getAiAnalysisHistory(),
};

export const reportService = {
  generateReport: (params: ReportParameters) =>
    supabaseReportAdapter.generateReport(params),
  getReportById: (id: string) =>
    supabaseReportAdapter.getReportById(id),
  getReportHistory: () =>
    supabaseReportAdapter.getReportHistory(),
};

export const iotService = {
  getIoTDevices: () =>
    supabaseIoTAdapter.getIoTDevices(),
  getIoTDeviceById: (idOrCode: string) =>
    supabaseIoTAdapter.getIoTDeviceById(idOrCode),
  getIoTReadings: (filter?: IoTReadingFilter) =>
    supabaseIoTAdapter.getIoTReadings(filter),
  getLatestReadingForDevice: (deviceIdOrCode: string) =>
    supabaseIoTAdapter.getLatestReadingForDevice(deviceIdOrCode),
  simulateIoTReading: (input: SimulateReadingInput) =>
    supabaseIoTAdapter.simulateIoTReading(input),
  getIoTWeightTrend: (deviceIdOrCode?: string) =>
    supabaseIoTAdapter.getIoTWeightTrend(deviceIdOrCode),
};

export const dashboardService = {
  getDashboardData: (dateRange?: DateRangeOption) =>
    supabaseDashboardAdapter.getDashboardData(dateRange),
};
