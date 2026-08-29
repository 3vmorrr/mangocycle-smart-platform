import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";

export async function GET(req: NextRequest) {
  try {
    await requireMinimumRole("viewer");
    const supabase = createServerSupabaseClient();

    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("iot_weight_readings")
      .select(`
        id,
        device_id,
        weight_kg,
        recorded_at,
        created_at,
        iot_devices (device_code)
      `)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq("device_id", deviceId);
    }
    if (startDate) {
      query = query.gte("recorded_at", startDate);
    }
    if (endDate) {
      query = query.lte("recorded_at", endDate);
    }

    const { data: readings, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (readings || []).map((r) => {
      const dev = r.iot_devices as unknown as { device_code?: string } | null;
      return {
        id: r.id,
        deviceId: r.device_id,
        deviceCode: dev?.device_code || "Unknown Device",
        weightKg: Number(r.weight_kg),
        recordedAt: r.recorded_at,
        source: "hardware_prototype" as const,
        createdAt: r.created_at,
        updatedAt: r.created_at,
      };
    });

    return NextResponse.json(items);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Unauthorized") || err.message.includes("Active account required")) {
        return NextResponse.json({ error: err.message }, { status: 401 });
      }
      if (err.message.includes("Insufficient permissions")) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load IoT readings" },
      { status: 500 }
    );
  }
}
