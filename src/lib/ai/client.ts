import "server-only";

import { createGoogle } from "@ai-sdk/google";
import { getAiEnv } from "@/lib/ai/env";

const GOOGLE_MODEL_ID = "gemini-3.6-flash";
const GOOGLE_EMBEDDING_MODEL_ID = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;

export type ProviderSelection = {
  provider: ReturnType<typeof createGoogle>;
  modelId: string;
  modelName: string;
};

export type EmbeddingModelSelection = {
  provider: ReturnType<typeof createGoogle>;
  modelId: string;
  modelName: string;
  dimensions: number;
};

export function getActiveProvider(): ProviderSelection {
  const { geminiApiKey } = getAiEnv();

  const provider = createGoogle({ apiKey: geminiApiKey });

  return {
    provider,
    modelId: GOOGLE_MODEL_ID,
    modelName: GOOGLE_MODEL_ID,
  };
}

export function getEmbeddingModel(): EmbeddingModelSelection {
  const { geminiApiKey } = getAiEnv();

  const provider = createGoogle({ apiKey: geminiApiKey });

  return {
    provider,
    modelId: GOOGLE_EMBEDDING_MODEL_ID,
    modelName: GOOGLE_EMBEDDING_MODEL_ID,
    dimensions: EMBEDDING_DIMENSIONS,
  };
}
