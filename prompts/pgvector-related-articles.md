# DailyBit pgvector Support and Related Articles

## Goal

Implement pgvector support and the Related Articles feature defined in `AGENTS.md` section 20:

- Enable pgvector in Supabase (manual dashboard step — documented for the user)
- Add an `embedding vector(1536)` column to `article_analyses` and create an IVFFlat cosine index
- Update the AI analysis pipeline to also generate embeddings via Google `gemini-embedding-001` with `outputDimensionality: 1536`, and save them to `article_analyses.embedding`
- Update `analyzed_at` only after both analysis and embedding are saved
- Add a `getRelatedArticles(articleId, embedding)` query function using cosine distance (`<=>`)
- Add a Related Articles section to the news details page showing up to 5 similar articles
- Do not show the Related Articles section when the current article has no embedding

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`
- `AGENTS.md` sections 7, 19, 20, 21, 22

## Existing code inspected

| File / area | State |
|-------------|-------|
| `supabase/schema.sql` | `article_analyses` table exists with all analysis columns but **no `embedding` column** |
| `src/lib/supabase/types.ts` | `ArticleAnalysisRow` has all fields but **no `embedding` field**; `ArticleDetailRow` exists; `PendingAnalysisArticle` exists |
| `src/lib/supabase/queries/analyses.ts` | `getPendingAnalysisArticles` uses LEFT JOIN logic (checks if `article_analyses` row exists); `insertArticleAnalysis` validates and inserts; `getAnalysisByArticleId` exists |
| `src/lib/supabase/queries/articles.ts` | `getArticleBySlug`, `getHomeArticles`, `markArticleAnalyzed`, `findExistingArticleUrls`, `insertArticle` exist; `toArticleDetailRow` maps analysis fields |
| `src/lib/supabase/queries/index.ts` | Re-exports all query functions |
| `src/lib/supabase/server.ts` | `createSupabaseServiceRoleClient()` exists |
| `src/lib/ai/client.ts` | Uses Google Gemini only (`createGoogle`, `gemini-3.6-flash`); `getActiveProvider()` returns `ProviderSelection` |
| `src/lib/ai/env.ts` | Only checks `GOOGLE_GENERATIVE_AI_API_KEY`; does not check `OPENAI_API_KEY` |
| `src/lib/ai/analyze.ts` | `analyzeArticle(article)` uses `generateText` with structured output; returns `AnalysisResult` with model name |
| `src/lib/ai/schema.ts` | Zod schema for structured analysis output; `AnalysisResult` type includes `model` |
| `src/lib/pipeline/analyze.ts` | `runAnalysisPipeline(options)` processes pending articles in batches; calls `analyzeArticle`, `insertArticleAnalysis`, `markArticleAnalyzed`; logs progress and summary |
| `src/lib/pipeline/types.ts` | `AnalysisSummary`, `AnalysisOptions`, `AnalysisResult` types |
| `src/app/api/analyze/route.ts` | `POST` handler; verifies admin secret; calls `runAnalysisPipeline` |
| `src/app/news/[slug]/page.tsx` | News details page; shows article content, bias analysis sidebar, AI summary sidebar; uses `getArticleBySlug` |
| `.env.example` | Has `GOOGLE_GENERATIVE_AI_API_KEY`; **does not have `OPENAI_API_KEY`** |
| `package.json` | `ai@^7.0.49`, `@ai-sdk/openai@^4.0.27`, `@ai-sdk/google@^4.0.31` installed; `zod@^4.4.3` |
| `node_modules/ai/docs/03-ai-sdk-core/30-embeddings.mdx` | `embed` function: `embed({ model, value })` returns `{ embedding }`; supports `providerOptions`; OpenAI `text-embedding-3-small` = 1536 dims; Google `gemini-embedding-001` = 3072 dims (supports `outputDimensionality`) |

## Decisions and assumptions

1. **Embedding provider strategy**: The project uses Google Gemini for analysis and embeddings. Use Google `gemini-embedding-001` with `providerOptions.google.outputDimensionality: 1536` to match the `vector(1536)` column. If `GOOGLE_GENERATIVE_AI_API_KEY` is not set, throw a clear error.
2. **Embedding input text**: Use the article title + raw text (truncated to avoid token limits) as the embedding input. This captures the article's semantic content for similarity matching.
3. **Schema change**: Add `embedding vector(1536)` column to `article_analyses` table. Create an IVFFlat cosine index on it. Update `supabase/schema.sql` with the ALTER TABLE and index creation SQL. The user must run this SQL in Supabase Dashboard → SQL Editor.
4. **Type updates**: Add `embedding: number[] | null` to `ArticleAnalysisRow` in `src/lib/supabase/types.ts`. Update `ArticleDetailRow` to include an optional `embedding` field for the details page to check if related articles should be shown.
5. **Pipeline update**: In `src/lib/pipeline/analyze.ts`, after inserting the analysis, call the embedding function and update the `article_analyses` row with the embedding. Mark `analyzed_at` only after both analysis and embedding are saved. If embedding fails, log the error but still mark the article as analyzed (the LEFT JOIN pending check will pick up articles with `embedding IS NULL` for backfill on the next run).
6. **Pending-analysis check update**: The existing `getPendingAnalysisArticles` uses LEFT JOIN logic. Articles whose `article_analyses` row exists but has `embedding IS NULL` will be picked up for embedding backfill. However, the current implementation checks if the row exists at all. I need to update it to also pick up articles where the row exists but `embedding IS NULL`.
7. **Related articles query**: Use a Supabase RPC function `get_related_articles` that takes the current article's ID, fetches its embedding, and returns up to 5 related articles ordered by cosine distance. This avoids passing raw vectors through the JS client. Create the function in SQL and call it via `.rpc()`.
8. **News details page**: Add a "Related Articles" section below the article content. Show up to 5 related article cards with title, source name, image, published date, sentiment label, and bias label. Hide the section if the current article has no embedding or no related articles are found.
9. **Backfill behavior**: When `runAnalysisPipeline` runs, it should:
   - First, process articles with no `article_analyses` row (full analysis + embedding)
   - Then, process articles with `article_analyses` row but `embedding IS NULL` (embedding backfill only — no re-analysis)
10. **No new dependencies**: All required packages (`ai`, `@ai-sdk/google`) are already installed.
11. **No env changes needed**: `GOOGLE_GENERATIVE_AI_API_KEY` is already in `.env.example`.

## Files likely to change

| File | Change |
|------|--------|
| `supabase/schema.sql` | Add `embedding vector(1536)` column to `article_analyses`; add IVFFlat cosine index; add `get_related_articles` RPC function |
| `src/lib/supabase/types.ts` | Add `embedding` field to `ArticleAnalysisRow`; add `RelatedArticleRow` type; update `ArticleDetailRow` |
| `src/lib/ai/env.ts` | No changes needed — already checks `GOOGLE_GENERATIVE_AI_API_KEY` |
| `src/lib/ai/client.ts` | Add `getEmbeddingModel()` function for Google embedding model selection |
| `src/lib/ai/embedding.ts` | New — `generateEmbedding(article)` function using `embed` from AI SDK |
| `src/lib/supabase/queries/analyses.ts` | Update `getPendingAnalysisArticles` to also pick up articles with `embedding IS NULL`; add `updateArticleEmbedding` function; add `getPendingEmbeddingArticles` function |
| `src/lib/supabase/queries/articles.ts` | Add `getRelatedArticles(articleId)` function using RPC |
| `src/lib/supabase/queries/index.ts` | Re-export new query functions |
| `src/lib/pipeline/analyze.ts` | Update `processArticle` to generate and save embedding after analysis; add embedding backfill logic |
| `src/lib/pipeline/types.ts` | Add embedding-related fields to `AnalysisSummary` |
| `src/app/news/[slug]/page.tsx` | Add Related Articles section |

## Implementation requirements

### 1. Schema changes (`supabase/schema.sql`)

Add to the `article_analyses` table section:

```sql
-- Enable pgvector extension (run in Dashboard if not already enabled)
create extension if not exists vector;

