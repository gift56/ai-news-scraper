import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/supabase/slugify";
import type {
  ArticleAnalysisRow,
  ArticleDetailRow,
  ArticleInsert,
  ArticleRow,
  ArticleWithRelations,
  HomeArticleRow,
  SourceRow,
} from "@/lib/supabase/types";

const URL_EXISTENCE_CHUNK_SIZE = 15;

const ARTICLE_WITH_RELATIONS_SELECT = `
  *,
  sources (*),
  article_analyses (*)
`;

function getAnalysisRelation(
  article: ArticleWithRelations,
): ArticleAnalysisRow | null {
  const relation = article.article_analyses;

  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function isPublicArticle(article: ArticleWithRelations): boolean {
  return article.analyzed_at !== null && getAnalysisRelation(article) !== null;
}

export function toHomeArticleRow(
  article: ArticleWithRelations,
): HomeArticleRow {
  const analysis = getAnalysisRelation(article);

  if (!analysis || !article.sources) {
    throw new Error(`Article ${article.id} is missing public analysis data`);
  }

  return {
    id: article.id,
    slug: slugify(article.title),
    title: article.title,
    imageUrl: article.image_url,
    publishedAt: article.published_at,
    sourceName: article.sources.name,
    sourceId: article.source_id,
    sentimentLabel: analysis.sentiment_label,
    biasLabel: analysis.bias_label,
    leftPercentage: analysis.left_percentage,
    centerPercentage: analysis.center_percentage,
    rightPercentage: analysis.right_percentage,
    confidence: analysis.confidence,
  };
}

export function toArticleDetailRow(
  article: ArticleWithRelations,
): ArticleDetailRow {
  const analysis = getAnalysisRelation(article);

  if (!analysis || !article.sources) {
    throw new Error(`Article ${article.id} is missing public analysis data`);
  }

  return {
    id: article.id,
    slug: slugify(article.title),
    title: article.title,
    imageUrl: article.image_url,
    publishedAt: article.published_at,
    rawText: article.raw_text,
    originalUrl: article.original_url,
    canonicalUrl: article.canonical_url,
    source: {
      id: article.sources.id,
      name: article.sources.name,
      logoUrl: article.sources.logo_url,
    },
    analysis: {
      summary: analysis.summary,
      sentimentLabel: analysis.sentiment_label,
      sentimentScore: analysis.sentiment_score,
      biasLabel: analysis.bias_label,
      biasScore: analysis.bias_score,
      leftPercentage: analysis.left_percentage,
      centerPercentage: analysis.center_percentage,
      rightPercentage: analysis.right_percentage,
      confidence: analysis.confidence,
      framingNotes: analysis.framing_notes,
      loadedTerms: analysis.loaded_terms,
      disclaimer: analysis.disclaimer,
      model: analysis.model,
    },
  };
}

export async function getHomeArticles(limit = 24): Promise<HomeArticleRow[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load homepage articles: ${error.message}`);
  }

  return (data ?? [])
    .filter(isPublicArticle)
    .map((article) => toHomeArticleRow(article as ArticleWithRelations));
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleDetailRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load article by slug: ${error.message}`);
  }

  const match = (data ?? []).find((article) => {
    const row = article as ArticleWithRelations;
    return isPublicArticle(row) && slugify(row.title) === slug;
  });

  if (!match) {
    return null;
  }

  return toArticleDetailRow(match as ArticleWithRelations);
}

export async function findExistingArticleUrls(
  urls: string[],
): Promise<string[]> {
  if (urls.length === 0) {
    return [];
  }

  const supabase = createSupabaseServiceRoleClient();
  const existing = new Set<string>();

  for (let index = 0; index < urls.length; index += URL_EXISTENCE_CHUNK_SIZE) {
    const chunk = urls.slice(index, index + URL_EXISTENCE_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("articles")
      .select("original_url")
      .in("original_url", chunk);

    if (error) {
      throw new Error(
        `Failed to check existing article URLs: ${error.message}`,
      );
    }

    for (const row of data ?? []) {
      existing.add(row.original_url);
    }
  }

  return [...existing];
}

export async function insertArticle(input: ArticleInsert): Promise<ArticleRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert article: ${error.message}`);
  }

  return data;
}

export async function markArticleAnalyzed(
  articleId: string,
  analyzedAt = new Date().toISOString(),
): Promise<ArticleRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("articles")
    .update({ analyzed_at: analyzedAt })
    .eq("id", articleId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to mark article analyzed: ${error.message}`);
  }

  return data;
}

export type { SourceRow };
