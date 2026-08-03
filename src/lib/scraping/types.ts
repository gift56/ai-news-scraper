import type { SourceRow } from "@/lib/supabase/types";

export type CandidateLink = {
  url: string;
  title: string | null;
};

export type ScrapedArticle = {
  title: string;
  canonicalUrl: string;
  imageUrl: string;
  publishedAt: string;
  rawText: string;
};

export type ArticleValidationResult =
  | { ok: true; article: ScrapedArticle }
  | { ok: false; reason: string };

export type ScrapeSummary = {
  status: "completed" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionReasons: Record<string, number>;
};

export type ScrapeOptions = {
  sourceIds?: string[];
  perSourceLimit?: number;
};

export type ScrapeResult = {
  summary: ScrapeSummary;
};

export type { SourceRow };
