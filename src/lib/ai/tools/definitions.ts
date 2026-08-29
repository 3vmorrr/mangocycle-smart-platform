import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export const ASK_MANGOCYCLE_TOOLS: ToolDefinition[] = [
  {
    name: "get_total_waste",
    description: "Get the total weight in kilograms of mango waste collected in the platform.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["week", "month", "year", "all"],
          description: "Time period to filter by. Defaults to all.",
        },
      },
    },
  },
  {
    name: "get_batches_by_status",
    description: "Get count and list of waste batches filtered by current workflow status.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Stage/status to filter by (e.g., 'collected', 'sorted', 'dried', 'ground', 'extracted', 'completed', 'rejected').",
        },
        limit: {
          type: "number",
          description: "Maximum number of batch items to return (1-20).",
        },
      },
      required: ["status"],
    },
  },
  {
    name: "get_batch_details",
    description: "Get detailed operational information for a specific waste batch by its batch code (e.g. MW-2026-001).",
    parameters: {
      type: "object",
      properties: {
        batch_code: {
          type: "string",
          description: "The waste batch code.",
        },
      },
      required: ["batch_code"],
    },
  },
  {
    name: "get_waste_by_source",
    description: "Get total waste weight grouped and ranked by collection source/supplier.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Optional time period filter ('month', 'all').",
        },
      },
    },
  },
  {
    name: "get_waste_by_type",
    description: "Get total waste weight grouped by waste type (mango_peel, mango_seed, mixed_mango_waste).",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Optional time period filter.",
        },
      },
    },
  },
  {
    name: "get_product_batch_details",
    description: "Get operational details for a specific finished product batch by its batch code (e.g. BF-2026-001).",
    parameters: {
      type: "object",
      properties: {
        batch_code: {
          type: "string",
          description: "The product batch code.",
        },
      },
      required: ["batch_code"],
    },
  },
  {
    name: "get_product_batches_summary",
    description: "Get a summary of product batches with optional status filter.",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Optional status filter ('planned', 'in_production', 'completed', 'quarantine', 'released').",
        },
        limit: {
          type: "number",
          description: "Maximum items to return (1-20).",
        },
      },
    },
  },
  {
    name: "get_dashboard_metrics",
    description: "Get current platform dashboard KPI metrics including Total Waste Collected and Waste Diverted.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Optional period filter ('7d', '30d', 'all').",
        },
      },
    },
  },
  {
    name: "get_recent_lab_results",
    description: "Get recent completed laboratory test summaries excluding private researcher notes and private file paths.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum test summaries to return (1-10).",
        },
      },
    },
  },
  {
    name: "get_batch_count",
    description: "Get the total count of waste batches matching criteria (status or waste type).",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Optional status to filter by.",
        },
        waste_type: {
          type: "string",
          description: "Optional waste type to filter by.",
        },
      },
    },
  },
];

// Zod schemas for tool parameters
export const toolInputSchemas = {
  get_total_waste: z.object({
    period: z.enum(["week", "month", "year", "all"]).optional().default("all"),
  }),
  get_batches_by_status: z.object({
    status: z.string().min(1),
    limit: z.number().int().min(1).max(20).optional().default(10),
  }),
  get_batch_details: z.object({
    batch_code: z.string().min(1),
  }),
  get_waste_by_source: z.object({
    period: z.string().optional(),
  }),
  get_waste_by_type: z.object({
    period: z.string().optional(),
  }),
  get_product_batch_details: z.object({
    batch_code: z.string().min(1),
  }),
  get_product_batches_summary: z.object({
    status: z.string().optional(),
    limit: z.number().int().min(1).max(20).optional().default(10),
  }),
  get_dashboard_metrics: z.object({
    period: z.string().optional(),
  }),
  get_recent_lab_results: z.object({
    limit: z.number().int().min(1).max(10).optional().default(5),
  }),
  get_batch_count: z.object({
    status: z.string().optional(),
    waste_type: z.string().optional(),
  }),
};

export const ALLOWED_TOOL_NAMES = ASK_MANGOCYCLE_TOOLS.map((t) => t.name);

export function isToolAllowed(name: string): boolean {
  return ALLOWED_TOOL_NAMES.includes(name);
}