-- Add embedding column
alter table public.article_analyses
  add column if not exists embedding vector(1536);

-- Create IVFFlat cosine index
create index if not exists article_analyses_embedding_idx
  on public.article_analyses
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

Add a `get_related_articles` RPC function:

```sql
create or replace function public.get_related_articles(
  p_article_id uuid,
  p_limit int default 5
)
returns table (
  id uuid,
  title text,
  image_url text,
  published_at timestamptz,
  source_name text,
  source_logo_url text,
  sentiment_label text,
  bias_label text,
  slug text
)
language sql
stable
security definer
as $$
  select
    a.id,
    a.title,
    a.image_url,
    a.published_at,
    s.name as source_name,
    s.logo_url as source_logo_url,
    aa.sentiment_label,
    aa.bias_label,
    '' as slug
  from article_analyses aa
  join articles a on a.id = aa.article_id
  join sources s on s.id = a.source_id
  where aa.embedding is not null
    and a.analyzed_at is not null
    and a.id != p_article_id
  order by aa.embedding <=> (
    select embedding from article_analyses where article_id = p_article_id
  )
  limit p_limit;
$$;
```

Note: The `slug` field is empty in the RPC because slug generation happens in JS. The news details page will generate slugs from titles.

Grant access to the RPC function:

```sql
grant execute on function public.get_related_articles(uuid, int) to anon, authenticated;
```

