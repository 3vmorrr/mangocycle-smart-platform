import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { processIoTWeightIngestion } from "@/lib/iot/ingestion";

export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const authHeader = req.headers.get("authorization");

    const result = await processIoTWeightIngestion(supabase, rawBody, authHeader);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (err: unknown) {
    console.error("Unhandled error during IoT ingestion:", err);
    return NextResponse.json(
      { error: "Internal server error during IoT ingestion" },
      { status: 500 }
    );
  }
}
