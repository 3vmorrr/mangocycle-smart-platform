import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMinimumRole } from "@/lib/auth/server";
import { assertSameOrigin, jsonError } from "@/lib/auth/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { laboratoryTestFormSchema } from "@/lib/validators/laboratory";
import {
  mapLaboratoryTest,
  mapLaboratoryTestListItem,
  DbLaboratoryTestRow,
} from "@/lib/laboratory/mapping";

const filtersSchema = z.object({
  search: z.string().max(200).default(""),
  testType: z.string().default("all"),
  status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled", "all"]).default("all"),
  targetBatchType: z.enum(["all", "waste", "product"]).default("all"),
  wasteBatchId: z.string().uuid().optional(),
  productBatchId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    await requireMinimumRole("viewer");
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = filtersSchema.parse(searchParams);
    const supabase = createServerSupabaseClient();
    const from = (parsed.page - 1) * parsed.pageSize;

    let query = supabase
      .from("laboratory_tests")
      .select(
        `
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
      `,
        { count: "exact" }
      );

    if (parsed.status !== "all") query = query.eq("status", parsed.status);
    if (parsed.testType !== "all") query = query.eq("test_type", parsed.testType);
    if (parsed.wasteBatchId) query = query.eq("waste_batch_id", parsed.wasteBatchId);
    if (parsed.productBatchId) query = query.eq("product_batch_id", parsed.productBatchId);

    if (parsed.targetBatchType === "waste") {
      query = query.not("waste_batch_id", "is", null);
    } else if (parsed.targetBatchType === "product") {
      query = query.not("product_batch_id", "is", null);
    }

    const safeSearch = parsed.search.replace(/[%_,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(`test_type.ilike.%${safeSearch}%,result_summary.ilike.%${safeSearch}%,researcher_notes.ilike.%${safeSearch}%`);
    }

    const { data: testsData, count, error } = await query
      .order("test_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + parsed.pageSize - 1);

    if (error) throw new Error("Laboratory test list query failed.");
    const total = count ?? 0;
    const rawTests = (testsData ?? []) as unknown as DbLaboratoryTestRow[];

    // Count attachments for these tests
    const testIds = rawTests.map((t) => t.id);
    const attachmentCounts: Record<string, number> = {};

    if (testIds.length > 0) {
      const { data: attData } = await supabase
        .from("laboratory_attachments")
        .select("test_id")
        .in("test_id", testIds);

      (attData ?? []).forEach((row: { test_id: string }) => {
        attachmentCounts[row.test_id] = (attachmentCounts[row.test_id] || 0) + 1;
      });
    }

    const items = rawTests.map((row) =>
      mapLaboratoryTestListItem(row, attachmentCounts[row.id] ?? 0)
    );

    return NextResponse.json({
      items,
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: Math.ceil(total / parsed.pageSize) || 1,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireMinimumRole("researcher");
    const input = laboratoryTestFormSchema.parse(await request.json());
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.rpc("create_laboratory_test", {
      p_test_type: input.test_type,
      p_waste_batch_id: input.waste_batch_id || null,
      p_product_batch_id: input.product_batch_id || null,
      p_test_date: input.test_date || null,
      p_status: input.status,
      p_result_summary: input.result_summary || null,
      p_numeric_result: input.numeric_result ?? null,
      p_result_unit: input.result_unit || null,
      p_researcher_notes: input.researcher_notes || null,
    });

    if (error || !data) {
      throw new Error(error?.message || "Failed to record laboratory test.");
    }

    const rawCreated = data as unknown as DbLaboratoryTestRow;

    // Fetch batch codes for return object
    let wasteBatchCode: string | null = null;
    let productBatchCode: string | null = null;

    if (rawCreated.waste_batch_id) {
      const { data: wb } = await supabase
        .from("waste_batches")
        .select("batch_code")
        .eq("id", rawCreated.waste_batch_id)
        .single();
      wasteBatchCode = wb?.batch_code ?? null;
    }

    if (rawCreated.product_batch_id) {
      const { data: pb } = await supabase
        .from("product_batches")
        .select("batch_code")
        .eq("id", rawCreated.product_batch_id)
        .single();
      productBatchCode = pb?.batch_code ?? null;
    }

    const testObject = mapLaboratoryTest({
      ...rawCreated,
      waste_batch: wasteBatchCode ? { batch_code: wasteBatchCode } : null,
      product_batch: productBatchCode ? { batch_code: productBatchCode } : null,
    }, []);

    return NextResponse.json({ test: testObject }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
