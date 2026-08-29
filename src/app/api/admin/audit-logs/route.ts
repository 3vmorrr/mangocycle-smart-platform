import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/data/contracts/auth";
import { AuditLogEntry } from "@/data/contracts/admin";
import { PaginatedResult } from "@/data/contracts/types";

interface DbAuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  actor?: { full_name?: string | null; role?: string | null } | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Strict RBAC gate: admin or super_admin only
    await requireMinimumRole("admin");

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const actorId = searchParams.get("actorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));
    const offset = (page - 1) * pageSize;

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from("audit_logs")
      .select(
        `
        id,
        actor_id,
        action,
        entity_type,
        entity_id,
        before_value,
        after_value,
        ip_address,
        created_at,
        actor:profiles!audit_logs_actor_id_fkey(full_name, role)
      `,
        { count: "exact" }
      );

    if (action && action !== "all") {
      query = query.eq("action", action);
    }
    if (entityType && entityType !== "all") {
      query = query.eq("entity_type", entityType);
    }
    if (actorId) {
      query = query.eq("actor_id", actorId);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }

    const rows = (data || []) as unknown as DbAuditLogRow[];
    const items: AuditLogEntry[] = rows.map((row) => ({
      id: row.id,
      actorId: row.actor_id ?? "",
      actorName: row.actor?.full_name ?? "System / Service",
      actorRole: (row.actor?.role as UserRole) ?? undefined,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id ?? null,
      beforeValue: row.before_value ?? null,
      afterValue: row.after_value ?? null,
      ipAddress: row.ip_address ?? null,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));

    const total = count ?? items.length;
    const totalPages = Math.ceil(total / pageSize);

    const result: PaginatedResult<AuditLogEntry> = {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
