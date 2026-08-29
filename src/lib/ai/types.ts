export interface MultimodalVisionInput {
  systemPrompt: string;
  userPrompt: string;
  imageMimeType: string;
  imageBase64: string;
  maxTokens?: number;
  temperature?: number;
}

export interface MultimodalVisionResult {
  rawContent: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface MultimodalAIProvider {
  name: string;
  analyzeImage(input: MultimodalVisionInput): Promise<MultimodalVisionResult>;
}