### 2. Type updates (`src/lib/supabase/types.ts`)

- Add `embedding: number[] | null` to `ArticleAnalysisRow`
- Add `RelatedArticleRow` type:
  ```typescript
  export type RelatedArticleRow = {
    id: string;
    title: string;
    imageUrl: string;
    publishedAt: string;
    sourceName: string;
    sourceLogoUrl: string | null;
    sentimentLabel: SentimentLabel;
    biasLabel: BiasLabel;
    slug: string;
  };
  ```
- Update `ArticleDetailRow` to include `hasEmbedding: boolean` (so the page knows whether to show the Related Articles section)

### 3. AI env helper (`src/lib/ai/env.ts`)

- No changes needed — already checks `GOOGLE_GENERATIVE_AI_API_KEY`

### 4. AI client (`src/lib/ai/client.ts`)

- Add `getEmbeddingModel()` function:
  - Use Google `gemini-embedding-001` with `providerOptions.google.outputDimensionality: 1536`
  - Return the Google provider instance and model ID

### 5. Embedding generation (`src/lib/ai/embedding.ts`)

- New file: `src/lib/ai/embedding.ts`
- `generateEmbedding(article: PendingAnalysisArticle): Promise<number[]>`
- Build embedding input from article title + raw text (truncated to 50,000 chars)
- Use `embed` from `ai` package with the Google embedding model
- Pass `providerOptions: { google: { outputDimensionality: 1536 } }` to ensure 1536 dimensions
- Return the embedding array
- Mark with `import "server-only"`

### 6. Query updates

#### `src/lib/supabase/queries/analyses.ts`

- Update `getPendingAnalysisArticles` to also pick up articles where `article_analyses` row exists but `embedding IS NULL`:
  - Change the select to include `article_analyses ( id, embedding )`
  - Update `isPendingAnalysisArticle` to return `true` if no row exists OR if row exists but `embedding` is null
- Add `updateArticleEmbedding(articleId: string, embedding: number[]): Promise<void>`:
  - Update the `article_analyses` row with the embedding
- Add `getPendingEmbeddingArticles(limit: number): Promise<PendingAnalysisArticle[]>`:
  - Fetch articles that have an `article_analyses` row but `embedding IS NULL`
  - Return the article data for embedding backfill

#### `src/lib/supabase/queries/articles.ts`

- Add `getRelatedArticles(articleId: string, limit = 5): Promise<RelatedArticleRow[]>`:
  - Use the service role client
  - Call `.rpc('get_related_articles', { p_article_id: articleId, p_limit: limit })`
  - Map results to `RelatedArticleRow[]` with slug generated via `slugify`
  - Return empty array if no results or error

### 7. Pipeline update (`src/lib/pipeline/analyze.ts`)

- Update `processArticle` to:
  1. Call `analyzeArticle(article)` — get analysis
  2. Call `insertArticleAnalysis(input)` — save analysis
  3. Call `generateEmbedding(article)` — generate embedding
  4. Call `updateArticleEmbedding(article.id, embedding)` — save embedding
  5. Call `markArticleAnalyzed(article.id)` — mark as analyzed
  6. If embedding fails, log the error but still mark as analyzed (backfill will retry)
