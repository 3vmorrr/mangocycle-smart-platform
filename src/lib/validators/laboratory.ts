import { z } from "zod";

/**
 * Laboratory Test Validation Schema per 25-VALIDATION-RULES.md §4
 */
export const laboratoryTestBaseSchema = z.object({
  test_type: z
    .string()
    .trim()
    .min(1, "Test type is required")
    .max(100, "Test type cannot exceed 100 characters"),

  waste_batch_id: z.string().trim().optional().nullable().or(z.literal("")),

  product_batch_id: z.string().trim().optional().nullable().or(z.literal("")),

  test_date: z.string().trim().optional().nullable().or(z.literal("")),

  status: z.enum([
    "pending",
    "in_progress",
    "completed",
    "failed",
    "cancelled",
  ]),

  result_summary: z
    .string()
    .max(5000, "Result summary cannot exceed 5,000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  numeric_result: z
    .number()
    .optional()
    .nullable(),

  result_unit: z
    .string()
    .trim()
    .max(50, "Result unit cannot exceed 50 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  researcher_notes: z
    .string()
    .max(5000, "Researcher notes cannot exceed 5,000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const laboratoryTestFormSchema = laboratoryTestBaseSchema.refine(
  (data) => {
    const hasWaste = Boolean(data.waste_batch_id && data.waste_batch_id !== "");
    const hasProduct = Boolean(data.product_batch_id && data.product_batch_id !== "");
    return hasWaste || hasProduct;
  },
  {
    message: "You must link at least one target batch (Waste Batch or Product Batch).",
    path: ["target_batch_selection"],
  }
);

export type LaboratoryTestFormValues = z.infer<typeof laboratoryTestFormSchema>;
