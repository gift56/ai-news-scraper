import "server-only";

const requiredEnv = ["GOOGLE_GENERATIVE_AI_API_KEY"] as const;

export function getAiEnv() {
  const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!geminiApiKey) {
    throw new Error(`Missing AI env var: ${requiredEnv.join(", ")}`);
  }

  return { geminiApiKey };
}
