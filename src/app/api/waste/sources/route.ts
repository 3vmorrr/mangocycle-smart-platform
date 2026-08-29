import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapWasteSource } from "@/lib/waste/mapping";

export async function GET() {
  try {
    await requireMinimumRole("viewer");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("waste_sources")
      .select("id,name,source_type,location,contact_info,is_active,created_at,updated_at")
      .order("name", { ascending: true });

    if (error) throw new Error("Failed to load waste sources.");
    return NextResponse.json({ items: (data ?? []).map(mapWasteSource) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("admin");
    const body = await request.json();
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("waste_sources")
      .insert({
        name: body.name,
        source_type: body.sourceType || body.source_type || "other",
        location: body.location || null,
        contact_info: body.contactInfo || body.contact_info || null,
        is_active: body.isActive !== undefined ? body.isActive : true,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to create waste source.");
    return NextResponse.json({ source: mapWasteSource(data) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
