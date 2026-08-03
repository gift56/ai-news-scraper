# DailyBit Oxylabs Scraping Pipeline

## Goal

Implement the manual scrape-to-insert pipeline defined in `AGENTS.md` sections 9–13 and 16:

- fetch source homepages live through the Oxylabs Web Scraper Realtime API
- extract candidate article links from homepage story cards using Cheerio
- filter candidates against the non-article reject list and source-specific URL patterns
- dedupe candidates against existing articles in Supabase (chunked URL existence check)
- scrape article detail pages through Oxylabs
- validate and clean each detail page against the article content gate
- insert only valid articles (append-only) into Supabase
- emit run logging to the server console and return a final summary object
- expose `POST /api/scrape` protected by `x-DailyBit-admin-secret`

This task is **scraping only**. It does **not** include AI analysis, Oxylabs Scheduler, Vercel Cron, pgvector, or UI changes.

## Skills read

- `.agents/skills/oxylabs-web-scraper/SKILL.md`
- `.agents/skills/oxylabs-web-scraper/examples.md`
- `.agents/skills/oxylabs-web-scraper/sources.md`
- `.agents/skills/supabase/SKILL.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `AGENTS.md` sections 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 22

## Existing code inspected

| File / area | State |
|-------------|-------|
| `supabase/schema.sql` | Full schema exists: `sources`, `articles`, `article_analyses`, `logs`, `oxylabs_schedules`, `oxylabs_schedule_runs` with RLS and grants |
| `supabase/seed.sql` | 5 active sources: Reuters, BBC, NPR, Fox News, The Guardian (each with `parser_strategy`) |
| `src/lib/supabase/types.ts` | Typed rows for all tables; `ArticleInsert`, `SourceRow` available |
| `src/lib/supabase/server.ts` | `createSupabaseServiceRoleClient()` exists |
| `src/lib/supabase/env.ts` | `getAdminSecret()` exists; no Oxylabs env helper yet |
| `src/lib/supabase/queries/sources.ts` | `getActiveSources()`, `getSourceById()`, `getAllSources()` exist |
| `src/lib/supabase/queries/articles.ts` | `findExistingArticleUrls()` (chunked, 15 max), `insertArticle()` exist |
| `src/lib/supabase/queries/logs.ts` | `insertLog()` exists |
| `src/lib/admin/verify-admin-secret.ts` | `verifyAdminSecret()`, `unauthorizedAdminResponse()` exist |
| `src/app/api/sources/route.ts` | `GET /api/sources` exists (no admin secret) |
| `src/app/api/logs/route.ts` | `GET /api/logs` exists (admin secret protected) |
| `.env.example` | `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, `DailyBit_ADMIN_SECRET` documented |
| `package.json` | Next.js 16.2.11, Supabase installed; **cheerio and zod not installed** |
| `biome.json` | Biome 2.2.0, 2-space indent, organize imports on |

## Decisions and assumptions

1. Install `cheerio` and `zod` as pinned dependencies. Cheerio is used for HTML parsing; Zod is used to validate the Oxylabs API response shape before reading `content`.
2. Create a dedicated `src/lib/oxylabs/` module for the Oxylabs Realtime API client and env validation — server-only, never imported by browser code.
3. Create a dedicated `src/lib/scraping/` module for parsing, extraction, filtering, validation, and cleanup — server-only.
4. Create a dedicated `src/lib/pipeline/` module for scrape-to-insert orchestration and run logging — server-only.
5. The Oxylabs Realtime endpoint (`POST https://realtime.oxylabs.io/v1/queries`) is used for both homepage and article detail page fetches with `source: "universal"`. No Push-Pull or Scheduler API calls in this task.
6. Use `render: "html"` for homepage fetches because modern news sites are JavaScript-heavy. Article detail pages may also need rendering; enable it for both to maximize content retrieval.
7. Source-specific URL filtering uses the `parser_strategy` field stored in `sources` (`reuters`, `bbc`, `npr`, `fox`, `guardian`). A generic fallback rejects obvious non-article paths.
8. Article text extraction uses Cheerio to select common article body containers (`article`, `[data-testid*="article"]`, `.article-body`, `[class*="article__body"]`, `main`). If no container matches, fall back to all `<p>` tags in the document.
9. Published date extraction checks `<meta property="article:published_time">`, `<time datetime="...">`, and JSON-LD `datePublished`.
10. Image URL extraction checks `<meta property="og:image">`, `<meta name="twitter:image">`, and the first `<img>` inside the article body with a valid `src`.
11. Canonical URL extraction checks `<link rel="canonical">` and falls back to the scraped URL.
12. The pipeline accepts optional `sourceIds` and `perSourceLimit` parameters. Defaults: all active sources, 5 valid articles per source.
13. Run logging uses `console.log`/`console.error` for server-side progress and returns a typed `ScrapeSummary` object in the API response. Logs are also persisted to the `logs` table via `insertLog()`.
14. No schema changes are needed — all required tables and columns already exist.
15. Do not modify existing UI pages, API routes, or query modules. Only add new files and install dependencies.

