# DailyBit AI Article Analysis Pipeline

## Goal

Implement the AI article analysis pipeline defined in `AGENTS.md` section 19:

- detect pending articles (no `article_analyses` row exists) via LEFT JOIN logic
- process pending articles in configurable batches until none remain
- call an AI model to generate structured analysis output (summary, sentiment, bias framing, loaded terms, disclaimer)
- validate AI output with Zod before saving
- save analysis to `article_analyses` and mark `analyzed_at` only after valid analysis is saved
- log neat console progress during the run and a final summary object
- expose `POST /api/analyze` protected by `x-DailyBit-admin-secret`

This task is **AI analysis only**. It does **not** include pgvector embeddings (section 20), Oxylabs Scheduler, Vercel Cron, or UI changes.

## Provider fallback strategy

The user requested: "if the OpenAI secret key can't get the job done, we can make use of Gemini API just in case."

Implementation:

- **Primary provider**: OpenAI via `@ai-sdk/openai` (`OPENAI_API_KEY`)
- **Fallback provider**: Google Gemini via `@ai-sdk/google` (`GOOGLE_GENERATIVE_AI_API_KEY`)
- If `OPENAI_API_KEY` is set, use OpenAI. If OpenAI is missing or the call fails, fall back to Gemini if `GOOGLE_GENERATIVE_AI_API_KEY` is set.
- If neither key is set, throw a clear error.
- The `model` field saved in `article_analyses` records which provider/model was used.

## Skills read

- `.agents/skills/ai-sdk/SKILL.md`
- `.agents/skills/supabase/SKILL.md`
- `AGENTS.md` sections 7, 14, 15, 17, 19, 21, 22

## Existing code inspected

| File / area | State |
|-------------|-------|
| `supabase/schema.sql` | `article_analyses` table exists with all required columns: `summary`, `sentiment_score`, `sentiment_label`, `bias_score`, `bias_label`, `left_percentage`, `center_percentage`, `right_percentage`, `confidence`, `framing_notes`, `loaded_terms` (jsonb), `disclaimer`, `model` |
| `src/lib/supabase/types.ts` | `ArticleAnalysisRow`, `ArticleAnalysisInsert`, `PendingAnalysisArticle`, `SentimentLabel`, `BiasLabel` types exist |
| `src/lib/supabase/queries/analyses.ts` | `getPendingAnalysisArticles(limit)` uses LEFT JOIN logic (checks if `article_analyses` row exists); `insertArticleAnalysis(input)` validates and inserts; `getAnalysisByArticleId(articleId)` exists |
| `src/lib/supabase/queries/articles.ts` | `markArticleAnalyzed(articleId, analyzedAt)` exists |
| `src/lib/supabase/queries/logs.ts` | `insertLog(level, message, context)` exists |
| `src/lib/supabase/queries/index.ts` | Re-exports all query functions |
| `src/lib/supabase/server.ts` | `createSupabaseServiceRoleClient()` exists |
| `src/lib/supabase/env.ts` | `getAdminSecret()` exists |
| `src/lib/admin/verify-admin-secret.ts` | `verifyAdminSecret(request)`, `unauthorizedAdminResponse()` exist |
| `src/lib/pipeline/scrape.ts` | Scrape pipeline pattern: console logging, summary object, `insertLog()` at end |
| `src/app/api/scrape/route.ts` | `POST` route pattern: verify admin secret, parse body, call pipeline, return summary |
| `src/lib/oxylabs/client.ts` | API client pattern: server-only, Zod validation, typed errors |
| `src/lib/oxylabs/env.ts` | Env validation pattern: server-only, throw if missing |
| `.env.example` | `OPENAI_API_KEY` documented; `ANALYSIS_BATCH_SIZE` documented |
| `package.json` | Next.js 16.2.11, zod 4.4.3 installed; **`ai`, `@ai-sdk/openai`, `@ai-sdk/google` not installed** |
| `biome.json` | Biome 2.2.0, 2-space indent, organize imports on |

## Decisions and assumptions

1. Install `ai`, `@ai-sdk/openai`, and `@ai-sdk/google` as pinned dependencies. The AI SDK provides `generateText` with structured output via Zod schema.
2. Create a dedicated `src/lib/ai/` module for AI env validation, provider selection, analysis schema, and the analysis function — server-only, never imported by browser code.
3. Create a dedicated `src/lib/pipeline/analyze.ts` for analysis orchestration and run logging — server-only.
4. Use `generateText` with a Zod schema (`object`) to get structured analysis output. The AI SDK's structured output feature ensures the model returns data matching the schema.
5. Provider selection: try OpenAI first (`openai("gpt-4o-mini")`); if `OPENAI_API_KEY` is missing or the call fails, fall back to Google Gemini (`google("gemini-1.5-flash")`) if `GOOGLE_GENERATIVE_AI_API_KEY` is set.
6. The analysis prompt instructs the model to analyze the article text and return: neutral summary, sentiment score/label, political framing percentages (left/center/right summing to 100), bias label, confidence, framing notes, loaded terms, and disclaimer.
7. Bias score is derived as `(right_percentage - left_percentage) / 100` after receiving the AI output.
8. The pipeline accepts optional `limit` and `articleIds` parameters. Defaults: process all pending articles in batches of `ANALYSIS_BATCH_SIZE` (default 5).
9. Run logging uses `console.log`/`console.error` for server-side progress and returns a typed `AnalysisSummary` object in the API response. Logs are also persisted to the `logs` table via `insertLog()`.
10. No schema changes needed — all required columns exist.
11. Do not modify existing UI pages, scrape route, or query modules. Only add new files and install dependencies.
12. The AI SDK skill says to read bundled docs at `node_modules/ai/docs/` after installing. I will verify the `generateText` API and structured output API against the bundled docs before writing the analysis function.
13. Add `GOOGLE_GENERATIVE_AI_API_KEY` to `.env.example` as a server-only env var for the Gemini fallback.

