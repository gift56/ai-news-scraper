import "server-only";

import { embed } from "ai";
import { getEmbeddingModel } from "@/lib/ai/client";
import type { PendingAnalysisArticle } from "@/lib/supabase/types";

const MAX_EMBEDDING_TEXT_LENGTH = 50_000;

function buildEmbeddingInput(article: PendingAnalysisArticle): string {
  const truncatedText =
    article.raw_text.length > MAX_EMBEDDING_TEXT_LENGTH
      ? `${article.raw_text.slice(0, MAX_EMBEDDING_TEXT_LENGTH)}...[truncated]`
      : article.raw_text;

  return `Title: ${article.title}\n\n${truncatedText}`;
}

export async function generateEmbedding(
  article: PendingAnalysisArticle,
): Promise<number[]> {
  const selection = getEmbeddingModel();
  const model = selection.provider.embeddingModel(selection.modelId);

  console.log(
    `[embedding] generating embedding for: ${article.title} (${article.id}) using ${selection.modelName}`,
  );

  const { embedding } = await embed({
    model,
    value: buildEmbeddingInput(article),
    providerOptions: {
      google: {
        outputDimensionality: selection.dimensions,
      },
    },
  });

  console.log(
    `[embedding] embedding generated: ${embedding.length} dimensions for ${article.id}`,
  );

  return embedding;
}
