/**
 * Frontend Permission Resolver (UX-ONLY)
 * 
 * CRITICAL SECURITY ARCHITECTURE NOTE:
 * This permission resolver governs client-side UI visibility and disabled states.
 * FRONTEND RBAC IS NOT A SECURITY BOUNDARY.
 * Authoritative security enforcement is handled server-side via Supabase Auth,
 * Server Action authorization checks, and PostgreSQL Row-Level Security (RLS).
 */

import { UserRole, UserProfile, hasMinimumRole } from "@/data/contracts/auth";

export type PermissionAction =
  // Waste Batches (07-AUTH-AND-RBAC.md §4.1)
  | "waste:view"
  | "waste:create"
  | "waste:edit"
  | "waste:delete"
  | "waste:advance_stage"
  | "waste:generate_qr"
  // Product Batches (§4.2)
  | "product:view"
  | "product:create"
  | "product:edit"
  | "product:delete"
  | "product:link_waste"
  | "product:generate_qr"
  // Laboratory Module (§4.3)
  | "lab:view"
  | "lab:create"
  | "lab:edit"
  | "lab:delete"
  | "lab:upload"
  | "lab:download"
  // MangoCycle AI (§4.4)
  | "ai:use_analyzer"
  | "ai:use_advisor"
  | "ai:use_ask"
  | "ai:view_insights"
  | "ai:generate_reports"
  | "ai:view_history"
  // Dashboard (§4.5)
  | "dashboard:view"
  | "dashboard:view_kpis"
  | "dashboard:view_charts"
  // IoT Management (§4.6)
  | "iot:view"
  | "iot:manage"
  // Reports (§4.7)
  | "reports:view"
  | "reports:generate"
  | "reports:export"
  // Administration (§4.8)
  | "admin:view_users"
  | "admin:create_users"
  | "admin:change_roles"
  | "admin:deactivate_users"
  | "admin:manage_sources"
  | "admin:manage_stages"
  | "admin:view_audit_logs"
  | "admin:edit_settings"
  | "admin:configure_ai";

const MINIMUM_ROLE_PER_PERMISSION: Record<PermissionAction, UserRole> = {
  // Waste
  "waste:view": "viewer",
  "waste:create": "operator",
  "waste:edit": "operator",
  "waste:delete": "admin",
  "waste:advance_stage": "operator",
  "waste:generate_qr": "viewer",

  // Products
  "product:view": "viewer",
  "product:create": "researcher",
  "product:edit": "researcher",
  "product:delete": "admin",
  "product:link_waste": "researcher",
  "product:generate_qr": "viewer",

  // Laboratory
  "lab:view": "viewer",
  "lab:create": "researcher",
  "lab:edit": "researcher",
  "lab:delete": "admin",
  "lab:upload": "researcher",
  "lab:download": "operator",

  // AI
  "ai:use_analyzer": "operator",
  "ai:use_advisor": "operator",
  "ai:use_ask": "viewer",
  "ai:view_insights": "viewer",
  "ai:generate_reports": "researcher",
  "ai:view_history": "researcher",

  // Dashboard
  "dashboard:view": "viewer",
  "dashboard:view_kpis": "viewer",
  "dashboard:view_charts": "viewer",

  // IoT
  "iot:view": "viewer",
  "iot:manage": "admin",

  // Reports
  "reports:view": "viewer",
  "reports:generate": "researcher",
  "reports:export": "researcher",

  // Administration
  "admin:view_users": "admin",
  "admin:create_users": "admin",
  "admin:change_roles": "admin",
  "admin:deactivate_users": "admin",
  "admin:manage_sources": "admin",
  "admin:manage_stages": "admin",
  "admin:view_audit_logs": "admin",
  "admin:edit_settings": "super_admin",
  "admin:configure_ai": "admin",
};

/**
 * Evaluates whether a role or user profile has permission for a specific action
 */
export function can(userOrRole: UserProfile | UserRole | null | undefined, action: PermissionAction): boolean {
  if (!userOrRole) return false;
  const role: UserRole = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  const requiredRole = MINIMUM_ROLE_PER_PERMISSION[action];
  if (!requiredRole) return false;
  return hasMinimumRole(role, requiredRole);
}

/**
 * Checks if actor can modify or assign target role
 * Rule: Admin cannot assign super_admin; user cannot change own role
 */
export function canAssignRole(
  actor: UserProfile | null | undefined,
  targetRole: UserRole,
  targetUserId?: string
): boolean {
  if (!actor) return false;
  if (targetUserId && actor.id === targetUserId) {
    return false; // No self-promotion / self-role change
  }
  if (targetRole === "super_admin") {
    return actor.role === "super_admin";
  }
  return hasMinimumRole(actor.role, "admin");
}

/**
 * Checks if actor can deactivate target user
 * Rule: Admin cannot deactivate Super Admin accounts; user cannot deactivate themselves
 */
export function canDeactivateUser(
  actor: UserProfile | null | undefined,
  targetUser: UserProfile
): boolean {
  if (!actor) return false;
  if (actor.id === targetUser.id) {
    return false; // Cannot deactivate self
  }
  if (targetUser.role === "super_admin") {
    return actor.role === "super_admin";
  }
  return hasMinimumRole(actor.role, "admin");
}