## Files likely to change

| File | Change |
|------|--------|
| `package.json` | Add `ai`, `@ai-sdk/openai`, `@ai-sdk/google` dependencies |
| `package-lock.json` | Lock new deps |
| `.env.example` | Add `GOOGLE_GENERATIVE_AI_API_KEY` |
| `src/lib/ai/env.ts` | New — AI env validation (OpenAI + Gemini) |
| `src/lib/ai/schema.ts` | New — Zod schema for structured analysis output |
| `src/lib/ai/client.ts` | New — provider selection (OpenAI primary, Gemini fallback) |
| `src/lib/ai/analyze.ts` | New — `analyzeArticle()` function using `generateText` |
| `src/lib/pipeline/analyze.ts` | New — analysis pipeline orchestration + run logging |
| `src/lib/pipeline/types.ts` | New — shared analysis pipeline types |
| `src/app/api/analyze/route.ts` | New — `POST /api/analyze` route |

## Implementation requirements

### 1. Dependencies

Install pinned versions of:

- `ai` — Vercel AI SDK core (`generateText`, structured output)
- `@ai-sdk/openai` — OpenAI provider
- `@ai-sdk/google` — Google Gemini provider (fallback)

After installing, read `node_modules/ai/docs/` to verify the `generateText` API and structured output syntax for the installed version.

### 2. AI env helper (`src/lib/ai/env.ts`)

- `getAiEnv()` — read `OPENAI_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` from `process.env`.
- Return `{ openaiApiKey: string | null, geminiApiKey: string | null }`.
- Throw if neither key is set.
- Mark with `import "server-only"`.

### 3. Analysis schema (`src/lib/ai/schema.ts`)

- Define a Zod schema for the structured AI output:
  - `summary`: string (min 1)
  - `sentimentScore`: number (-1 to 1)
  - `sentimentLabel`: enum `positive | neutral | negative`
  - `leftPercentage`: number (0-100)
  - `centerPercentage`: number (0-100)
  - `rightPercentage`: number (0-100)
  - `politicalFramingLabel`: enum `left | center | right | mixed | unclear`
  - `confidence`: number (0-1)
  - `framingNotes`: string
  - `loadedTerms`: array of string
  - `disclaimer`: string
- Add a refine to ensure `leftPercentage + centerPercentage + rightPercentage === 100`.
- Export the schema and inferred type.

### 4. AI client and provider selection (`src/lib/ai/client.ts`)

- `getActiveProvider()` — returns the provider to use based on available env vars.
  - If `OPENAI_API_KEY` is set, return `{ provider: openai, modelId: "gpt-4o-mini", modelName: "gpt-4o-mini" }`.
  - Else if `GOOGLE_GENERATIVE_AI_API_KEY` is set, return `{ provider: google, modelId: "gemini-1.5-flash", modelName: "gemini-1.5-flash" }`.
  - Else throw.
- Export a function to create a fallback provider for retry logic.
- Mark with `import "server-only"`.
- Verify exact model IDs against bundled docs or provider docs — do not use model IDs from memory.

### 5. Article analysis function (`src/lib/ai/analyze.ts`)

- `analyzeArticle(article: PendingAnalysisArticle): Promise<AnalysisOutput>`
- Build a system prompt that instructs the model to:
  - Act as a neutral news analyst
  - Analyze the article text for sentiment, political framing, loaded language
  - Return structured output matching the Zod schema
  - Use article text evidence only, not source name
  - Mark framing as "AI-estimated"
  - If evidence is weak, use `unclear` label and low confidence
- Build a user prompt with the article title and raw text (truncated to a reasonable length to avoid token limits).
- Call `generateText` with the active provider, the Zod schema for structured output, and the prompts.
- If the OpenAI call fails and a Gemini key is available, retry with Gemini.
- Validate the output with the Zod schema before returning.
- Return the validated output plus the model name used.
- Mark with `import "server-only"`.

### 6. Analysis pipeline types (`src/lib/pipeline/types.ts`)

- `AnalysisSummary`:
  - `status`: `"completed" | "failed"`
  - `articlesPending`: number
  - `articlesAnalyzed`: number
  - `articlesSkipped`: number
  - `articlesFailed`: number
  - `batchesProcessed`: number
  - `totalDurationMs`: number
  - `failureReasons`: `Record<string, number>`