## Files likely to change

| File | Change |
|------|--------|
| `package.json` | Add `cheerio` and `zod` dependencies |
| `package-lock.json` | Lock new deps |
| `src/lib/oxylabs/env.ts` | New — Oxylabs env validation |
| `src/lib/oxylabs/client.ts` | New — Oxylabs Realtime API client |
| `src/lib/scraping/types.ts` | New — shared scraping types |
| `src/lib/scraping/extract-links.ts` | New — homepage candidate link extraction |
| `src/lib/scraping/filter-urls.ts` | New — candidate URL filtering + non-article reject list |
| `src/lib/scraping/parse-article.ts` | New — article detail page parsing, validation, cleanup |
| `src/lib/pipeline/scrape.ts` | New — scrape-to-insert pipeline orchestration + run logging |
| `src/app/api/scrape/route.ts` | New — `POST /api/scrape` route |

## Implementation requirements

### 1. Dependencies

Install pinned versions of:

- `cheerio` — HTML parsing for link extraction and article body cleanup
- `zod` — validate Oxylabs API response shape

### 2. Oxylabs env helper (`src/lib/oxylabs/env.ts`)

- `getOxylabsEnv()` — read and validate `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD` from `process.env`; throw if missing.
- Mark with `import "server-only"`.

### 3. Oxylabs client (`src/lib/oxylabs/client.ts`)

- `scrapeUrl(url: string, options?: { render?: boolean }): Promise<string>` — calls `POST https://realtime.oxylabs.io/v1/queries` with HTTP Basic Auth, `source: "universal"`, `render: "html"` by default.
- Use the native `fetch` API.
- Set a timeout of 180 seconds for rendered requests (per Oxylabs skill guidance).
- Parse the response with Zod: validate `results` is an array with at least one element, each element has `content` (string) and `status_code` (number).
- Return `results[0].content` (the HTML string).
- Throw a typed error with the Oxylabs error message if the response shape is invalid or `status_code` is not 200.
- Mark with `import "server-only"`.

### 4. Scraping types (`src/lib/scraping/types.ts`)

Define:

- `CandidateLink` — `{ url: string; title: string | null }`
- `ScrapedArticle` — `{ title: string; canonicalUrl: string; imageUrl: string; publishedAt: string; rawText: string }`
- `ArticleValidationResult` — `{ ok: true; article: ScrapedArticle } | { ok: false; reason: string }`
- `ScrapeSummary` — `{ status: "completed" | "failed"; sourcesChecked: number; candidatesFound: number; candidatesRejected: number; duplicatesSkipped: number; detailPagesScraped: number; articlesInserted: number; articlesRejected: number; articlesFailed: number; totalDurationMs: number; rejectionReasons: Record<string, number> }`
- `ScrapeOptions` — `{ sourceIds?: string[]; perSourceLimit?: number }`
- `ScrapeResult` — `{ summary: ScrapeSummary }`

### 5. Homepage link extraction (`src/lib/scraping/extract-links.ts`)

- `extractCandidateLinks(html: string, source: SourceRow): CandidateLink[]`
- Load HTML with Cheerio.
- Extract links from visible story card areas only: look for `<a>` tags inside common card containers (`article`, `[data-testid*="card"]`, `[class*="card"]`, `[class*="story"]`, `[class*="headline"]`, `h1 a`, `h2 a`, `h3 a`).
- For each candidate, resolve relative URLs against the source `listing_url`.
- Return `{ url, title }` where title is the link text or nearest heading text.
- Deduplicate by URL within the same source.
- Do not collect navigation, footer, header, sidebar, or menu links.

### 6. Candidate URL filtering (`src/lib/scraping/filter-urls.ts`)

