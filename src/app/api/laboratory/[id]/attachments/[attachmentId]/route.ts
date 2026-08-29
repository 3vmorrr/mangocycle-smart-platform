import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    // Restrictive researcher+ policy for attachments per 08-SECURITY.md & B2 decision
    await requireMinimumRole("researcher");
    const { id: testId, attachmentId } = await context.params;
    const supabase = createServerSupabaseClient();

    const { data: attachment, error: attError } = await supabase
      .from("laboratory_attachments")
      .select("id, test_id, file_name, file_path")
      .eq("id", attachmentId)
      .eq("test_id", testId)
      .single();

    if (attError || !attachment) {
      return NextResponse.json(
        { error: "Laboratory attachment not found." },
        { status: 404 }
      );
    }

    // Generate short-lived signed URL (60 seconds validity)
    const { data: signedData, error: signError } = await supabase.storage
      .from("laboratory-attachments")
      .createSignedUrl(attachment.file_path, 60);

    if (signError || !signedData?.signedUrl) {
      throw new Error(signError?.message || "Failed to generate authorized download link.");
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      fileName: attachment.file_name,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("researcher");
    const { attachmentId } = await context.params;
    const supabase = createServerSupabaseClient();

    // 1. Delete metadata record via RPC (returns deleted row with file_path)
    const { data: deleted, error: deleteError } = await supabase.rpc(
      "delete_laboratory_attachment",
      { p_attachment_id: attachmentId }
    );

    if (deleteError || !deleted) {
      throw new Error(deleteError?.message || "Failed to delete attachment metadata.");
    }

    // 2. Remove physical object from Supabase Storage
    if (deleted.file_path) {
      await supabase.storage
        .from("laboratory-attachments")
        .remove([deleted.file_path])
        .catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