- `AnalysisOptions`:
  - `limit?`: number
  - `articleIds?`: string[]
- `AnalysisResult`:
  - `summary: AnalysisSummary`

### 7. Analysis pipeline (`src/lib/pipeline/analyze.ts`)

- `runAnalysisPipeline(options?: AnalysisOptions): Promise<AnalysisResult>`
- Implement the required behavior (section 19):
  1. **Pending-analysis check** — call `getPendingAnalysisArticles(limit)` which uses LEFT JOIN logic.
  2. Process in configurable batches (`ANALYSIS_BATCH_SIZE`, default 5).
  3. Continue until no pending articles remain for full analysis runs.
  4. For each article:
     - Call `analyzeArticle(article)`.
     - Validate AI output (Zod schema validation happens inside `analyzeArticle`).
     - If valid, build `ArticleAnalysisInsert`:
       - `article_id`, `summary`, `sentiment_score`, `sentiment_label`
       - `left_percentage`, `center_percentage`, `right_percentage`
       - `bias_score` = `(right_percentage - left_percentage) / 100`
       - `bias_label` = `politicalFramingLabel`
       - `confidence`, `framing_notes`, `loaded_terms`, `disclaimer`, `model`
     - Call `insertArticleAnalysis(input)`.
     - Call `markArticleAnalyzed(article.id)` only after analysis is saved.
     - Log progress: "article analyzed", "article skipped", "article failed".
     - On validation failure, log the reason and increment failure count.
     - On insert failure, log the error and increment failure count.
  5. Log analyzed, skipped, failed counts per batch.
  6. Log a final summary object when complete.
  7. Persist a summary log to the `logs` table via `insertLog("info", "Analysis completed", summary)`.
  8. Return `{ summary }`.
- Handle errors gracefully: a single article failure should not abort the entire run.
- If `options.articleIds` is provided, filter pending articles to those IDs.
- If `options.limit` is provided, cap the total articles processed.

### 8. API route (`src/app/api/analyze/route.ts`)

- `POST` handler only.
- Verify `x-DailyBit-admin-secret` header via `verifyAdminSecret()`. Return 401 if missing/invalid.
- Parse optional JSON body: `{ limit?: number; articleIds?: string[] }`.
- Call `runAnalysisPipeline(options)`.
- Return `200` with the summary object on success.
- Return `500` with `{ error: message }` on unhandled failure.
- Do not cache this route.

## Security requirements

- Never expose `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` to browser code.
- All AI modules must be server-only (`import "server-only"`).
- `POST /api/analyze` must require `x-DailyBit-admin-secret` header; reject with 401 if missing/invalid.
- Do not put the admin secret in URL query strings.
- Do not run AI/model calls from browser code.
- Use the service role Supabase client for all writes.

## Acceptance criteria

- [ ] `ai`, `@ai-sdk/openai`, `@ai-sdk/google` installed and pinned in `package.json`
- [ ] `src/lib/ai/env.ts` validates AI env vars server-side
- [ ] `src/lib/ai/schema.ts` defines Zod schema for structured analysis output
- [ ] `src/lib/ai/client.ts` selects provider (OpenAI primary, Gemini fallback)
- [ ] `src/lib/ai/analyze.ts` calls `generateText` with structured output and validates with Zod
- [ ] `src/lib/pipeline/analyze.ts` runs the full analysis pipeline with run logging
- [ ] `POST /api/analyze` requires admin secret and returns the summary object
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` added to `.env.example`
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

1. Ensure `.env.local` has `OPENAI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY` for Gemini fallback), `DailyBit_ADMIN_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` set.
2. Ensure `supabase/schema.sql` and `supabase/seed.sql` have been run in Supabase.
3. Ensure at least one article exists in the `articles` table (run scraping first if needed).
4. Run `npm run dev`.
5. Trigger analysis for all pending articles:
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -H "x-DailyBit-admin-secret: YOUR_SECRET" \
     -d "{}"
   ```
6. Trigger analysis with a limit:
   ```bash
   curl -X POST http://localhost:3000/api/analyze \
     -H "Content-Type: application/json" \
     -H "x-DailyBit-admin-secret: YOUR_SECRET" \
     -d '{"limit": 3}'
   ```
7. Watch the dev server terminal for run logging: analysis started, pending articles found, batch start, article analyzed, article failed, batch complete, analysis completed, summary object.
8. Confirm the API response contains the `summary` object with all fields populated.
9. Confirm invalid/missing admin secret returns `401`:
   ```bash
   curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d "{}"
   ```
10. Query Supabase to verify analyses were inserted:
    ```sql
    select a.title, aa.summary, aa.sentiment_label, aa.bias_label, aa.model
    from article_analyses aa
    join articles a on a.id = aa.article_id
    order by aa.created_at desc limit 20;
    ```
11. Confirm `articles.analyzed_at` is set for analyzed articles:
    ```sql
    select title, analyzed_at from articles where analyzed_at is not null order by analyzed_at desc limit 20;