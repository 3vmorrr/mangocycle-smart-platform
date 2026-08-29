import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateDeviceApiKey } from "@/lib/iot/auth";
import { recordAuditLog } from "@/lib/audit/logger";

const uuidSchema = z.string().uuid();

const updateDeviceSchema = z.object({
  name: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  regenerateKey: z.boolean().optional(),
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireMinimumRole("viewer");
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);
    const supabase = createServerSupabaseClient();

    const { data: device, error } = await supabase
      .from("iot_devices")
      .select("id, device_code, name, location, is_active, last_seen_at, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: "IoT device not found." }, { status: 404 });
    }

    return NextResponse.json({
      device: {
        id: device.id,
        deviceCode: device.device_code,
        name: device.name,
        location: device.location,
        isActive: device.is_active,
        lastSeenAt: device.last_seen_at,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireMinimumRole("admin");
    const { id: rawId } = await context.params;
    const id = uuidSchema.parse(rawId);

    const body = await request.json();
    const input = updateDeviceSchema.parse(body);

    const admin = createAdminSupabaseClient();

    // Fetch existing device state
    const { data: existing, error: fetchErr } = await admin
      .from("iot_devices")
      .select("id, device_code, name, location, is_active, api_key_hash")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "IoT device not found." }, { status: 404 });
    }

    let newlyGeneratedApiKey: string | null = null;
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name.trim() || null;
    if (input.location !== undefined) updateData.location = input.location.trim() || null;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    if (input.regenerateKey) {
      const { apiKey, apiKeyHash } = generateDeviceApiKey();
      updateData.api_key_hash = apiKeyHash;
      newlyGeneratedApiKey = apiKey;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
    }

    // Perform database update
    const { data: updatedDevice, error: updateErr } = await admin
      .from("iot_devices")
      .update(updateData)
      .eq("id", id)
      .select("id, device_code, name, location, is_active, last_seen_at, created_at, updated_at")
      .single();

    if (updateErr || !updatedDevice) {
      return NextResponse.json({ error: `Failed to update IoT device: ${updateErr?.message}` }, { status: 500 });
    }

    // Mandatory Audit Logging with Compensating Rollback
    if (input.isActive === false && existing.is_active === true) {
      try {
        await recordAuditLog({
          actorId: actor.id,
          action: "iot.device_deactivated",
          entityType: "iot_device",
          entityId: id,
          beforeValue: { is_active: true, device_code: existing.device_code },
          afterValue: { is_active: false, device_code: existing.device_code },
        });
      } catch {
        // Rollback deactivation in database
        await admin.from("iot_devices").update({ is_active: true }).eq("id", id);
        return NextResponse.json(
          { error: "Mandatory audit record could not be persisted. Device deactivation rolled back." },
          { status: 500 }
        );
      }
    }

    if (input.regenerateKey) {
      try {
        // Audit payload must NOT contain raw old/new key and NO raw hash
        await recordAuditLog({
          actorId: actor.id,
          action: "iot.key_regenerated",
          entityType: "iot_device",
          entityId: id,
          beforeValue: { device_code: existing.device_code, key_rotation: true },
          afterValue: { device_code: existing.device_code, key_rotation: true },
        });
      } catch {
        // Rollback key rotation: revert to previous api_key_hash
        await admin.from("iot_devices").update({ api_key_hash: existing.api_key_hash }).eq("id", id);
        return NextResponse.json(
          { error: "Mandatory audit record could not be persisted. Key rotation rolled back." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      device: {
        id: updatedDevice.id,
        deviceCode: updatedDevice.device_code,
        name: updatedDevice.name,
        location: updatedDevice.location,
        isActive: updatedDevice.is_active,
        lastSeenAt: updatedDevice.last_seen_at,
        createdAt: updatedDevice.created_at,
        updatedAt: updatedDevice.updated_at,
      },
      apiKey: newlyGeneratedApiKey,
      warning: newlyGeneratedApiKey
        ? "Copy this new API key now. It will not be shown again and is never stored in plaintext."
        : undefined,
    });
  } catch (error) {
    return jsonError(error);
  }
}
