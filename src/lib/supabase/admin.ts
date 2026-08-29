import { createClient } from "@supabase/supabase-js";
import { requirePublicSupabaseConfig, requireServiceRoleKey } from "./env";

export function createAdminSupabaseClient() {
  const { url } = requirePublicSupabaseConfig();
  return createClient(url, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
