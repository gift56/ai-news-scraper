import "server-only";

import { generateText, NoObjectGeneratedError, Output } from "ai";
import { getActiveProvider, type ProviderSelection } from "@/lib/ai/client";
import { type AnalysisResult, analysisSchema } from "@/lib/ai/schema";
import type { PendingAnalysisArticle } from "@/lib/supabase/types";

const MAX_ARTICLE_TEXT_LENGTH = 50_000;
const QUOTA_RETRY_DELAY_MS = 60_000;
const QUOTA_RETRY_MAX_ATTEMPTS = 2;

const SYSTEM_PROMPT = `You are a neutral, objective news analyst. Your job is to analyze news articles for sentiment, political framing, and loaded language.

Important rules:
1. Analyze the article text evidence only. Do not infer based on source name alone.
2. Provide a neutral, factual summary of the article in 2-4 sentences.
3. Estimate the political framing as left, center, right, mixed, or unclear percentages. The three percentages (left, center, right) must always add up to exactly 100.
4. The political framing label should match the strongest percentage unless confidence is low or percentages are close, in which case use "mixed" or "unclear".
5. If evidence is weak, use "unclear" as the political framing label and keep confidence low (below 0.3).
6. Identify loaded terms — emotionally charged or biased words used in the article.
7. Include a disclaimer stating this is an AI-estimated analysis, not objective truth.
8. The sentiment score ranges from -1 (very negative) to 1 (very positive).
9. The confidence score ranges from 0 (low confidence) to 1 (high confidence).
10. All framing is AI-estimated and should not be treated as objective truth.`;

function buildUserPrompt(article: PendingAnalysisArticle): string {
  const truncatedText =
    article.raw_text.length > MAX_ARTICLE_TEXT_LENGTH
      ? `${article.raw_text.slice(0, MAX_ARTICLE_TEXT_LENGTH)}...[truncated]`
      : article.raw_text;

  return `Analyze the following news article:

Title: ${article.title}

Article text:
${truncatedText}

Provide a structured analysis with: a neutral summary, sentiment score and label, political framing percentages (left/center/right that sum to 100), political framing label, confidence score, framing notes, loaded terms, and a disclaimer.`;
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("resource_exhausted")
    );
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callModel(
  selection: ProviderSelection,
  article: PendingAnalysisArticle,
): Promise<AnalysisResult> {
  const model = selection.provider(selection.modelId);

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: analysisSchema,
      name: "ArticleAnalysis",
      description: "Structured analysis of a news article",
    }),
    instructions: SYSTEM_PROMPT,
    prompt: buildUserPrompt(article),
  });

  return {
    ...output,
    model: selection.modelName,
  };
}

export async function analyzeArticle(
  article: PendingAnalysisArticle,
): Promise<AnalysisResult> {
  const provider = getActiveProvider();

  console.log(`[analyze] using provider: google (${provider.modelName})`);

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= QUOTA_RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      return await callModel(provider, article);
    } catch (error) {
      lastError = error;

      if (NoObjectGeneratedError.isInstance(error)) {
        console.error(
          `[analyze] failed to generate valid object: ${error.message}`,
        );
        throw new Error(
          `Analysis failed: model did not generate valid structured output: ${error.message}`,
        );
      }

      if (isQuotaError(error)) {
        const waitSeconds = Math.ceil(QUOTA_RETRY_DELAY_MS / 1000);
        console.warn(
          `[analyze] quota/rate limit hit, waiting ${waitSeconds}s before retry (attempt ${attempt + 1}/${QUOTA_RETRY_MAX_ATTEMPTS + 1})`,
        );
        if (attempt < QUOTA_RETRY_MAX_ATTEMPTS) {
          await sleep(QUOTA_RETRY_DELAY_MS);
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error(
    `Analysis failed after retries: ${lastError instanceof Error ? lastError.message : "Unknown error"}`,
  );
}
