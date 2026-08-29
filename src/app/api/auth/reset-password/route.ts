import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { password } = resetPasswordSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "The recovery session is missing or expired." }, { status: 401 });
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return NextResponse.json({ error: "Password could not be updated." }, { status: 400 });
    await supabase.auth.signOut({ scope: "global" });
    return NextResponse.json({ message: "Password updated. Sign in again with your new password." });
  } catch (error) {
    return jsonError(error);
  }
}
