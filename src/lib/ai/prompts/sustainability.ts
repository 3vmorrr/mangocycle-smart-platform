import { z } from "zod";
import { SustainabilityCalculatedMetrics, AiSustainabilityInsightResponse } from "@/data/contracts/ai";
import { getAIProvider } from "../provider-factory";

export const SUSTAINABILITY_PROMPT_VERSION = "sustainability-insights-v1.0";

export const SUSTAINABILITY_SYSTEM_PROMPT = `You are a sustainability insights narrator for the MangoCycle Smart Platform.

You receive VERIFIED, pre-calculated sustainability metrics from the platform database.
Your task is to generate a concise, professional narrative summary highlighting key valorization achievements and operational throughput.

RULES:
1. ONLY reference the numbers provided in the input metrics. NEVER invent additional data.
2. Use the exact numbers from the input — do not round or adjust values.
3. Focus on platform impact: waste diverted, completed vs active batches, source contributions.
4. Highlight positive trends and operational throughput.
5. Provide 3-5 concise bullet points summarizing the period.
6. Do NOT make claims about carbon savings, CO2 equivalent, water savings, energy savings, carbon credits, or economic profit unless explicitly provided in the input metrics.
7. Return a structured JSON response.

Required JSON format:
{
  "narrativeBullets": [
    "47.5 kg of mango waste has been diverted from disposal through the platform.",
    "..."
  ],
  "aiSummary": "Executive summary paragraph synthesizing key trends..."
}`;

export const sustainabilityOutputSchema = z.object({
  narrativeBullets: z.array(z.string().min(1).max(500)).min(1).max(7),
  aiSummary: z.string().min(1).max(2000),
});

export const FORBIDDEN_SUSTAINABILITY_PATTERNS = [
  /\b\d+(\.\d+)?\s*(kg|tons?|tonnes?)\s*(of\s*)?co2\b/gi,
  /\bco2e?\s*(saved|avoided|reduction|equivalent)\b/gi,
  /\b(reduced\s*emissions?|emission\s*reductions?)\b/gi,
  /\b(carbon\s*benefit|carbon\s*footprint|smaller\s*carbon\s*footprint)\b/gi,
  /\b(carbon\s*credits?|carbon\s*offsets?)\b/gi,
  /\b(saved\s*natural\s*resources?|natural\s*resource\s*savings?)\b/gi,
  /\b(reduced\s*water\s*consumption|water\s*savings?|water\s*saved)\b/gi,
  /\b\d+(\.\d+)?\s*(liters?|gallons?)\s*(of\s*)?water\b/gi,
  /\b(reduced\s*energy\s*consumption|energy\s*savings?|energy\s*saved)\b/gi,
  /\b(financial\s*benefit|cost\s*savings?|monetary\s*savings?)\b/gi,
  /\b(environmental\s*equivalent|climate\s*impact\s*equivalent|climate\s*benefit)\b/gi,
  /\beuro\s*\d+|\$\d+(\.\d+)?\s*(saved|revenue|profit|benefit)/gi,
];

function sanitizeNarrative(bullets: string[], summary: string): { bullets: string[]; summary: string } {
  const sanitizedBullets = bullets
    .map((b) => {
      let text = b;
      for (const pat of FORBIDDEN_SUSTAINABILITY_PATTERNS) {
        text = text.replace(pat, "[metric not authorized by platform governance]");
      }
      return text.trim();
    })
    .filter((b) => b.length > 0);

  let sanitizedSummary = summary;
  for (const pat of FORBIDDEN_SUSTAINABILITY_PATTERNS) {
    sanitizedSummary = sanitizedSummary.replace(pat, "[metric not authorized by platform governance]");
  }

  return { bullets: sanitizedBullets, summary: sanitizedSummary };
}

export function sanitizeSustainabilityNarrative(
  bullets: string[],
  summary = ""
): { bullets: string[]; summary: string } {
  return sanitizeNarrative(bullets, summary);
}


function extractJson(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {
        // continue
      }
    }

    // Fallback: split by lines
    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•\d.]+\s*/, "").trim())
      .filter((l) => l.length > 10);

    return {
      narrativeBullets: lines.length > 0 ? lines : [trimmed],
      aiSummary: trimmed,
    };
  }
}

export async function generateSustainabilityNarrative(
  period: string,
  metrics: SustainabilityCalculatedMetrics
): Promise<AiSustainabilityInsightResponse> {
  const model = process.env.AI_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";

  const userPrompt = `Generate a sustainability narrative for period: ${period}.

Pre-calculated verified platform metrics:
${JSON.stringify(metrics, null, 2)}`;

  let rawContent: string | null = null;
  try {
    const provider = getAIProvider();
    const placeholderImgBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const aiResult = await provider.analyzeImage({
      systemPrompt: SUSTAINABILITY_SYSTEM_PROMPT,
      userPrompt,
      imageMimeType: "image/gif",
      imageBase64: placeholderImgBase64,
      temperature: 0.2,
    });
    rawContent = aiResult.rawContent;
  } catch (err) {
    console.warn("Gemini sustainability generation failed, using deterministic fallback:", err);
  }

  let bullets: string[] = [];
  let summary = "";

  if (rawContent) {
    const parsed = extractJson(rawContent);
    const validated = sustainabilityOutputSchema.safeParse(parsed);
    if (validated.success) {
      bullets = validated.data.narrativeBullets;
      summary = validated.data.aiSummary;
    } else if (typeof parsed === "object" && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      if (Array.isArray(p.narrativeBullets)) {
        bullets = p.narrativeBullets.map(String);
      }
      if (typeof p.aiSummary === "string") {
        summary = p.aiSummary;
      }
    }
  }

  // Graceful fallback if Gemini failed
  if (bullets.length === 0) {
    bullets = [
      `${metrics.totalWasteCollectedKg} kg of mango waste was recorded in the platform.`,
      `${metrics.completedBatches} batches have completed full processing with ${metrics.activeBatches} active.`,
    ];
    if (metrics.topSource) {
      bullets.push(
        `${metrics.topSource.name} is the leading waste supplier with ${metrics.topSource.weightKg} kg contributed.`
      );
    }
    summary = `During this reporting cycle, ${metrics.totalWasteCollectedKg} kg of mango byproducts were recorded across ${metrics.totalBatches} batches. ${metrics.completedBatches} batches have concluded processing into value-added materials.`;
  }

  const sanitized = sanitizeNarrative(bullets, summary);

  return {
    period,
    metrics,
    narrativeBullets: sanitized.bullets,
    aiSummary: sanitized.summary,
    model,
    generatedAt: new Date().toISOString(),
  };
}
