import { NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProcessingStage } from "@/lib/constants/stages";

export async function GET() {
  try {
    await requireMinimumRole("viewer");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("processing_stages")
      .select("id,name,display_order,description,is_active")
      .order("display_order", { ascending: true });

    if (error) throw new Error("Failed to load processing stages.");

    const items: ProcessingStage[] = (data ?? []).map((row) => ({
      id: row.name as ProcessingStage["id"],
      name: row.name.charAt(0).toUpperCase() + row.name.slice(1).replace(/_/g, " "),
      stageOrder: row.display_order,
      order: row.display_order,
      description: row.description || `Processing stage ${row.display_order}`,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}
