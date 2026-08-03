import "server-only";

import * as cheerio from "cheerio";
import type { CandidateLink, SourceRow } from "@/lib/scraping/types";

const CARD_SELECTORS = [
  "article a[href]",
  '[data-testid*="card"] a[href]',
  '[class*="card"] a[href]',
  '[class*="story"] a[href]',
  '[class*="headline"] a[href]',
  "h1 a[href]",
  "h2 a[href]",
  "h3 a[href]",
  '[class*="promo"] a[href]',
  '[class*="title"] a[href]',
];

const EXCLUDE_SELECTORS = [
  "nav",
  "header",
  "footer",
  "aside",
  '[class*="nav"]',
  '[class*="menu"]',
  '[class*="footer"]',
  '[class*="header"]',
  '[class*="sidebar"]',
  '[class*="social"]',
  '[class*="share"]',
  '[class*="newsletter"]',
  '[class*="subscribe"]',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return "";
  }
}

function isArticleLink(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol;
    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function extractCandidateLinks(
  html: string,
  source: SourceRow,
): CandidateLink[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const links: CandidateLink[] = [];

  for (const selector of CARD_SELECTORS) {
    $(selector).each((_index, element) => {
      const $el = $(element);

      for (const excludeSelector of EXCLUDE_SELECTORS) {
        if ($el.closest(excludeSelector).length > 0) {
          return;
        }
      }

      const href = $el.attr("href");
      if (!href) return;

      const resolved = resolveUrl(href, source.listing_url);
      if (!resolved || !isArticleLink(resolved)) return;

      if (resolved === source.listing_url) return;

      if (seen.has(resolved)) return;
      seen.add(resolved);

      const title =
        $el.text().trim() ||
        $el.find("h1, h2, h3, h4, [class*='title']").first().text().trim() ||
        null;

      links.push({ url: resolved, title: title || null });
    });
  }

  return links;
}
