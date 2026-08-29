import { SupabaseClient } from "@supabase/supabase-js";
import { SustainabilityCalculatedMetrics } from "@/data/contracts/ai";

const WASTE_TYPE_LABELS: Record<string, string> = {
  mango_peel: "Mango Peel",
  mango_seed: "Mango Seed",
  mixed_mango_waste: "Mixed Mango Waste",
};

export async function calculateSustainabilityMetrics(
  supabase: SupabaseClient,
  period?: string
): Promise<SustainabilityCalculatedMetrics> {
  let query = supabase
    .from("waste_batches")
    .select(`
      weight_kg,
      waste_type,
      current_status,
      collection_date,
      waste_sources (name)
    `);

  if (period && period !== "all") {
    // Format "YYYY-MM"
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (!isNaN(year) && !isNaN(month)) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endMonth = month === 12 ? 1 : month + 1;
      const endYear = month === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      query = query.gte("collection_date", startDate).lt("collection_date", endDate);
    }
  }

  const { data: batches, error } = await query;
  if (error) {
    throw new Error(`Failed to calculate sustainability metrics: ${error.message}`);
  }

  const { count: productCount } = await supabase
    .from("product_batches")
    .select("*", { count: "exact", head: true });

  const totalWasteCollectedKg = (batches || []).reduce(
    (sum, b) => sum + Number(b.weight_kg || 0),
    0
  );

  // Canonical B6.1 Waste Diverted: sum of intake weight for all batches including rejected
  const completedBatches = (batches || []).filter((b) => b.current_status === "completed").length;
  const activeBatches = (batches || []).filter(
    (b) => b.current_status !== "completed" && b.current_status !== "rejected"
  ).length;

  // Group by Source
  const sourceWeights: Record<string, number> = {};
  for (const b of batches || []) {
    const src = b.waste_sources as unknown as { name: string } | null;
    const name = src?.name || "Unassigned Source";
    sourceWeights[name] = (sourceWeights[name] || 0) + Number(b.weight_kg || 0);
  }

  const wasteBySource = Object.entries(sourceWeights)
    .map(([sourceName, weightKg]) => ({ sourceName, weightKg: Number(weightKg.toFixed(2)) }))
    .sort((a, b) => b.weightKg - a.weightKg);

  const topSource = wasteBySource[0]
    ? { name: wasteBySource[0].sourceName, weightKg: wasteBySource[0].weightKg }
    : null;

  // Group by Waste Type
  const typeWeights: Record<string, number> = {};
  for (const b of batches || []) {
    typeWeights[b.waste_type] = (typeWeights[b.waste_type] || 0) + Number(b.weight_kg || 0);
  }

  const wasteByType = Object.entries(typeWeights).map(([wasteType, weightKg]) => {
    return {
      wasteType,
      label: WASTE_TYPE_LABELS[wasteType] || wasteType,
      weightKg: Number(weightKg.toFixed(2)),
    };
  });

  return {
    totalWasteCollectedKg: Number(totalWasteCollectedKg.toFixed(2)),
    totalWasteProcessedKg: null, // Formula Pending per governance
    totalBatches: batches?.length || 0,
    completedBatches,
    activeBatches,
    productBatchesCount: productCount || 0,
    wasteBySource,
    wasteByType,
    topSource,
  };
}
