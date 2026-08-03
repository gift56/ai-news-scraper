import "server-only";

import type { SourceRow } from "@/lib/scraping/types";

const NON_ARTICLE_KEYWORDS = [
  "/category/",
  "/tag/",
  "/topic/",
  "/author/",
  "/search",
  "/video/",
  "/show/",
  "/shows/",
  "/live/",
  "/games/",
  "/game/",
  "/shop/",
  "/about/",
  "/contact/",
  "/newsletter/",
  "/subscribe/",
  "/podcast/",
  "/podcasts/",
  "/program/",
  "/programs/",
  "/product/",
  "/review/",
  "/support/",
  "/help/",
  "/account/",
  "/login",
  "/signin",
  "/register",
  "/membership",
];

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
]);

type FilterResult = {
  kept: string[];
  rejected: string[];
};

function getPathSegments(url: string): string[] {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter((segment) => segment.length > 0);
  } catch {
    return [];
  }
}

function containsNonArticleKeyword(url: string): boolean {
  const lower = url.toLowerCase();
  return NON_ARTICLE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function isGenericTitle(url: string): boolean {
  const segments = getPathSegments(url);
  if (segments.length === 0) return true;
  const last = segments[segments.length - 1].toLowerCase();
  return GENERIC_TITLES.has(last);
}

function hasEnoughPathSegments(url: string, min: number): boolean {
  return getPathSegments(url).length >= min;
}

function matchesReuters(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  const sections = [
    "/world/",
    "/business/",
    "/technology/",
    "/legal/",
    "/sustainability/",
    "/health/",
    "/science/",
    "/sports/",
  ];

  for (const section of sections) {
    if (path.startsWith(section)) {
      const afterSection = path.slice(section.length);
      const segments = afterSection.split("/").filter((s) => s.length > 0);
      if (segments.length >= 1) {
        return true;
      }
    }
  }

  return false;
}

function matchesBBC(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();

  if (path.startsWith("/news/articles/")) {
    return true;
  }

  if (path.startsWith("/news/")) {
    const afterNews = path.slice("/news/".length);
    const segments = afterNews.split("/").filter((s) => s.length > 0);

    if (segments.length === 0) return false;

    if (segments.length === 1) return false;

    const firstSegment = segments[0];
    const singleWordSections = [
      "sport",
      "world",
      "business",
      "technology",
      "science",
      "entertainment",
      "health",
      "education",
      "climate",
      "environment",
    ];
    if (singleWordSections.includes(firstSegment) && segments.length === 2) {
      return false;
    }

    return true;
  }

  return false;
}

function matchesNPR(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();

  const datePattern = /^\/\d{4}\/\d{2}\/\d{2}\//;
  if (datePattern.test(path)) {
    return hasEnoughPathSegments(url, 4);
  }

  if (path.startsWith("/sections/")) {
    const afterSections = path.slice("/sections/".length);
    const segments = afterSections.split("/").filter((s) => s.length > 0);
    if (segments.length >= 2) {
      return true;
    }
  }

  if (path.startsWith("/") && !path.startsWith("/sections/")) {
    const segments = getPathSegments(url);
    if (segments.length >= 3 && /^\d+$/.test(segments[0])) {
      return true;
    }
  }

  return false;
}

function matchesFox(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  const sections = [
    "/politics/",
    "/world/",
    "/science/",
    "/tech/",
    "/health/",
    "/entertainment/",
    "/lifestyle/",
    "/sports/",
    "/business/",
    "/us/",
  ];

  for (const section of sections) {
    if (path.startsWith(section)) {
      const afterSection = path.slice(section.length);
      const segments = afterSection.split("/").filter((s) => s.length > 0);
      if (segments.length >= 1) {
        return true;
      }
    }
  }

  return false;
}

function matchesGuardian(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();

  const datePattern = /^\/[a-z]+\/\d{4}\/[a-z]{3}\/\d{2}\//;
  if (datePattern.test(path)) {
    return true;
  }

  const altDatePattern = /^\/\d{4}\/[a-z]{3}\/\d{2}\//;
  if (altDatePattern.test(path)) {
    return true;
  }

  return false;
}

function matchesGeneric(url: string): boolean {
  if (!hasEnoughPathSegments(url, 3)) {
    return false;
  }

  if (url.endsWith("/")) {
    return false;
  }

  if (isGenericTitle(url)) {
    return false;
  }

  return true;
}

function matchesSourcePattern(url: string, strategy: string): boolean {
  switch (strategy) {
    case "reuters":
      return matchesReuters(url);
    case "bbc":
      return matchesBBC(url);
    case "npr":
      return matchesNPR(url);
    case "fox":
      return matchesFox(url);
    case "guardian":
      return matchesGuardian(url);
    default:
      return matchesGeneric(url);
  }
}

export function filterCandidateUrls(
  urls: string[],
  source: SourceRow,
): FilterResult {
  const kept: string[] = [];
  const rejected: string[] = [];

  for (const url of urls) {
    if (containsNonArticleKeyword(url)) {
      rejected.push(url);
      continue;
    }

    const strategy = source.parser_strategy ?? "";
    if (matchesSourcePattern(url, strategy)) {
      kept.push(url);
    } else {
      rejected.push(url);
    }
  }

  return { kept, rejected };
}