- Add embedding backfill loop after the main analysis loop:
  - Fetch articles with `embedding IS NULL` via `getPendingEmbeddingArticles`
  - For each, call `generateEmbedding` and `updateArticleEmbedding`
  - Log progress and summary
- Update `AnalysisSummary` to include `embeddingsGenerated` and `embeddingsFailed` counts

### 8. Pipeline types (`src/lib/pipeline/types.ts`)

- Add to `AnalysisSummary`:
  - `embeddingsGenerated: number`
  - `embeddingsFailed: number`

### 9. News details page (`src/app/news/[slug]/page.tsx`)

- Import `getRelatedArticles` and `RelatedArticleRow`
- After fetching the article, call `getRelatedArticles(article.id)`
- Add a "Related Articles" section below the article content (before the subscribe section)
- Show up to 5 related article cards in a responsive grid
- Each card shows: image, title, source name, published date, sentiment label, bias label
- Link each card to `/news/[slug]`
- Hide the section if no related articles are found
- Use the existing design system (cards, borders, typography)

### 10. Env update (`.env.example`)

No changes needed — `GOOGLE_GENERATIVE_AI_API_KEY` is already present.

## Security requirements

- Never expose `GOOGLE_GENERATIVE_AI_API_KEY` to browser code
- All AI/embedding modules must be server-only (`import "server-only"`)
- The `get_related_articles` RPC function uses `SECURITY DEFINER` but only reads public article data
- Use the service role Supabase client for all writes and RPC calls
- The Related Articles section on the news details page only displays stored data — no scraping, analysis, or embedding generation from the browser

## Acceptance criteria

- [ ] `supabase/schema.sql` updated with `embedding vector(1536)` column, IVFFlat index, and `get_related_articles` RPC function
- [ ] `src/lib/supabase/types.ts` updated with `embedding` field and `RelatedArticleRow` type
- [ ] `src/lib/ai/client.ts` has `getEmbeddingModel()` function using Google `gemini-embedding-001`
- [ ] `src/lib/ai/embedding.ts` generates embeddings using `embed` from AI SDK
- [ ] `src/lib/supabase/queries/analyses.ts` updated to pick up articles with `embedding IS NULL` and has `updateArticleEmbedding` function
- [ ] `src/lib/supabase/queries/articles.ts` has `getRelatedArticles` function using RPC
- [ ] `src/lib/pipeline/analyze.ts` generates and saves embeddings after analysis; has embedding backfill logic
- [ ] `src/lib/pipeline/types.ts` updated with embedding counts
- [ ] `src/app/news/[slug]/page.tsx` has Related Articles section
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Manual test steps

1. **Enable pgvector**: In Supabase Dashboard → Database → Extensions, enable `vector` if not already enabled.

2. **Run schema SQL**: In Supabase Dashboard → SQL Editor, run:
   ```sql
   create extension if not exists vector;
   alter table public.article_analyses
     add column if not exists embedding vector(1536);
   create index if not exists article_analyses_embedding_idx
     on public.article_analyses
     using ivfflat (embedding vector_cosine_ops)
     with (lists = 100);
   ```
   Then run the `get_related_articles` function creation SQL and grant.

3. **Set env vars**: Ensure `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY`, `DailyBit_ADMIN_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

4. **Run dev server**: `npm run dev`

5. **Run analysis with embeddings**:
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -H "x-DailyBit-admin-secret: YOUR_SECRET" \
     -d "{}"
   ```

6. **Watch terminal**: Look for logs showing:
   - Analysis started
   - Article analyzed
   - Embedding generated
   - Embedding backfill (if any articles have analysis but no embedding)
   - Summary with `embeddingsGenerated` and `embeddingsFailed` counts

7. **Verify embeddings in Supabase**:
   ```sql
   select article_id, 
          case when embedding is not null then 'has embedding' else 'no embedding' end as embedding_status
   from article_analyses
   order by created_at desc limit 20;
   ```

8. **Test Related Articles**: Navigate to any analyzed article's details page at `/news/[slug]`. Scroll below the article content. Verify the "Related Articles" section appears with up to 5 related article cards.

9. **Test no embedding**: If an article has no embedding, the Related Articles section should not appear.

10. **Verify invalid/missing admin secret returns 401**:
    ```bash
    curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d "{}"