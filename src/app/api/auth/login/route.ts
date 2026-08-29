import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/auth/profile";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = loginSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,avatar_url,is_active,created_at,updated_at")
      .eq("id", authData.user.id)
      .single();
    if (error || !data) {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json({ error: "No application profile is available." }, { status: 403 });
    }
    const profile = mapProfile(data);
    if (!profile.isActive) {
      await supabase.auth.signOut({ scope: "local" });
      return NextResponse.json({ error: "This account is inactive." }, { status: 403 });
    }
    return NextResponse.json({ user: profile }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
