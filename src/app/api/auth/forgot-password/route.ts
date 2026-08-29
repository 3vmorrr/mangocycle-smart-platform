import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getApplicationUrl } from "@/lib/supabase/env";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";

const genericMessage = "If an account matches this email, a secure reset link will be sent.";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { email } = forgotPasswordSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getApplicationUrl()}/auth/callback?next=/reset-password`,
    });
    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) return jsonError(error);
    // Account existence and provider errors are deliberately not disclosed.
    return NextResponse.json({ message: genericMessage });
  }
}
