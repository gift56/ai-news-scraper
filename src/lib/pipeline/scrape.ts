import "server-only";

import { scrapeUrl } from "@/lib/oxylabs/client";
import { extractCandidateLinks } from "@/lib/scraping/extract-links";
import { filterCandidateUrls } from "@/lib/scraping/filter-urls";
import { parseArticle } from "@/lib/scraping/parse-article";
import type {
  ScrapeOptions,
  ScrapeResult,
  ScrapeSummary,
  SourceRow,
} from "@/lib/scraping/types";
import {
  findExistingArticleUrls,
  insertArticle,
} from "@/lib/supabase/queries/articles";
import { insertLog } from "@/lib/supabase/queries/logs";
import { getActiveSources } from "@/lib/supabase/queries/sources";
import type { ArticleInsert } from "@/lib/supabase/types";

const DEFAULT_PER_SOURCE_LIMIT = 5;

function createEmptySummary(): ScrapeSummary {
  return {
    status: "completed",
    sourcesChecked: 0,
    candidatesFound: 0,
    candidatesRejected: 0,
    duplicatesSkipped: 0,
    detailPagesScraped: 0,
    articlesInserted: 0,
    articlesRejected: 0,
    articlesFailed: 0,
    totalDurationMs: 0,
    rejectionReasons: {},
  };
}

function addRejectionReason(summary: ScrapeSummary, reason: string): void {
  summary.rejectionReasons[reason] =
    (summary.rejectionReasons[reason] ?? 0) + 1;
}

function selectSources(
  sources: SourceRow[],
  sourceIds?: string[],
): SourceRow[] {
  if (!sourceIds || sourceIds.length === 0) {
    return sources;
  }

  const idSet = new Set(sourceIds);
  return sources.filter((source) => idSet.has(source.id));
}

async function processSource(
  source: SourceRow,
  perSourceLimit: number,
  summary: ScrapeSummary,
): Promise<void> {
  console.log(`[scrape] per-source start: ${source.name} (${source.id})`);

  let homepageHtml: string;
  try {
    homepageHtml = await scrapeUrl(source.listing_url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[scrape] source-level error for ${source.name}: ${message}`);
    summary.articlesFailed += 1;
    return;
  }

  console.log(`[scrape] homepage fetched: ${source.name}`);

  const candidateLinks = extractCandidateLinks(homepageHtml, source);
  console.log(
    `[scrape] candidate links found: ${candidateLinks.length} for ${source.name}`,
  );
  summary.candidatesFound += candidateLinks.length;

  const candidateUrls = candidateLinks.map((link) => link.url);
  const { kept, rejected } = filterCandidateUrls(candidateUrls, source);
  console.log(
    `[scrape] candidates rejected before detail scrape: ${rejected.length} for ${source.name}`,
  );
  summary.candidatesRejected += rejected.length;

  const uniqueUrls = [...new Set(kept)];

  let existingUrls: string[];
  try {
    existingUrls = await findExistingArticleUrls(uniqueUrls);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[scrape] dedupe check failed for ${source.name}: ${message}`,
    );
    summary.articlesFailed += 1;
    return;
  }

  const existingSet = new Set(existingUrls);
  const newUrls = uniqueUrls.filter((url) => !existingSet.has(url));
  console.log(
    `[scrape] duplicates skipped: ${uniqueUrls.length - newUrls.length} for ${source.name}`,
  );
  summary.duplicatesSkipped += uniqueUrls.length - newUrls.length;

  let insertedForSource = 0;

  for (const candidateUrl of newUrls) {
    if (insertedForSource >= perSourceLimit) {
      console.log(
        `[scrape] reached per-source limit (${perSourceLimit}) for ${source.name}`,
      );
      break;
    }

    let detailHtml: string;
    try {
      detailHtml = await scrapeUrl(candidateUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[scrape] detail scrape failed for ${candidateUrl}: ${message}`,
      );
      summary.articlesFailed += 1;
      continue;
    }

    summary.detailPagesScraped += 1;

    const result = parseArticle(detailHtml, candidateUrl);

    if (!result.ok) {
      console.log(
        `[scrape] article rejected: ${candidateUrl} — ${result.reason}`,
      );
      summary.articlesRejected += 1;
      addRejectionReason(summary, result.reason);
      continue;
    }

    const article = result.article;
    const insertInput: ArticleInsert = {
      source_id: source.id,
      original_url: candidateUrl,
      canonical_url: article.canonicalUrl,
      title: article.title,
      image_url: article.imageUrl,
      published_at: article.publishedAt,
      raw_text: article.rawText,
    };

    try {
      await insertArticle(insertInput);
      insertedForSource += 1;
      summary.articlesInserted += 1;
      console.log(
        `[scrape] article inserted: ${article.title} (${candidateUrl})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("duplicate") || message.includes("unique")) {
        console.log(
          `[scrape] duplicate skipped during insert: ${candidateUrl}`,
        );
        summary.duplicatesSkipped += 1;
      } else {
        console.error(`[scrape] insert failed for ${candidateUrl}: ${message}`);
        summary.articlesFailed += 1;
      }
    }
  }

  console.log(
    `[scrape] source complete: ${source.name} — ${insertedForSource} articles inserted`,
  );
}

export async function runScrapePipeline(
  options: ScrapeOptions = {},
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const summary = createEmptySummary();
  const perSourceLimit = options.perSourceLimit ?? DEFAULT_PER_SOURCE_LIMIT;

  console.log("[scrape] scrape started");
  console.log(`[scrape] per-source limit: ${perSourceLimit}`);

  let sources: SourceRow[];
  try {
    sources = await getActiveSources();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[scrape] failed to load sources: ${message}`);
    summary.status = "failed";
    summary.totalDurationMs = Date.now() - startTime;
    return { summary };
  }

  const selectedSources = selectSources(sources, options.sourceIds);
  summary.sourcesChecked = selectedSources.length;
  console.log(`[scrape] selected sources: ${selectedSources.length}`);

  if (selectedSources.length === 0) {
    console.log("[scrape] no sources selected, completing");
    summary.totalDurationMs = Date.now() - startTime;
    return { summary };
  }

  for (const source of selectedSources) {
    try {
      await processSource(source, perSourceLimit, summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[scrape] source-level error for ${source.name}: ${message}`,
      );
      summary.articlesFailed += 1;
    }
  }

  summary.totalDurationMs = Date.now() - startTime;

  console.log("[scrape] scrape completed");
  console.log("[scrape] summary:", JSON.stringify(summary, null, 2));

  try {
    await insertLog("info", "Scrape completed", summary as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[scrape] failed to persist summary log: ${message}`);
  }

  return { summary };
}
