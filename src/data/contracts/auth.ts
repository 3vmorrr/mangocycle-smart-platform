/**
 * Authentication and RBAC contracts per 07-AUTH-AND-RBAC.md & 05-DATABASE-SCHEMA.md §3.1
 */

export const USER_ROLES = [
  "super_admin",
  "admin",
  "researcher",
  "operator",
  "viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** Present only in the isolated mock adapter; production Auth never sets it. */
  isDemoSession?: boolean;
}

export const ROLE_HIERARCHY_LEVELS: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  researcher: 3,
  operator: 2,
  viewer: 1,
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  researcher: "Researcher",
  operator: "Operator",
  viewer: "Viewer",
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY_LEVELS[userRole] ?? 0) >= (ROLE_HIERARCHY_LEVELS[requiredRole] ?? 0);
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}
