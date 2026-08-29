import { UserProfile, UserRole, USER_ROLES } from "@/data/contracts/auth";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function mapProfile(row: ProfileRow): UserProfile {
  if (!isUserRole(row.role)) throw new Error("Profile contains an invalid role.");
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
