import { MultimodalAIProvider } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";

export function getMultimodalAIProvider(): MultimodalAIProvider {
  const configuredProvider = process.env.AI_PROVIDER?.toLowerCase()?.trim();

  if (configuredProvider === "gemini" || configuredProvider === "google") {
    return new GeminiProvider();
  }
  if (configuredProvider === "anthropic" || configuredProvider === "claude") {
    return new AnthropicProvider();
  }
  if (configuredProvider === "openai") {
    return new OpenAIProvider();
  }

  // Automatic detection based on available environment API keys
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    return new GeminiProvider();
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider();
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  if (process.env.AI_API_KEY) {
    return new OpenAIProvider();
  }

  throw new Error(
    "No valid AI provider configuration found. Please set GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in environment variables."
  );
}

export const getAIProvider = getMultimodalAIProvider;
