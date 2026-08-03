import "server-only";

import { createGoogle } from "@ai-sdk/google";
import { getAiEnv } from "@/lib/ai/env";

const GOOGLE_MODEL_ID = "gemini-3.6-flash";

export type ProviderSelection = {
  provider: ReturnType<typeof createGoogle>;
  modelId: string;
  modelName: string;
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
