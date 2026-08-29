import "server-only";

import { redirect } from "next/navigation";
import { UserProfile, UserRole, hasMinimumRole } from "@/data/contracts/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapProfile } from "./profile";

export class AuthorizationError extends Error {
  constructor(message: string, public readonly status = 403) {
    super(message);
  }
}

export async function getAuthenticatedProfile(): Promise<UserProfile | null> {
  const supabase = createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,avatar_url,is_active,created_at,updated_at")
    .eq("id", authData.user.id)
    .single();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function requireAuthenticatedUser(): Promise<UserProfile> {
  const profile = await getAuthenticatedProfile();
  if (!profile) throw new AuthorizationError("Authentication required.", 401);
  return profile;
}

export async function requireActiveUser(): Promise<UserProfile> {
  const profile = await requireAuthenticatedUser();
  if (!profile.isActive) throw new AuthorizationError("Account is inactive.");
  return profile;
}

export async function requireMinimumRole(required: UserRole): Promise<UserProfile> {
  const profile = await requireActiveUser();
  if (!hasMinimumRole(profile.role, required)) {
    throw new AuthorizationError("Insufficient role privileges.");
  }
  return profile;
}

export async function requireRole(...allowed: UserRole[]): Promise<UserProfile> {
  const profile = await requireActiveUser();
  if (!allowed.includes(profile.role)) throw new AuthorizationError("Role is not permitted.");
  return profile;
}

export async function requireDashboardUser(): Promise<UserProfile> {
  try {
    return await requireActiveUser();
  } catch (error) {
    const reason = error instanceof AuthorizationError && error.status === 403 ? "inactive" : "required";
    redirect(`/login?auth=${reason}`);
  }
}
