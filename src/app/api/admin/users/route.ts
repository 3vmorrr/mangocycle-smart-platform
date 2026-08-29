import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { USER_ROLES } from "@/data/contracts/auth";
import { createUserSchema } from "@/lib/validators/admin";
import { requireMinimumRole } from "@/lib/auth/server";
import { mapProfile } from "@/lib/auth/profile";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const filtersSchema = z.object({
  role: z.enum([...USER_ROLES, "all"] as const).default("all"),
  isActive: z.enum(["true", "false", "all"]).default("all"),
  search: z.string().max(200).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    await requireMinimumRole("admin");
    const parsed = filtersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const supabase = createServerSupabaseClient();
    const from = (parsed.page - 1) * parsed.pageSize;
    let query = supabase
      .from("profiles")
      .select("id,email,full_name,role,avatar_url,is_active,created_at,updated_at", { count: "exact" });
    if (parsed.role !== "all") query = query.eq("role", parsed.role);
    if (parsed.isActive !== "all") query = query.eq("is_active", parsed.isActive === "true");
    const safeSearch = parsed.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) query = query.or(`email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
    const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + parsed.pageSize - 1);
    if (error) throw new Error("User directory query failed.");
    const total = count ?? 0;
    return NextResponse.json({
      items: (data ?? []).map(mapProfile),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: Math.ceil(total / parsed.pageSize),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = await requireMinimumRole("admin");
    const input = createUserSchema.parse(await request.json());
    if (input.role === "super_admin" && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Only a Super Admin may assign that role." }, { status: 403 });
    }

    const admin = createAdminSupabaseClient();
    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.fullName },
    });
    if (inviteError || !invite.user) {
      return NextResponse.json({ error: "The account invitation could not be created." }, { status: 400 });
    }

    const userClient = createServerSupabaseClient();
    const { data: managed, error: manageError } = await userClient.rpc("manage_profile", {
      p_target_id: invite.user.id,
      p_full_name: input.fullName,
      p_role: input.role,
      p_is_active: true,
    });
    if (manageError || !managed) {
      return NextResponse.json({
        error: "Invitation created as Viewer, but the requested profile assignment failed safely.",
      }, { status: 409 });
    }

    try {
      const { recordAuditLog } = await import("@/lib/audit/logger");
      await recordAuditLog({
        actorId: actor.id,
        action: "user.created",
        entityType: "profile",
        entityId: invite.user.id,
        afterValue: { role: input.role, invitation: true },
      });
    } catch {
      // Compensating rollback: delete invited auth user & profile to prevent un-audited accounts
      await admin.auth.admin.deleteUser(invite.user.id);
      await admin.from("profiles").delete().eq("id", invite.user.id);
      return NextResponse.json(
        { error: "Mandatory audit record could not be persisted. User creation rolled back." },
        { status: 500 }
      );
    }
    return NextResponse.json({ user: mapProfile(managed) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
