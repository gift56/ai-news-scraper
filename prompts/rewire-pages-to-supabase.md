# Rewire Home and News Details Pages to Fetch Articles from Supabase

## Goal

Replace mock data (`mockHomeArticles`, `featuredAnalysis`) in `src/app/page.tsx` and `src/app/news/[slug]/page.tsx` with real Supabase queries (`getHomeArticles`, `getArticleBySlug`). Reshape components to match the one-article-per-source schema (`HomeArticleRow`, `ArticleDetailRow`). Add empty-state feedback when no articles exist yet. Provide a dummy article SQL snippet for manual testing.

## Skills read

- `supabase` skill — query patterns, service role client, joined table filter gotcha
- Next.js docs in `node_modules/next/dist/docs/` — server components, dynamic routes, metadata

## Existing code inspected

- `supabase/schema.sql` — sources, articles, article_analyses tables; RLS allows public read on analyzed articles
- `supabase/seed.sql` — 5 active sources (Reuters, BBC, NPR, Fox, Guardian)
- `src/lib/supabase/queries/articles.ts` — `getHomeArticles(limit)`, `getArticleBySlug(slug)`, `toHomeArticleRow`, `toArticleDetailRow` already implemented and tested
- `src/lib/supabase/types.ts` — `HomeArticleRow` and `ArticleDetailRow` types match schema
- `src/lib/supabase/server.ts` — `createSupabaseServiceRoleClient()` server-only
- `src/lib/supabase/slugify.ts` — `slugify(title)` used for URL slugs
- `src/lib/home/mock-articles.ts` — `HomeArticle` type with fields not in schema (imageAlt, category, region)
- `src/lib/seo/json-ld.ts` — imports `HomeArticle` from mock-articles; must switch to `HomeArticleRow`
- `src/components/ui/news-card.tsx` — grid card uses category, region, imageAlt (not in schema); list card uses summary, timeAgo, readTime (not in schema)
- `src/components/ui/bias-meter.tsx` — no changes needed
- `src/app/page.tsx` — uses `mockHomeArticles`, `buildHomeJsonLd`
- `src/app/news/[slug]/page.tsx` — uses `mockHomeArticles`, `featuredAnalysis` with mock multi-source clustering (sourceCount, sourceBreakdown, topSources, bullets, body, heroCaption, author, readTime, generatedAt) that does not map to one-article-per-source schema
- `src/app/news/[slug]/not-found.tsx` — static not-found UI, no changes

## Decisions and assumptions

1. **Home page** becomes an async server component that calls `getHomeArticles()` and renders `NewsCard` grid from `HomeArticleRow[]`.
2. **News details page** becomes an async server component that calls `getArticleBySlug(slug)` and renders from `ArticleDetailRow`.
3. **NewsCard grid** is reshaped: replace `category`/`region` with source name + sentiment label; replace `imageAlt` with the article title; add `confidence` and `biasLabel` display; keep bias percentages and `BiasMeter`.
4. **NewsCard list** is not currently used on either page; leave it but update its props to stay consistent (or leave as-is if unused — decision: leave as-is to minimize scope).
5. **Details page** removes mock multi-source clustering: no `sourceCount`, no `sourceBreakdown`, no `topSources`, no `bullets`, no `body`, no `heroCaption`, no `author`, no `readTime`, no `generatedAt`. Instead:
   - Article body = `rawText` split into paragraphs by newlines.
   - AI Summary card shows `analysis.summary` as a single block (not bullets).
   - Bias Analysis sidebar shows single-source framing: "Based on 1 source: {sourceName}".
   - Source Breakdown sidebar card is removed (one article = one source, no breakdown).
   - Related Stories section is removed for now (pgvector related articles come in section 20, not this task).
   - Metadata (byline) shows source name and published date; no author/readTime.
6. **Empty state**: when `getHomeArticles()` returns `[]`, show a friendly message explaining no articles have been scraped/analyzed yet. When `getArticleBySlug()` returns `null`, call `notFound()`.
7. **JSON-LD**: update `buildHomeJsonLd` to accept `HomeArticleRow[]` instead of `HomeArticle[]`.
8. **`generateStaticParams`**: remove it from the details page (articles are dynamic, not known at build time). Keep `dynamic = "force-dynamic"`.
9. **Metadata**: home page OG image falls back to a static placeholder when no articles exist. Details page metadata uses `ArticleDetailRow` fields.
10. **Dummy article SQL**: provide a complete snippet that inserts a source, an article, and an analysis so the user can test the pages immediately without running the scraper.

## Files likely to change

- `src/app/page.tsx` — rewrite to async server component, fetch from Supabase, add empty state
- `src/app/news/[slug]/page.tsx` — rewrite to async server component, fetch from Supabase, reshape UI to `ArticleDetailRow`, remove mock clustering
- `src/lib/seo/json-ld.ts` — switch `HomeArticle` import to `HomeArticleRow`
- `src/components/ui/news-card.tsx` — reshape grid card props to match `HomeArticleRow`
- `supabase/dummy-article.sql` — new file with copy-paste dummy data

