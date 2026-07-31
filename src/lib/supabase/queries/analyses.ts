import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type {
  ArticleAnalysisInsert,
  ArticleAnalysisRow,
  PendingAnalysisArticle,
} from "@/lib/supabase/types";

const PENDING_ARTICLE_SELECT = `
  *,
  sources (*),
  article_analyses ( id )
`;

function isPendingAnalysisArticle(
  article: PendingAnalysisArticle & {
    article_analyses: { id: string } | { id: string }[] | null;
  },
): boolean {
  const relation = article.article_analyses;

  if (!relation) {
    return true;
  }

  if (Array.isArray(relation)) {
    return relation.length === 0;
  }

  return false;
}

function validateAnalysisInput(input: ArticleAnalysisInsert) {
  const labels = ["positive", "neutral", "negative"] as const;
  const biasLabels = ["left", "center", "right", "mixed", "unclear"] as const;

  if (!labels.includes(input.sentiment_label)) {
    throw new Error(`Invalid sentiment_label: ${input.sentiment_label}`);
  }

  if (!biasLabels.includes(input.bias_label)) {
    throw new Error(`Invalid bias_label: ${input.bias_label}`);
  }

  const percentages = [
    input.left_percentage,
    input.center_percentage,
    input.right_percentage,
  ];

  for (const value of percentages) {
    if (value < 0 || value > 100) {
      throw new Error("Analysis percentages must be between 0 and 100");
    }
  }

  if (percentages.reduce((sum, value) => sum + value, 0) !== 100) {
    throw new Error("Analysis percentages must sum to 100");
  }

  if (input.sentiment_score < -1 || input.sentiment_score > 1) {
    throw new Error("sentiment_score must be between -1 and 1");
  }

  if (input.bias_score < -1 || input.bias_score > 1) {
    throw new Error("bias_score must be between -1 and 1");
  }

  if (input.confidence < 0 || input.confidence > 1) {
    throw new Error("confidence must be between 0 and 1");
  }
}

export async function getPendingAnalysisArticles(
  limit = 50,
): Promise<PendingAnalysisArticle[]> {
  const supabase = createSupabaseServiceRoleClient();
  const fetchLimit = Math.max(limit * 3, limit);
  const { data, error } = await supabase
    .from("articles")
    .select(PENDING_ARTICLE_SELECT)
    .order("scraped_at", { ascending: true })
    .limit(fetchLimit);

  if (error) {
    throw new Error(
      `Failed to load pending analysis articles: ${error.message}`,
    );
  }

  return (data ?? [])
    .filter(isPendingAnalysisArticle)
    .slice(0, limit)
    .map(({ article_analyses: _analysis, ...article }) => article);
}

export async function insertArticleAnalysis(
  input: ArticleAnalysisInsert,
): Promise<ArticleAnalysisRow> {
  validateAnalysisInput(input);

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("article_analyses")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert article analysis: ${error.message}`);
  }

  return data;
}

export async function getAnalysisByArticleId(
  articleId: string,
): Promise<ArticleAnalysisRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("article_analyses")
    .select("*")
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load analysis for article ${articleId}: ${error.message}`,
    );
  }

  return data;
}
