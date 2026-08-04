import "server-only";

import { analyzeArticle } from "@/lib/ai/analyze";
import { generateEmbedding } from "@/lib/ai/embedding";
import type { AnalysisResult as ArticleAnalysis } from "@/lib/ai/schema";
import type {
  AnalysisOptions,
  AnalysisResult,
  AnalysisSummary,
} from "@/lib/pipeline/types";
import {
  getPendingAnalysisArticles,
  getPendingEmbeddingArticles,
  insertArticleAnalysis,
  updateArticleEmbedding,
} from "@/lib/supabase/queries/analyses";
import { markArticleAnalyzed } from "@/lib/supabase/queries/articles";
import { insertLog } from "@/lib/supabase/queries/logs";
import type { ArticleAnalysisInsert } from "@/lib/supabase/types";

const DEFAULT_BATCH_SIZE = 5;
const ARTICLE_DELAY_MS = 4_000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createEmptySummary(): AnalysisSummary {
  return {
    status: "completed",
    articlesPending: 0,
    articlesAnalyzed: 0,
    articlesSkipped: 0,
    articlesFailed: 0,
    embeddingsGenerated: 0,
    embeddingsFailed: 0,
    embeddingsBackfilled: 0,
    batchesProcessed: 0,
    totalDurationMs: 0,
    failureReasons: {},
  };
}

function addFailureReason(summary: AnalysisSummary, reason: string): void {
  summary.failureReasons[reason] = (summary.failureReasons[reason] ?? 0) + 1;
}

function getBatchSize(): number {
  const envValue = process.env.ANALYSIS_BATCH_SIZE;
  const parsed = envValue ? Number.parseInt(envValue, 10) : DEFAULT_BATCH_SIZE;
  return Number.isNaN(parsed) || parsed < 1 ? DEFAULT_BATCH_SIZE : parsed;
}

function filterByArticleIds(
  articles: Awaited<ReturnType<typeof getPendingAnalysisArticles>>,
  articleIds: string[],
): Awaited<ReturnType<typeof getPendingAnalysisArticles>> {
  if (!articleIds || articleIds.length === 0) {
    return articles;
  }

  const idSet = new Set(articleIds);
  return articles.filter((article) => idSet.has(article.id));
}

