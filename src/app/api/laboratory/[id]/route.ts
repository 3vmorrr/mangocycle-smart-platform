import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole, getAuthenticatedProfile } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { laboratoryTestBaseSchema } from "@/lib/validators/laboratory";
import {
  mapLaboratoryTest,
  mapLaboratoryAttachment,
  DbLaboratoryTestRow,
  DbLaboratoryAttachmentRow,
} from "@/lib/laboratory/mapping";
import { hasMinimumRole } from "@/lib/constants/navigation";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireMinimumRole("viewer");
    const { id: testId } = await context.params;
    const supabase = createServerSupabaseClient();
    const profile = await getAuthenticatedProfile();

    const { data: testData, error: testError } = await supabase
      .from("laboratory_tests")
      .select(`
        id,
        test_type,
        waste_batch_id,
        product_batch_id,
        test_date,
        status,
        result_summary,
        numeric_result,
        result_unit,
        researcher_notes,
        created_by,
        created_at,
        updated_at,
        creator:profiles!laboratory_tests_created_by_fkey(full_name),
        waste_batch:waste_batches!laboratory_tests_waste_batch_id_fkey(batch_code),
        product_batch:product_batches!laboratory_tests_product_batch_id_fkey(batch_code)
      `)
      .eq("id", testId)
      .single();

    if (testError || !testData) {
      return NextResponse.json(
        { error: `Laboratory test record "${testId}" not found.` },
        { status: 404 }
      );
    }

    const rawTest = testData as unknown as DbLaboratoryTestRow;

    // Attachments are restricted to researcher+ per 08-SECURITY.md & B2 decision
    let attachments: ReturnType<typeof mapLaboratoryAttachment>[] = [];
    if (profile && hasMinimumRole(profile.role, "researcher")) {
      const { data: attData } = await supabase
        .from("laboratory_attachments")
        .select(`
          id,
          test_id,
          file_name,
          file_path,
          file_size_bytes,
          mime_type,
          uploaded_by,
          created_at
        `)
        .eq("test_id", testId)
        .order("created_at", { ascending: true });

      attachments = ((attData ?? []) as unknown as DbLaboratoryAttachmentRow[]).map(
        mapLaboratoryAttachment
      );
    }

    return NextResponse.json({ test: mapLaboratoryTest(rawTest, attachments) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("researcher");
    const { id: testId } = await context.params;
    const body = await request.json();
    const updateInput = laboratoryTestBaseSchema.partial().parse(body);

    const supabase = createServerSupabaseClient();

    const { data: updated, error: updateError } = await supabase.rpc(
      "update_laboratory_test",
      {
        p_test_id: testId,
        p_test_type: updateInput.test_type || null,
        p_waste_batch_id: updateInput.waste_batch_id || null,
        p_product_batch_id: updateInput.product_batch_id || null,
        p_test_date: updateInput.test_date || null,
        p_status: updateInput.status || null,
        p_result_summary: updateInput.result_summary || null,
        p_numeric_result: updateInput.numeric_result ?? null,
        p_result_unit: updateInput.result_unit || null,
        p_researcher_notes: updateInput.researcher_notes || null,
      }
    );

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to update laboratory test.");
    }

    // Fetch full enriched test with relations
    const { data: fullTest, error: fetchError } = await supabase
      .from("laboratory_tests")
      .select(`
        id,
        test_type,
        waste_batch_id,
        product_batch_id,
        test_date,
        status,
        result_summary,
        numeric_result,
        result_unit,
        researcher_notes,
        created_by,
        created_at,
        updated_at,
        creator:profiles!laboratory_tests_created_by_fkey(full_name),
        waste_batch:waste_batches!laboratory_tests_waste_batch_id_fkey(batch_code),
        product_batch:product_batches!laboratory_tests_product_batch_id_fkey(batch_code)
      `)
      .eq("id", testId)
      .single();

    if (fetchError || !fullTest) {
      throw new Error("Failed to load updated laboratory test details.");
    }

    const { data: attData } = await supabase
      .from("laboratory_attachments")
      .select(`
        id,
        test_id,
        file_name,
        file_path,
        file_size_bytes,
        mime_type,
        uploaded_by,
        created_at
      `)
      .eq("test_id", testId)
      .order("created_at", { ascending: true });

    const attachments = ((attData ?? []) as unknown as DbLaboratoryAttachmentRow[]).map(
      mapLaboratoryAttachment
    );

    return NextResponse.json({
      test: mapLaboratoryTest(fullTest as unknown as DbLaboratoryTestRow, attachments),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("admin");
    const { id: testId } = await context.params;
    const supabase = createServerSupabaseClient();

    // Call atomic delete RPC which removes metadata and returns file paths for storage cleanup
    const { data: filePaths, error: deleteError } = await supabase.rpc(
      "delete_laboratory_test",
      { p_test_id: testId }
    );

    if (deleteError) {
      throw new Error(deleteError.message || "Failed to delete laboratory test.");
    }

    // Clean up physical files from Supabase Storage if any attachments existed
    const paths = (filePaths ?? []) as string[];
    if (paths.length > 0) {
      try {
        await supabase.storage.from("laboratory-attachments").remove(paths);
      } catch {
        // Storage cleanup error logged; DB hard delete succeeded
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
