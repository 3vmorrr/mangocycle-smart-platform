import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { generateDeviceApiKey } from "@/lib/iot/auth";
import { provisionDeviceSchema } from "@/lib/validators/iot";

export async function GET() {
  try {
    await requireMinimumRole("viewer");
    const supabase = createServerSupabaseClient();

    const { data: devices, error } = await supabase
      .from("iot_devices")
      .select("id, device_code, name, location, is_active, last_seen_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch latest reading for each device
    const deviceIds = (devices || []).map((d) => d.id);
    const latestReadingsMap = new Map<string, { weight_kg: number; recorded_at: string }>();

    if (deviceIds.length > 0) {
      const { data: readings } = await supabase
        .from("iot_weight_readings")
        .select("device_id, weight_kg, recorded_at")
        .in("device_id", deviceIds)
        .order("recorded_at", { ascending: false });

      if (readings) {
        for (const r of readings) {
          if (!latestReadingsMap.has(r.device_id)) {
            latestReadingsMap.set(r.device_id, {
              weight_kg: Number(r.weight_kg),
              recorded_at: r.recorded_at,
            });
          }
        }
      }
    }

    const items = (devices || []).map((d) => {
      const latest = latestReadingsMap.get(d.id);
      return {
        id: d.id,
        deviceCode: d.device_code,
        name: d.name || null,
        location: d.location || null,
        isActive: d.is_active,
        lastSeenAt: d.last_seen_at || null,
        latestReadingKg: latest ? latest.weight_kg : null,
        latestReadingAt: latest ? latest.recorded_at : null,
        status: d.is_active ? "active" : "inactive",
        createdAt: d.created_at,
        updatedAt: d.updated_at,
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
      { error: err instanceof Error ? err.message : "Failed to load IoT devices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireMinimumRole("admin");
    const supabase = createServerSupabaseClient();

    const body = await req.json();
    const parsed = provisionDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid device configuration", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { device_code, name, location } = parsed.data;

    // Check if device_code already exists
    const { data: existing } = await supabase
      .from("iot_devices")
      .select("id")
      .eq("device_code", device_code.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Device with code '${device_code}' already exists` },
        { status: 409 }
      );
    }

    // Generate secure random API key and store its SHA-256 hash
    const { apiKey, apiKeyHash } = generateDeviceApiKey();

    const { data: newDevice, error: insertErr } = await supabase
      .from("iot_devices")
      .insert({
        device_code: device_code.trim(),
        name: name?.trim() || null,
        location: location?.trim() || null,
        api_key_hash: apiKeyHash,
        is_active: true,
      })
      .select("id, device_code, name, location, is_active, created_at")
      .single();

    if (insertErr || !newDevice) {
      return NextResponse.json(
        { error: `Failed to create device: ${insertErr?.message}` },
        { status: 500 }
      );
    }

    // Mandatory fail-closed audit logging with compensating rollback
    try {
      const { recordAuditLog } = await import("@/lib/audit/logger");
      await recordAuditLog({
        actorId: actor.id,
        action: "iot.device_created",
        entityType: "iot_device",
        entityId: newDevice.id,
        afterValue: { device_code: newDevice.device_code, name: newDevice.name },
      });
    } catch {
      // Compensating rollback: delete newly inserted device if audit fails
      await supabase.from("iot_devices").delete().eq("id", newDevice.id);
      return NextResponse.json(
        { error: "Mandatory audit record could not be persisted. Device creation rolled back." },
        { status: 500 }
      );
    }

    // Return the plaintext apiKey ONCE to the authorized admin
    return NextResponse.json(
      {
        success: true,
        device: {
          id: newDevice.id,
          deviceCode: newDevice.device_code,
          name: newDevice.name,
          location: newDevice.location,
          isActive: newDevice.is_active,
          createdAt: newDevice.created_at,
        },
        apiKey, // Displayed once for ESP32 config.h setup
        warning: "Copy this API key now. It will not be shown again and is never stored in plaintext.",
      },
      { status: 201 }
    );
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
      { error: err instanceof Error ? err.message : "Failed to provision IoT device" },
      { status: 500 }
    );
  }
}