async function processArticle(
  article: Awaited<ReturnType<typeof getPendingAnalysisArticles>>[number],
  summary: AnalysisSummary,
): Promise<void> {
  console.log(`[analyze] article start: ${article.title} (${article.id})`);

  let analysis: ArticleAnalysis;
  try {
    analysis = await analyzeArticle(article);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[analyze] article failed: ${article.title} — ${message}`);
    summary.articlesFailed += 1;
    addFailureReason(summary, message);
    return;
  }

  const insertInput: ArticleAnalysisInsert = {
    article_id: article.id,
    summary: analysis.summary,
    sentiment_score: analysis.sentimentScore,
    sentiment_label: analysis.sentimentLabel,
    bias_score: (analysis.rightPercentage - analysis.leftPercentage) / 100,
    bias_label: analysis.politicalFramingLabel,
    left_percentage: analysis.leftPercentage,
    center_percentage: analysis.centerPercentage,
    right_percentage: analysis.rightPercentage,
    confidence: analysis.confidence,
    framing_notes: analysis.framingNotes,
    loaded_terms: analysis.loadedTerms,
    disclaimer: analysis.disclaimer,
    model: analysis.model,
  };

  try {
    await insertArticleAnalysis(insertInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[analyze] insert failed for ${article.title}: ${message}`);
    summary.articlesFailed += 1;
    addFailureReason(summary, `insert: ${message}`);
    return;
  }

  // Generate and save embedding after analysis is inserted
  try {
    const embedding = await generateEmbedding(article);
    await updateArticleEmbedding(article.id, embedding);
    summary.embeddingsGenerated += 1;
    console.log(
      `[analyze] embedding saved for: ${article.title} (${article.id})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[analyze] embedding failed for ${article.title}: ${message}`,
    );
    summary.embeddingsFailed += 1;
    addFailureReason(summary, `embedding: ${message}`);
    // Continue — article will be picked up for embedding backfill on next run
  }

  try {
    await markArticleAnalyzed(article.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[analyze] mark analyzed failed for ${article.title}: ${message}`,
    );
    summary.articlesFailed += 1;
    addFailureReason(summary, `mark_analyzed: ${message}`);
    return;
  }

  summary.articlesAnalyzed += 1;
  console.log(
    `[analyze] article analyzed: ${article.title} (${article.id}) — ${analysis.model}`,
  );
}

async function processEmbeddingBackfill(
  article: Awaited<ReturnType<typeof getPendingEmbeddingArticles>>[number],
  summary: AnalysisSummary,
): Promise<void> {
  console.log(
    `[analyze] embedding backfill start: ${article.title} (${article.id})`,
  );

  try {
    const embedding = await generateEmbedding(article);
    await updateArticleEmbedding(article.id, embedding);
    summary.embeddingsBackfilled += 1;
    console.log(
      `[analyze] embedding backfilled: ${article.title} (${article.id})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[analyze] embedding backfill failed for ${article.title}: ${message}`,
    );
    summary.embeddingsFailed += 1;
    addFailureReason(summary, `embedding_backfill: ${message}`);
  }
}

export async function runAnalysisPipeline(
  options: AnalysisOptions = {},
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const summary = createEmptySummary();
  const batchSize = getBatchSize();

  console.log("[analyze] analysis started");
  console.log(`[analyze] batch size: ${batchSize}`);

  if (options.limit) {
    console.log(`[analyze] limit: ${options.limit}`);
  }

  if (options.articleIds && options.articleIds.length > 0) {
    console.log(
      `[analyze] filtering by article IDs: ${options.articleIds.length} requested`,
    );
  }

  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore) {
    const remainingLimit = options.limit
      ? Math.min(batchSize, options.limit - totalProcessed)
      : batchSize;

    if (remainingLimit <= 0) {
      break;
    }

    let batch: Awaited<ReturnType<typeof getPendingAnalysisArticles>>;

    try {
      batch = await getPendingAnalysisArticles(remainingLimit);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[analyze] failed to load pending articles: ${message}`);
      summary.status = "failed";
      summary.totalDurationMs = Date.now() - startTime;
      return { summary };
    }

    batch = filterByArticleIds(batch, options.articleIds ?? []);

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    summary.articlesPending += batch.length;
    console.log(`[analyze] batch start: ${batch.length} articles`);

    for (let i = 0; i < batch.length; i++) {
      const article = batch[i];
      await processArticle(article, summary);
      totalProcessed += 1;

      if (i < batch.length - 1) {
        console.log(
          `[analyze] waiting ${ARTICLE_DELAY_MS / 1000}s before next article (rate limit safety)`,
        );
        await sleep(ARTICLE_DELAY_MS);
      }
    }

    summary.batchesProcessed += 1;
    console.log(
      `[analyze] batch complete: analyzed ${summary.articlesAnalyzed}, failed ${summary.articlesFailed}`,
    );

    if (batch.length < remainingLimit) {
      hasMore = false;
    }
  }

  // Embedding backfill: process articles that have analysis but no embedding
  console.log("[analyze] starting embedding backfill");

  let backfillHasMore = true;
  while (backfillHasMore) {
    let backfillBatch: Awaited<ReturnType<typeof getPendingEmbeddingArticles>>;

    try {
      backfillBatch = await getPendingEmbeddingArticles(batchSize);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[analyze] failed to load pending embedding articles: ${message}`,
      );
      break;
    }

    if (backfillBatch.length === 0) {
      backfillHasMore = false;
      break;
    }

    console.log(
      `[analyze] embedding backfill batch: ${backfillBatch.length} articles`,
    );

    for (let i = 0; i < backfillBatch.length; i++) {
      const article = backfillBatch[i];
      await processEmbeddingBackfill(article, summary);

      if (i < backfillBatch.length - 1) {
        console.log(
          `[analyze] waiting ${ARTICLE_DELAY_MS / 1000}s before next embedding (rate limit safety)`,
        );
        await sleep(ARTICLE_DELAY_MS);
      }
    }

    if (backfillBatch.length < batchSize) {
      backfillHasMore = false;
    }
  }

  summary.totalDurationMs = Date.now() - startTime;

  console.log("[analyze] analysis completed");
  console.log("[analyze] summary:", JSON.stringify(summary, null, 2));

  try {
    await insertLog("info", "Analysis completed", summary as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[analyze] failed to persist summary log: ${message}`);
  }

  return { summary };
}
