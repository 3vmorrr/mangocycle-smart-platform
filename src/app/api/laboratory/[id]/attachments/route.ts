import { NextRequest, NextResponse } from "next/server";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  mapLaboratoryAttachment,
  DbLaboratoryAttachmentRow,
} from "@/lib/laboratory/mapping";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit per 14-LABORATORY-MODULE.md §3.2

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("researcher");
    const { id: testId } = await context.params;
    const supabase = createServerSupabaseClient();

    // Verify test exists
    const { data: test, error: testErr } = await supabase
      .from("laboratory_tests")
      .select("id")
      .eq("id", testId)
      .single();

    if (testErr || !test) {
      return NextResponse.json({ error: "Laboratory test not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided in request." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Cannot upload an empty file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 10 MB maximum limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file format "${mimeType}". Allowed types: PDF, JPEG, PNG, TIFF, CSV, XLSX.` },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeFileName(file.name || "attachment");
    const uniqueStorageKey = `${testId}/${crypto.randomUUID()}-${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Upload to Supabase Storage private bucket
    const { error: uploadError } = await supabase.storage
      .from("laboratory-attachments")
      .upload(uniqueStorageKey, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Insert metadata record in laboratory_attachments via atomic RPC
    const { data: attData, error: insertError } = await supabase.rpc(
      "add_laboratory_attachment",
      {
        p_test_id: testId,
        p_file_name: file.name,
        p_file_path: uniqueStorageKey,
        p_file_size_bytes: file.size,
        p_mime_type: mimeType,
      }
    );

    if (insertError || !attData) {
      // Compensating action: Clean up uploaded physical file from storage
      await supabase.storage
        .from("laboratory-attachments")
        .remove([uniqueStorageKey])
        .catch(() => {});

      throw new Error(insertError?.message || "Failed to record attachment metadata.");
    }

    return NextResponse.json(
      { attachment: mapLaboratoryAttachment(attData as unknown as DbLaboratoryAttachmentRow) },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
