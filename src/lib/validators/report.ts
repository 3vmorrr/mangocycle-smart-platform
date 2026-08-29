import { z } from "zod";

export const generateReportParamsSchema = z
  .object({
    reportType: z.enum(
      [
        "waste_summary",
        "product_traceability",
        "laboratory_summary",
        "sustainability",
        "batch_report",
      ],
      {
        required_error: "Please select a report type.",
      }
    ),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    wasteBatchId: z.string().optional(),
    productBatchId: z.string().optional(),
    includeAiNarrative: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date.",
      path: ["startDate"],
    }
  );
