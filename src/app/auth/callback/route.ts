import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getApplicationUrl } from "@/lib/supabase/env";

const allowedNextPaths = new Set(["/dashboard", "/reset-password"]);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") || "/dashboard";
  const next = allowedNextPaths.has(requestedNext) ? requestedNext : "/dashboard";
  const origin = getApplicationUrl();

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?auth=callback_error`);
}
