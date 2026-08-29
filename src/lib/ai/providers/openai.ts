import {
  MultimodalAIProvider,
  MultimodalVisionInput,
  MultimodalVisionResult,
} from "../types";

export class OpenAIProvider implements MultimodalAIProvider {
  public readonly name = "openai";

  private getApiKey(): string {
    const key = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    if (!key) {
      throw new Error("OpenAI API key is not configured on the server.");
    }
    return key;
  }

  private getModel(): string {
    return process.env.OPENAI_VISION_MODEL || process.env.AI_MODEL || "gpt-4o-mini";
  }

  async analyzeImage(input: MultimodalVisionInput): Promise<MultimodalVisionResult> {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const imageUrl = `data:${input.imageMimeType};base64,${input.imageBase64}`;

    const body = {
      model,
      response_format: { type: "json_object" },
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 2500,
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: input.userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low",
              },
            },
          ],
        },
      ],
    };

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent || typeof rawContent !== "string") {
      throw new Error("AI provider returned empty response content.");
    }

    return {
      rawContent,
      model: data.model || model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
          }
        : undefined,
    };
  }
}