## Implementation requirements

### 1. `src/lib/seo/json-ld.ts`

- Replace `import type { HomeArticle }` with `import type { HomeArticleRow } from "@/lib/supabase/types"`.
- Update `buildHomeJsonLd(articles: HomeArticleRow[])`.
- `article.sourceName` and `article.publishedAt` still exist on `HomeArticleRow`, so the mapping stays the same.

### 2. `src/components/ui/news-card.tsx`

- `NewsCardGridProps`: remove `category`, `region`, `imageAlt`; add `sentimentLabel`, `biasLabel`, `confidence`, `publishedAt`.
- Use `title` as image alt text.
- Replace `{category} - {region}` caption with source name + sentiment label (e.g. "Reuters · Neutral").
- Show confidence as a small badge or text.
- Keep `BiasMeter` with left/center/right percentages.
- Keep `sourceName` display.
- `NewsCardListProps`: leave unchanged (not used on target pages).

### 3. `src/app/page.tsx`

- Convert `HomePage` to `async function HomePage()`.
- Call `getHomeArticles()` inside try/catch.
- If empty array: render empty state (icon, heading, message: "No articles yet. Run the scraper to populate the homepage.").
- If error: render error state (heading "Something went wrong", message).
- If articles: render grid of `NewsCard` with `HomeArticleRow` props.
- Update `metadata` to not depend on `mockHomeArticles[0]`; use a static OG image URL or omit image when no data.
- Call `buildHomeJsonLd(articles)` with the fetched rows.

### 4. `src/app/news/[slug]/page.tsx`

- Remove `mockHomeArticles` and `featuredAnalysis` imports.
- Remove `generateStaticParams`.
- `generateMetadata`: call `getArticleBySlug(slug)`; if null, return not-found metadata; else build from `ArticleDetailRow`.
- `NewsDetailsPage`: call `getArticleBySlug(slug)`; if null, `notFound()`.
- Reshape UI:
  - Hero image: `article.imageUrl`, alt = `article.title`.
  - Byline: source name + formatted published date. No author, no readTime.
  - Bias Distribution section: show `BiasMeter` with analysis percentages; caption "AI-estimated framing · 1 source".
  - Article body: split `article.rawText` by `\n` into paragraphs.
  - Bias Analysis sidebar: show overall bias label + percentages + `framingNotes`. "Based on 1 source: {source.name}".
  - AI Summary sidebar: show `analysis.summary` as a paragraph. Show sentiment + confidence. Show loaded terms. Show disclaimer. Remove bullets.
  - Remove Source Breakdown sidebar card entirely.
  - Remove Related Stories section (pgvector comes later).
  - Keep newsletter CTA section.
- Helper functions: remove `getArticleBySlug` (mock), `getAnalysis` (mock), `formatOverallBias` (keep, adapt), `getTopBias` (remove), `capitalize` (keep). Add `formatDate` (keep). Add `splitParagraphs(rawText)` helper.

### 5. `supabase/dummy-article.sql`

- Insert one source (or reuse seeded Reuters).
- Insert one article with realistic title, image URL, published_at, raw_text.
- Set `analyzed_at` to now.
- Insert one article_analyses row with valid percentages summing to 100, valid sentiment/bias labels, confidence, framing notes, loaded terms (JSON array), disclaimer, model.
- Use `on conflict do nothing` for the source.

## Security requirements

- All Supabase calls use the service role client (server-only) — already enforced by `articles.ts`.
- No secrets exposed to browser.
- Pages are server components; no client-side fetching.

## Acceptance criteria

- [ ] Home page fetches from `getHomeArticles()` and renders real articles when present.
- [ ] Home page shows empty state when no articles exist.
- [ ] News details page fetches from `getArticleBySlug(slug)` and renders real article + analysis.
- [ ] News details page calls `notFound()` when slug doesn't match.
- [ ] No references to `mockHomeArticles` or `featuredAnalysis` remain in page files.
- [ ] `json-ld.ts` uses `HomeArticleRow` type.
- [ ] `NewsCard` grid props match `HomeArticleRow` shape.
- [ ] No mock multi-source clustering (sourceCount, sourceBreakdown, topSources, bullets, body, heroCaption, author, readTime, generatedAt) in details page.
- [ ] Dummy SQL file is copy-paste ready.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build` (routes and server modules changed)

## Exact manual test steps

1. Run `supabase/schema.sql` in Supabase SQL Editor (if not already done).
2. Run `supabase/seed.sql` (if not already done).
3. Copy and paste `supabase/dummy-article.sql` into Supabase SQL Editor and run.
4. Start dev server: `npm run dev`.
5. Open `http://localhost:3000` — should see the dummy article card.
6. Click the card — should see the full details page with analysis.
7. To test empty state: delete all articles from Supabase, refresh homepage — should see empty state message.