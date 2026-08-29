import {
  MultimodalAIProvider,
  MultimodalVisionInput,
  MultimodalVisionResult,
} from "../types";

export class GeminiProvider implements MultimodalAIProvider {
  public readonly name = "gemini";

  private getApiKey(): string {
    const key =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.AI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key is not configured on the server.");
    }
    return key;
  }

  public getPrimaryModel(): string {
    return process.env.AI_MODEL || process.env.GEMINI_VISION_MODEL || "gemini-3.6-flash";
  }

  private async executeGenerateContent(
    model: string,
    apiKey: string,
    input: MultimodalVisionInput
  ): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      systemInstruction: {
        parts: [{ text: input.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: input.userPrompt },
            {
              inlineData: {
                mimeType: input.imageMimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: input.temperature ?? 0.2,
        maxOutputTokens: input.maxTokens ?? 2500,
      },
    };

    return await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  }

  async analyzeImage(input: MultimodalVisionInput): Promise<MultimodalVisionResult> {
    const apiKey = this.getApiKey();
    const model = this.getPrimaryModel();

    let response: Response;
    try {
      response = await this.executeGenerateContent(model, apiKey, input);

      // Single fast retry ONLY for transient 503 service unavailable
      if (response.status === 503) {
        console.warn("Gemini 503 service unavailable. Retrying once after 3s...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        response = await this.executeGenerateContent(model, apiKey, input);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error("AI provider timed out after 60 seconds.");
      }
      throw new Error("Failed to connect to AI provider.");
    }

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        if (errText.includes("PerDay") || errText.includes("Daily")) {
          throw new Error("AI provider daily quota exhausted for model " + model + ". Please try again tomorrow or upgrade your plan.");
        }
        throw new Error("AI provider rate limit exceeded. Please try again in a few moments.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("AI provider authentication error. Please check server configuration.");
      }
      throw new Error(`AI provider error (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("AI provider returned empty response content.");
    }

    return {
      rawContent,
      model,
      provider: this.name,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
          }
        : undefined,
    };
  }
}
