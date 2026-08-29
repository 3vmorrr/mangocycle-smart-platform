import { z } from "zod";

/**
 * Waste Batch Zod validation schema matching 25-VALIDATION-RULES.md §2
 */

export const wasteBatchFormSchema = z.object({
  waste_type: z.enum(["mango_peel", "mango_seed", "mixed_mango_waste"], {
    required_error: "Waste type is required",
  }),
  source_id: z.string().nullable().optional(),
  weight_kg: z.coerce
    .number({ invalid_type_error: "Weight must be a valid number" })
    .positive("Weight must be greater than 0 kg")
    .max(10000, "Weight cannot exceed 10,000 kg"),
  collection_date: z
    .string()
    .min(1, "Collection date is required")
    .refine((val) => {
      const d = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !isNaN(d.getTime()) && d <= today;
    }, "Collection date cannot be in the future"),
  location: z.string().max(500, "Location cannot exceed 500 characters").nullable().optional(),
  visual_condition: z.enum(["good", "moderate", "poor"]).nullable().optional(),
  moisture_status: z.enum(["dry", "moderate", "high"]).nullable().optional(),
  storage_duration_days: z.coerce
    .number({ invalid_type_error: "Storage duration must be a number" })
    .int("Storage duration must be an integer")
    .min(0, "Storage duration cannot be negative")
    .nullable()
    .optional(),
  notes: z.string().max(2000, "Notes cannot exceed 2,000 characters").nullable().optional(),
});

export type WasteBatchFormInput = z.infer<typeof wasteBatchFormSchema>;

export const stageAdvanceSchema = z.object({
  notes: z.string().max(1000, "Stage notes cannot exceed 1,000 characters").nullable().optional(),
});

export type StageAdvanceInput = z.infer<typeof stageAdvanceSchema>;
