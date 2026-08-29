import {
  AiWasteVisualAnalysis,
  AnalyzeWasteImageInput,
  ProcessingAdvisorResponse,
  AskMangoCycleMessage,
  AiSustainabilityInsightResponse,
  AiAnalysisRecord,
} from "@/data/contracts/ai";
import { apiRequest } from "./http";

export const supabaseAiAdapter = {
  async analyzeWasteImage(input: AnalyzeWasteImageInput): Promise<AiWasteVisualAnalysis> {
    return await apiRequest<AiWasteVisualAnalysis>(
      "/api/ai/waste-visual-analysis",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  },

  async getProcessingAdvice(batchIdOrCode: string): Promise<ProcessingAdvisorResponse> {
    return await apiRequest<ProcessingAdvisorResponse>(
      "/api/ai/processing-advisor",
      {
        method: "POST",
        body: JSON.stringify({ batchId: batchIdOrCode }),
      }
    );
  },

  async queryAskMangoCycle(question: string): Promise<AskMangoCycleMessage> {
    return await apiRequest<AskMangoCycleMessage>(
      "/api/ai/ask",
      {
        method: "POST",
        body: JSON.stringify({ question }),
      }
    );
  },

  async getSustainabilityInsights(period?: string): Promise<AiSustainabilityInsightResponse> {
    return await apiRequest<AiSustainabilityInsightResponse>(
      "/api/ai/sustainability-insights",
      {
        method: "POST",
        body: JSON.stringify({ period }),
      }
    );
  },

  async getAiAnalysisHistory(): Promise<AiAnalysisRecord[]> {
    return await apiRequest<AiAnalysisRecord[]>(
      "/api/ai/history",
      {
        method: "GET",
      }
    );
  },
};
