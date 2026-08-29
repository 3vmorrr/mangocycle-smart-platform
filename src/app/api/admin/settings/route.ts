import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { systemSettingsSchema } from "@/lib/validators/admin";
import { recordAuditLog } from "@/lib/audit/logger";
import { SystemSettingsState } from "@/data/contracts/admin";

const DEFAULT_SETTINGS: SystemSettingsState = {
  platformName: "MangoCycle Smart Platform",
  organizationName: "Areej Bio-Industrial Labs",
  contactEmail: "admin@mangocycle.org",
  publicTraceabilityEnabled: true,
  scientificFormulasPending: true,
  totalWasteProcessedFormulaStatus: "pending_definition",
  biologicalYieldFormulaStatus: "pending_definition",
  updatedAt: new Date().toISOString(),
};

export async function GET(): Promise<NextResponse> {
  try {
    // 07-AUTH-AND-RBAC.md: System settings are restricted to Super Admin
    await requireMinimumRole("super_admin");

    const admin = createAdminSupabaseClient();
    const { data: rows, error } = await admin.from("app_settings").select("key, value, updated_at");

    if (error) {
      throw new Error(`Failed to load system settings: ${error.message}`);
    }

    const settingsMap = new Map<string, unknown>();
    let latestUpdatedAt = DEFAULT_SETTINGS.updatedAt;

    for (const r of rows || []) {
      settingsMap.set(r.key, r.value);
      if (r.updated_at && r.updated_at > latestUpdatedAt) {
        latestUpdatedAt = r.updated_at;
      }
    }

    const settings: SystemSettingsState = {
      platformName: (settingsMap.get("platform_name") as string) || DEFAULT_SETTINGS.platformName,
      organizationName: (settingsMap.get("organization_name") as string) || DEFAULT_SETTINGS.organizationName,
      contactEmail: (settingsMap.get("contact_email") as string) || DEFAULT_SETTINGS.contactEmail,
      publicTraceabilityEnabled:
        settingsMap.get("public_traceability_enabled") !== undefined
          ? Boolean(settingsMap.get("public_traceability_enabled"))
          : DEFAULT_SETTINGS.publicTraceabilityEnabled,
      scientificFormulasPending: true,
      totalWasteProcessedFormulaStatus: "pending_definition",
      biologicalYieldFormulaStatus: "pending_definition",
      updatedAt: latestUpdatedAt,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const actor = await requireMinimumRole("super_admin");

    const body = await request.json();
    const input = systemSettingsSchema.parse(body);

    const admin = createAdminSupabaseClient();

    // Fetch existing settings before update for audit & rollback
    const { data: existingRows } = await admin.from("app_settings").select("key, value");
    const beforeMap: Record<string, unknown> = {};
    for (const r of existingRows || []) {
      beforeMap[r.key] = r.value;
    }

    const updates = [
      { key: "platform_name", value: input.platformName, updated_by: actor.id, updated_at: new Date().toISOString() },
      { key: "organization_name", value: input.organizationName, updated_by: actor.id, updated_at: new Date().toISOString() },
      { key: "contact_email", value: input.contactEmail, updated_by: actor.id, updated_at: new Date().toISOString() },
      { key: "public_traceability_enabled", value: input.publicTraceabilityEnabled, updated_by: actor.id, updated_at: new Date().toISOString() },
    ];

    // Upsert settings in database
    const { error: upsertErr } = await admin.from("app_settings").upsert(updates, { onConflict: "key" });
    if (upsertErr) {
      throw new Error(`Failed to persist system settings: ${upsertErr.message}`);
    }

    // Mandatory Audit Logging with Compensating Rollback
    try {
      await recordAuditLog({
        actorId: actor.id,
        action: "settings.updated",
        entityType: "app_settings",
        entityId: null,
        beforeValue: beforeMap,
        afterValue: {
          platform_name: input.platformName,
          organization_name: input.organizationName,
          contact_email: input.contactEmail,
          public_traceability_enabled: input.publicTraceabilityEnabled,
        },
      });
    } catch {
      // Rollback database update: restore previous settings
      if (Object.keys(beforeMap).length > 0) {
        const rollbackRows = Object.entries(beforeMap).map(([k, v]) => ({
          key: k,
          value: v,
          updated_by: actor.id,
          updated_at: new Date().toISOString(),
        }));
        await admin.from("app_settings").upsert(rollbackRows, { onConflict: "key" });
      }
      return NextResponse.json(
        { error: "Mandatory audit record could not be persisted. Settings update rolled back." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...input,
        scientificFormulasPending: true,
        totalWasteProcessedFormulaStatus: "pending_definition",
        biologicalYieldFormulaStatus: "pending_definition",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
