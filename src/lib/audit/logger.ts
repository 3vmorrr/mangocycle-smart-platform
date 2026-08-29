import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface AuditLogPayload {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "api_key",
  "api_key_hash",
  "apikey",
  "authorization",
  "jwt",
  "cookie",
]);

function sanitizeValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val === "string" && val.length > 2000) {
    return val.slice(0, 2000) + "... [truncated]";
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        sanitized[k] = "[REDACTED]";
      } else {
        sanitized[k] = sanitizeValue(v);
      }
    }
    return sanitized;
  }
  return val;
}

/**
 * Persists an authoritative audit log record to public.audit_logs via service_role client.
 * Fails closed by throwing an Error if the insert is rejected or fails, ensuring callers
 * do not silently execute un-audited state-mutating operations.
 */
export async function recordAuditLog(payload: AuditLogPayload): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const sanitizedBefore = payload.beforeValue ? sanitizeValue(payload.beforeValue) : null;
  const sanitizedAfter = payload.afterValue ? sanitizeValue(payload.afterValue) : null;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: payload.actorId ?? null,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    before_value: sanitizedBefore,
    after_value: sanitizedAfter,
    ip_address: payload.ipAddress ?? null,
  });

  if (error) {
    console.error("[AUDIT_FAILURE] Failed to write mandatory audit log:", {
      action: payload.action,
      entityType: payload.entityType,
      error: error.message,
    });
    throw new Error(`Mandatory audit record could not be persisted: ${error.message}`);
  }
}
