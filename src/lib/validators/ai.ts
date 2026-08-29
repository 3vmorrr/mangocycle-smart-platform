import { z } from "zod";

/**
 * AI Waste Visual Analyzer Validation Schemas per 16-AI-WASTE-ANALYZER.md §5
 */
export const wasteImageUploadSchema = z.object({
  fileSize: z
    .number()
    .max(5 * 1024 * 1024, "Image file size must not exceed 5 MB"),
  mimeType: z.enum(
    ["image/jpeg", "image/png", "image/webp"],
    {
      errorMap: () => ({
        message: "Only JPEG, PNG, and WebP image formats are supported.",
      }),
    }
  ),
});

export const wasteVisualAnalysisOutputSchema = z.object({
  waste_type: z.enum(["mango_peel", "mango_seed", "mixed_mango_waste", "unknown"]),
  visual_condition: z.enum(["good", "moderate", "poor", "unknown"]),
  visible_discoloration: z.enum(["none", "minor", "moderate", "severe", "unknown"]),
  visible_surface_irregularities: z.enum(["none", "minor", "moderate", "severe", "unknown"]),
  visible_findings: z.array(z.string()).max(10),
  manual_review_recommended: z.boolean(),
  confidence_note: z.string().max(500),
});

/**
 * Ask MangoCycle Query Validation per 18-ASK-MANGOCYCLE.md §4.4
 */
export const askMangoCycleQuerySchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty")
    .max(500, "Question must not exceed 500 characters"),
});
