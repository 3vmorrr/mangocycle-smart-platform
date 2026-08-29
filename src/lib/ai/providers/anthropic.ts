import {
  MultimodalAIProvider,
  MultimodalVisionInput,
  MultimodalVisionResult,
} from "../types";

export class AnthropicProvider implements MultimodalAIProvider {
  public readonly name = "anthropic";

  private getApiKey(): string {
    const key = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      throw new Error("Anthropic API key is not configured on the server.");
    }
    return key;
  }

  private getModel(): string {
    return process.env.ANTHROPIC_VISION_MODEL || process.env.AI_MODEL || "claude-3-5-sonnet-20241022";
  }

  async analyzeImage(input: MultimodalVisionInput): Promise<MultimodalVisionResult> {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const mediaType = input.imageMimeType as "image/jpeg" | "image/png" | "image/webp";

    const body = {
      model,
      max_tokens: input.maxTokens ?? 1000,
      temperature: input.temperature ?? 0.2,
      system: input.systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: input.imageBase64,
              },
            },
            {
              type: "text",
              text: input.userPrompt,
            },
          ],
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "TimeoutError") {
        throw new Error("AI provider timed out after 30 seconds.");
      }
      throw new Error("Failed to connect to AI provider.");
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("AI provider rate limit exceeded. Please try again in a few moments.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("AI provider authentication error. Please check server configuration.");
      }
      throw new Error(`AI provider error (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("AI provider returned empty response content.");
    }

    return {
      rawContent,
      model: data.model || model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
          }
        : undefined,
    };
  }
}
