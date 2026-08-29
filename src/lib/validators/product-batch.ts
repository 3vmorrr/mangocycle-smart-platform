import { z } from "zod";

/**
 * Product Batch Validation Schema per 25-VALIDATION-RULES.md §3
 */
export const productBatchFormSchema = z.object({
  product_name: z
    .string()
    .trim()
    .min(1, "Product name is required")
    .max(200, "Product name cannot exceed 200 characters"),

  product_type: z
    .string()
    .trim()
    .max(200, "Product type cannot exceed 200 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  production_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal("")),

  quantity_produced: z
    .number()
    .positive("Quantity produced must be greater than 0")
    .max(100000, "Quantity cannot exceed 100,000")
    .optional()
    .nullable(),

  unit: z
    .string()
    .trim()
    .max(50, "Unit cannot exceed 50 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  status: z.enum([
    "in_production",
    "testing",
    "completed",
    "released",
    "rejected",
  ]),

  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2,000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),

  waste_batch_ids: z
    .array(z.string())
    .min(1, "You must select at least one input waste batch for traceability"),
});

export type ProductBatchFormValues = z.infer<typeof productBatchFormSchema>;
