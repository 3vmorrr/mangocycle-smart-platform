import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { jsonError } from "@/lib/auth/http";

export async function GET() {
  try {
    const user = await getAuthenticatedProfile();
    return NextResponse.json(
      { user, isAuthenticated: Boolean(user?.isActive) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