- `filterCandidateUrls(urls: string[], source: SourceRow): { kept: string[]; rejected: string[] }`
- Implement the **non-article reject list** (section 9): category/section pages, topic/tag pages, author pages, search pages, navigation/menu/footer links, show/program/podcast pages, live pages, game pages, product/review/shopping pages, corporate/support pages, newsletter/subscription pages, video-only pages.
- Implement source-specific article URL patterns using `source.parser_strategy`:
  - `reuters`: keep URLs matching `/world/`, `/business/`, `/technology/`, `/legal/`, `/sustainability/`, `/health/`, `/science/`, `/sports/` with a long slug path (reject `/world/africa` style category pages — require at least one path segment after the section).
  - `bbc`: keep URLs matching `/news/articles/` or `/news/` with a long slug; reject `/news/sport`, `/news/world/asia` category pages.
  - `npr`: keep URLs matching `/YYYY/MM/DD/` or `/sections/` with a long slug; reject `/sections/politics` style section pages.
  - `fox`: keep URLs matching `/politics/`, `/world/`, `/science/`, `/tech/`, `/health/`, `/entertainment/` with a long slug; reject `/shows/`, `/games/`, `/live/`.
  - `guardian`: keep URLs matching `/YYYY/mon/DD/` date-based paths; reject `/us/environment`, `/thefilter-us` section pages.
  - Generic fallback: reject URLs with fewer than 3 path segments, URLs ending in `/`, and URLs containing known non-article keywords (`/category/`, `/tag/`, `/topic/`, `/author/`, `/search`, `/video/`, `/show/`, `/live/`, `/games/`, `/shop/`, `/about/`, `/contact/`, `/newsletter/`, `/subscribe/`, `/podcast/`).
- If uncertain, use the stricter choice and reject.
- Return both kept and rejected arrays so the pipeline can count rejections.

### 7. Article detail parsing and validation (`src/lib/scraping/parse-article.ts`)

- `parseArticle(html: string, url: string): ArticleValidationResult`
- Load HTML with Cheerio.
- Extract title: `<meta property="og:title">`, `<title>`, or first `<h1>`.
- Extract canonical URL: `<link rel="canonical">` href, or fall back to `url`.
- Extract published date: `<meta property="article:published_time">`, `<time datetime="...">`, or JSON-LD `datePublished`. Reject if missing.
- Extract image URL: `<meta property="og:image">`, `<meta name="twitter:image">`, or first `<img>` inside the article body with a valid `src`. Reject if missing.
- Extract raw text:
  - Remove `<script>`, `<style>`, `<noscript>`, `<aside>`, `<nav>`, `<header>`, `<footer>`, `<form>`, `<iframe>` elements.
  - Remove elements with classes/ids containing: `newsletter`, `subscribe`, `related`, `most-viewed`, `most-popular`, `load-more`, `social`, `share`, `ad`, `sponsor`, `promo`, `navigation`, `breadcrumb`, `sidebar`, `comments`.
  - Select article body: try `article`, `[data-testid*="article"]`, `[class*="article__body"]`, `[class*="article-body"]`, `[class*="story__body"]`, `[class*="content__body"]`, `main`, then fall back to all `<p>` in `body`.
  - Extract text from `<p>` tags within the body container. Join with `\n\n`.
  - If a single `<p>` contains the entire body (one large paragraph), split by sentence boundaries or DOM block elements.
- Clean raw text: collapse whitespace, remove repeated navigation labels, remove inline JS error text, remove CSS class dumps.
- Validate against the **article content gate** (section 13):
  - Must have article-specific URL, title, image URL, published date.
  - Title must not be generic or a category/section/show name.
  - Body must pass: 3+ meaningful paragraphs OR 900+ meaningful characters.
  - Canonical URL must not point to a listing/category/program/product page.
- Return `{ ok: true, article }` or `{ ok: false, reason }`.

### 8. Scrape-to-insert pipeline (`src/lib/pipeline/scrape.ts`)

