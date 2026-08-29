const requiredPublicVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function getPublicSupabaseConfig(): { url: string; key: string } | null {
  const [urlName, keyName] = requiredPublicVariables;
  const url = process.env[urlName];
  const key = process.env[keyName];
  return url && key ? { url, key } : null;
}

export function requirePublicSupabaseConfig(): { url: string; key: string } {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error("Supabase authentication is not configured.");
  return config;
}

export function requireServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Privileged Supabase administration is not configured.");
  return key;
}

export function getApplicationUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function useSecureCookies(): boolean {
  try {
    return getApplicationUrl().startsWith("https://");
  } catch {
    return false;
  }
}
