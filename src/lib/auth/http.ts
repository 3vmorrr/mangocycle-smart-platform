import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "./server";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message.includes("not configured")) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: "Request could not be completed." }, { status: 500 });
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (new URL(origin).origin !== request.nextUrl.origin) {
    throw new AuthorizationError("Cross-origin mutation rejected.");
  }
}
