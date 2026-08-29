import { SupabaseClient } from "@supabase/supabase-js";
import { toolInputSchemas } from "./definitions";

export class ToolExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

export async function executeTool(
  supabase: SupabaseClient,
  toolName: string,
  rawArgs: unknown
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case "get_total_waste": {
      const parsed = toolInputSchemas.get_total_waste.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments for get_total_waste: ${parsed.error.message}`);
      }

      let query = supabase.from("waste_batches").select("weight_kg, collection_date");

      if (parsed.data.period === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("collection_date", d.toISOString().split("T")[0]);
      } else if (parsed.data.period === "month") {
        const d = new Date();
        d.setDate(1);
        query = query.gte("collection_date", d.toISOString().split("T")[0]);
      } else if (parsed.data.period === "year") {
        const d = new Date();
        d.setMonth(0, 1);
        query = query.gte("collection_date", d.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw new ToolExecutionError("Failed to query waste data");

      const totalKg = (data || []).reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);
      return {
        period: parsed.data.period,
        total_waste_kg: Number(totalKg.toFixed(2)),
        batch_count: data?.length || 0,
      };
    }

    case "get_batches_by_status": {
      const parsed = toolInputSchemas.get_batches_by_status.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments for get_batches_by_status: ${parsed.error.message}`);
      }

      const { data, error } = await supabase
        .from("waste_batches")
        .select("batch_code, waste_type, weight_kg, current_status, collection_date")
        .eq("current_status", parsed.data.status)
        .order("created_at", { ascending: false })
        .limit(parsed.data.limit);

      if (error) throw new ToolExecutionError("Failed to query batches by status");

      return {
        status: parsed.data.status,
        count: data?.length || 0,
        batches: (data || []).map((b) => ({
          batch_code: b.batch_code,
          waste_type: b.waste_type,
          weight_kg: Number(b.weight_kg),
          current_status: b.current_status,
          collection_date: b.collection_date,
        })),
      };
    }

    case "get_batch_details": {
      const parsed = toolInputSchemas.get_batch_details.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments for get_batch_details: ${parsed.error.message}`);
      }

      const { data, error } = await supabase
        .from("waste_batches")
        .select(`
          batch_code,
          waste_type,
          weight_kg,
          collection_date,
          current_status,
          moisture_status,
          visual_condition,
          waste_sources (name, source_type, location)
        `)
        .eq("batch_code", parsed.data.batch_code.trim())
        .single();

      if (error || !data) {
        return {
          found: false,
          batch_code: parsed.data.batch_code,
          message: "Waste batch not found",
        };
      }

      const sourceData = data.waste_sources as unknown as { name: string; source_type: string; location: string } | null;

      return {
        found: true,
        batch_code: data.batch_code,
        waste_type: data.waste_type,
        weight_kg: Number(data.weight_kg),
        collection_date: data.collection_date,
        current_status: data.current_status,
        moisture_status: data.moisture_status ?? "not recorded",
        visual_condition: data.visual_condition ?? "not recorded",
        source_name: sourceData?.name ?? "Unknown source",
        source_location: sourceData?.location ?? "Unknown",
      };
    }

    case "get_waste_by_source": {
      const { data, error } = await supabase
        .from("waste_batches")
        .select(`
          weight_kg,
          waste_sources (name)
        `);

      if (error) throw new ToolExecutionError("Failed to query waste by source");

      const sourceWeights: Record<string, number> = {};
      for (const row of data || []) {
        const src = row.waste_sources as unknown as { name: string } | null;
        const name = src?.name || "Unassigned";
        sourceWeights[name] = (sourceWeights[name] || 0) + Number(row.weight_kg || 0);
      }

      const sortedSources = Object.entries(sourceWeights)
        .map(([name, weight_kg]) => ({ name, weight_kg: Number(weight_kg.toFixed(2)) }))
        .sort((a, b) => b.weight_kg - a.weight_kg)
        .slice(0, 10);

      return {
        sources: sortedSources,
        top_source: sortedSources[0] || null,
      };
    }

    case "get_waste_by_type": {
      const { data, error } = await supabase
        .from("waste_batches")
        .select("waste_type, weight_kg");

      if (error) throw new ToolExecutionError("Failed to query waste by type");

      const typeWeights: Record<string, number> = {};
      for (const row of data || []) {
        typeWeights[row.waste_type] = (typeWeights[row.waste_type] || 0) + Number(row.weight_kg || 0);
      }

      return {
        types: Object.entries(typeWeights).map(([waste_type, weight_kg]) => ({
          waste_type,
          weight_kg: Number(weight_kg.toFixed(2)),
        })),
      };
    }

    case "get_product_batch_details": {
      const parsed = toolInputSchemas.get_product_batch_details.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments: ${parsed.error.message}`);
      }

      const { data, error } = await supabase
        .from("product_batches")
        .select("batch_code, product_name, product_type, status, quantity, unit, created_at")
        .eq("batch_code", parsed.data.batch_code.trim())
        .single();

      if (error || !data) {
        return {
          found: false,
          batch_code: parsed.data.batch_code,
          message: "Product batch not found",
        };
      }

      return {
        found: true,
        batch_code: data.batch_code,
        product_name: data.product_name,
        product_type: data.product_type,
        status: data.status,
        quantity: Number(data.quantity),
        unit: data.unit,
        created_at: data.created_at,
      };
    }

    case "get_product_batches_summary": {
      const parsed = toolInputSchemas.get_product_batches_summary.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments: ${parsed.error.message}`);
      }

      let query = supabase
        .from("product_batches")
        .select("batch_code, product_name, status, quantity, unit")
        .order("created_at", { ascending: false })
        .limit(parsed.data.limit);

      if (parsed.data.status) {
        query = query.eq("status", parsed.data.status);
      }

      const { data, error } = await query;
      if (error) throw new ToolExecutionError("Failed to query product batches");

      return {
        count: data?.length || 0,
        batches: (data || []).map((p) => ({
          batch_code: p.batch_code,
          product_name: p.product_name,
          status: p.status,
          quantity: Number(p.quantity),
          unit: p.unit,
        })),
      };
    }

    case "get_dashboard_metrics": {
      const { data: wasteData } = await supabase
        .from("waste_batches")
        .select("weight_kg, current_status");

      const { count: productCount } = await supabase
        .from("product_batches")
        .select("*", { count: "exact", head: true });

      const totalWasteCollectedKg = (wasteData || []).reduce(
        (sum, row) => sum + Number(row.weight_kg || 0),
        0
      );

      // Canonical B6.1 Waste Diverted: sum of ALL intake weights including rejected
      const wasteDivertedKg = totalWasteCollectedKg;

      const completedBatches = (wasteData || []).filter((b) => b.current_status === "completed").length;
      const activeBatches = (wasteData || []).filter(
        (b) => b.current_status !== "completed" && b.current_status !== "rejected"
      ).length;

      return {
        total_waste_collected_kg: Number(totalWasteCollectedKg.toFixed(2)),
        waste_diverted_kg: Number(wasteDivertedKg.toFixed(2)),
        total_waste_processed_kg: null, // Formula Pending
        processing_rate_pct: null, // Formula Pending
        biological_yield_pct: null, // Formula Pending
        total_batches: wasteData?.length || 0,
        completed_batches: completedBatches,
        active_batches: activeBatches,
        product_batches_count: productCount || 0,
        note: "Total Waste Processed and Biological Yield are currently marked 'Formula Pending' per governance.",
      };
    }

    case "get_recent_lab_results": {
      const parsed = toolInputSchemas.get_recent_lab_results.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments: ${parsed.error.message}`);
      }

      const { data, error } = await supabase
        .from("laboratory_tests")
        .select("test_type, test_date, status, result_summary, numeric_result, result_unit")
        .order("test_date", { ascending: false })
        .limit(parsed.data.limit);

      if (error) throw new ToolExecutionError("Failed to query laboratory tests");

      // Privacy: strictly exclude researcher_notes and attachment storage paths
      return {
        count: data?.length || 0,
        tests: (data || []).map((t) => ({
          test_type: t.test_type,
          test_date: t.test_date,
          status: t.status,
          result_summary: t.result_summary,
          numeric_result: t.numeric_result ? Number(t.numeric_result) : null,
          result_unit: t.result_unit,
        })),
      };
    }

    case "get_batch_count": {
      const parsed = toolInputSchemas.get_batch_count.safeParse(rawArgs);
      if (!parsed.success) {
        throw new ToolExecutionError(`Invalid arguments: ${parsed.error.message}`);
      }

      let query = supabase.from("waste_batches").select("*", { count: "exact", head: true });
      if (parsed.data.status) {
        query = query.eq("current_status", parsed.data.status);
      }
      if (parsed.data.waste_type) {
        query = query.eq("waste_type", parsed.data.waste_type);
      }

      const { count, error } = await query;
      if (error) throw new ToolExecutionError("Failed to count batches");

      return {
        count: count || 0,
        status_filter: parsed.data.status ?? "all",
        waste_type_filter: parsed.data.waste_type ?? "all",
      };
    }

    default:
      throw new ToolExecutionError(`Unknown tool '${toolName}'. Tool is not registered in allowlist.`);
  }
}
