import "server-only";

import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type {
  ArticleValidationResult,
  ScrapedArticle,
} from "@/lib/scraping/types";

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "aside",
  "nav",
  "header",
  "footer",
  "form",
  "iframe",
];

const NOISE_CLASS_PATTERNS = [
  "newsletter",
  "subscribe",
  "related",
  "most-viewed",
  "most-popular",
  "load-more",
  "social",
  "share",
  "ad",
  "sponsor",
  "promo",
  "navigation",
  "breadcrumb",
  "sidebar",
  "comments",
];

const BODY_SELECTORS = [
  "article",
  '[data-testid*="article"]',
  '[class*="article__body"]',
  '[class*="article-body"]',
  '[class*="story__body"]',
  '[class*="content__body"]',
  '[class*="article__content"]',
  '[class*="story-body"]',
  "main",
];

const MIN_PARAGRAPHS = 3;
const MIN_CHARACTERS = 900;

const GENERIC_TITLES = new Set([
  "home",
  "news",
  "world",
  "politics",
  "business",
  "technology",
  "tech",
  "science",
  "health",
  "sports",
  "entertainment",
  "environment",
  "climate",
  "opinion",
  "video",
  "live",
  "about",
  "contact",
  "breaking news",
  "latest",
  "today",
]);

const LISTING_KEYWORDS = [
  "/category/",
  "/tag/",
  "/topic/",
  "/section/",
  "/sections/",
  "/show/",
  "/shows/",
  "/live/",
  "/video/",
  "/podcast/",
  "/program/",
  "/product/",
  "/shop/",
];

function extractTitle($: cheerio.CheerioAPI): string | null {
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle && ogTitle.trim().length > 0) {
    return ogTitle.trim();
  }

  const titleTag = $("title").text().trim();
  if (titleTag.length > 0) {
    const cleaned = titleTag.split(" | ").pop()?.trim() ?? titleTag;
    if (cleaned.length > 0) return cleaned;
  }

  const h1 = $("h1").first().text().trim();
  if (h1.length > 0) {
    return h1;
  }

  return null;
}

function extractCanonicalUrl(
  $: cheerio.CheerioAPI,
  fallbackUrl: string,
): string {
  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical && canonical.trim().length > 0) {
    try {
      return new URL(canonical, fallbackUrl).href;
    } catch {
      return canonical;
    }
  }
  return fallbackUrl;
}

function extractPublishedDate($: cheerio.CheerioAPI): string | null {
  const metaDate = $('meta[property="article:published_time"]').attr("content");
  if (metaDate && metaDate.trim().length > 0) {
    return metaDate.trim();
  }

  const timeAttr = $("time").attr("datetime");
  if (timeAttr && timeAttr.trim().length > 0) {
    return timeAttr.trim();
  }

  const jsonLd = $('script[type="application/ld+json"]').text();
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item?.datePublished) {
          return String(item.datePublished);
        }
      }
    } catch {
      // JSON-LD parse failed, continue
    }
  }

  return null;
}

function extractImageUrl(
  $: cheerio.CheerioAPI,
  $body: cheerio.Cheerio<AnyNode>,
): string | null {
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage && ogImage.trim().length > 0) {
    return ogImage.trim();
  }

  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage && twitterImage.trim().length > 0) {
    return twitterImage.trim();
  }

  const img = $body.find("img").first();
  const src = img.attr("src");
  if (src && src.trim().length > 0) {
    return src.trim();
  }

  return null;
}

function removeNoise($: cheerio.CheerioAPI): void {
  for (const selector of REMOVE_SELECTORS) {
    $(selector).remove();
  }

  for (const pattern of NOISE_CLASS_PATTERNS) {
    $(`[class*="${pattern}"]`).remove();
    $(`[id*="${pattern}"]`).remove();
  }
}

function selectBody($: cheerio.CheerioAPI): cheerio.Cheerio<AnyNode> {
  for (const selector of BODY_SELECTORS) {
    const $body = $(selector);
    if ($body.length > 0) {
      const paragraphs = $body.find("p");
      if (paragraphs.length > 0) {
        return $body;
      }
    }
  }

  return $("body");
}

function splitLargeParagraph(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g);
  if (sentences && sentences.length > 1) {
    return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
  }

  return [text];
}

function extractRawText(
  $: cheerio.CheerioAPI,
  $body: cheerio.Cheerio<AnyNode>,
): string {
  const paragraphs: string[] = [];
  const allParagraphs = $body.find("p");
  const isSingleParagraph = allParagraphs.length === 1;

  allParagraphs.each((_index, element) => {
    const $p = $(element);
    const text = $p.text().trim();

    if (text.length === 0) return;

    if (isSingleParagraph) {
      const split = splitLargeParagraph(text);
      paragraphs.push(...split);
    } else {
      paragraphs.push(text);
    }
  });

  return paragraphs.join("\n\n");
}

function cleanRawText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/javascript:void\(0\)/gi, "")
    .replace(/\{[^}]*\}/g, "")
    .trim();
}

function isGenericTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  if (GENERIC_TITLES.has(lower)) return true;

  if (lower.length < 10) return true;

  return false;
}

function isListingUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return LISTING_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function countMeaningfulParagraphs(rawText: string): number {
  return rawText
    .split("\n\n")
    .filter((paragraph) => paragraph.trim().length > 0).length;
}

function countMeaningfulCharacters(rawText: string): number {
  return rawText.replace(/\s+/g, "").length;
}

export function parseArticle(
  html: string,
  url: string,
): ArticleValidationResult {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  if (!title) {
    return { ok: false, reason: "Missing article title" };
  }

  if (isGenericTitle(title)) {
    return { ok: false, reason: "Title is generic or non-article" };
  }

  const canonicalUrl = extractCanonicalUrl($, url);
  if (isListingUrl(canonicalUrl)) {
    return {
      ok: false,
      reason: "Canonical URL points to a listing/category page",
    };
  }

  const publishedAt = extractPublishedDate($);
  if (!publishedAt) {
    return { ok: false, reason: "Missing published date" };
  }

  removeNoise($);

  const $body = selectBody($);
  const rawText = cleanRawText(extractRawText($, $body));

  if (rawText.length === 0) {
    return { ok: false, reason: "Empty article body" };
  }

  const paragraphCount = countMeaningfulParagraphs(rawText);
  const charCount = countMeaningfulCharacters(rawText);

  if (paragraphCount < MIN_PARAGRAPHS && charCount < MIN_CHARACTERS) {
    return {
      ok: false,
      reason: `Body too short (${paragraphCount} paragraphs, ${charCount} chars)`,
    };
  }

  const imageUrl = extractImageUrl($, $body);
  if (!imageUrl) {
    return { ok: false, reason: "Missing image URL" };
  }

  const article: ScrapedArticle = {
    title,
    canonicalUrl,
    imageUrl,
    publishedAt,
    rawText,
  };

  return { ok: true, article };
}