- `runScrapePipeline(options?: ScrapeOptions): Promise<ScrapeResult>`
- Implement the exact **scrape-to-insert pipeline** (section 9):
  1. Load selected active sources from Supabase (all active by default, or filtered by `options.sourceIds`).
  2. For each source:
     a. Log "per-source start".
     b. Fetch homepage HTML via `scrapeUrl(source.listing_url)`.
     c. Log "homepage fetched".
     d. Extract candidate links via `extractCandidateLinks(html, source)`.
     e. Log "candidate links found" with count.
     f. Filter candidates via `filterCandidateUrls(urls, source)`.
     g. Log "candidates rejected before detail scrape" with count.
     h. Normalize and dedupe candidate URLs.
     i. Check existing URLs via `findExistingArticleUrls()` (chunked, 15 max).
     j. Log "duplicates skipped" with count.
     k. For each remaining candidate (up to `perSourceLimit` valid articles):
        - Scrape detail page via `scrapeUrl(candidateUrl)`.
        - Parse and validate via `parseArticle(html, candidateUrl)`.
        - If valid, insert via `insertArticle()` with `source_id`, `original_url`, `canonical_url`, `title`, `image_url`, `published_at`, `raw_text`.
        - If invalid, increment rejection count and record reason.
        - Log per-article progress.
        - Stop when `perSourceLimit` valid articles have been inserted for this source.
  3. Emit run logging (section 9): console messages for each step and a final summary object.
  4. Persist a summary log to the `logs` table via `insertLog("info", "Scrape completed", summary)`.
  5. On source-level error, log the error and continue to the next source.
  6. Return `{ summary }`.
- Default `perSourceLimit` is 5.
- Handle errors gracefully: a single source failure should not abort the entire run.

### 9. API route (`src/app/api/scrape/route.ts`)

- `POST` handler only.
- Verify `x-DailyBit-admin-secret` header via `verifyAdminSecret()`. Return 401 if missing/invalid.
- Parse optional JSON body: `{ sourceIds?: string[]; perSourceLimit?: number }`.
- Call `runScrapePipeline(options)`.
- Return `200` with the summary object on success.
- Return `500` with `{ error: message }` on unhandled failure.
- Do not cache this route.

## Security requirements

- Never expose `OXY_WSA_USERNAME` or `OXY_WSA_PASSWORD` to browser code.
- All Oxylabs and scraping modules must be server-only (`import "server-only"`).
- `POST /api/scrape` must require `x-DailyBit-admin-secret` header; reject with 401 if missing/invalid.
- Do not put the admin secret in URL query strings.
- Do not run Oxylabs calls, scraping, or parsing from browser code.
- Use the service role Supabase client for all writes.

## Acceptance criteria

- [ ] `cheerio` and `zod` installed and pinned in `package.json`
- [ ] `src/lib/oxylabs/env.ts` validates Oxylabs credentials server-side
- [ ] `src/lib/oxylabs/client.ts` calls Oxylabs Realtime API with Basic Auth and Zod-validated response
- [ ] `src/lib/scraping/extract-links.ts` extracts candidate links from homepage story cards only
- [ ] `src/lib/scraping/filter-urls.ts` implements the non-article reject list and source-specific patterns
- [ ] `src/lib/scraping/parse-article.ts` validates articles against the content gate and cleans raw text
- [ ] `src/lib/pipeline/scrape.ts` runs the full scrape-to-insert pipeline with run logging
- [ ] `POST /api/scrape` requires admin secret and returns the summary object
- [ ] No existing UI pages or query modules modified
- [ ] No schema changes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Manual test steps

1. Ensure `.env.local` has `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, `DailyBit_ADMIN_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` set.
2. Ensure `supabase/schema.sql` and `supabase/seed.sql` have been run in Supabase so active sources exist.
3. Run `npm run dev`.
4. Trigger a manual scrape (all active sources, 5 per source):
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -H "x-DailyBit-admin-secret: YOUR_SECRET" \
     -d "{}"
   ```
5. Trigger a scrape with a per-source limit:
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -H "x-DailyBit-admin-secret: YOUR_SECRET" \
     -d '{"perSourceLimit": 3}'
   ```
6. Watch the dev server terminal for run logging: scrape started, selected sources, per-source start, homepage fetched, candidate links found, candidates rejected, duplicates skipped, detail pages scraped, articles inserted, articles rejected, scrape completed.
7. Confirm the API response contains the `summary` object with all fields populated.
8. Confirm invalid/missing admin secret returns `401`:
   ```bash
   curl -X POST http://localhost:3000/api/scrape -H "Content-Type: application/json" -d "{}"
   ```
9. Query Supabase to verify articles were inserted:
   ```sql
   select title, original_url, source_id, published_at from articles order by created_at desc limit 20;
   ```
10. Confirm no homepage, listing, category, or non-article pages were saved as articles.