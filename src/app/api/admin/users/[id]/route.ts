import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateUserSchema } from "@/lib/validators/admin";
import { requireMinimumRole } from "@/lib/auth/server";
import { mapProfile } from "@/lib/auth/profile";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole("admin");
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,avatar_url,is_active,created_at,updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    return NextResponse.json({ user: mapProfile(data) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("admin");
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);
    const input = updateUserSchema.refine((value) => Object.keys(value).length > 0, "No changes supplied.").parse(await request.json());
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("manage_profile", {
      p_target_id: id,
      p_full_name: input.fullName ?? null,
      p_role: input.role ?? null,
      p_is_active: input.isActive ?? null,
    });
    if (error || !data) {
      return NextResponse.json({ error: "Profile change was rejected by the authorization boundary." }, { status: 403 });
    }
    return NextResponse.json({ user: mapProfile(data) });
  } catch (error) {
    return jsonError(error);
  }
}
