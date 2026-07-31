# DailyBit Supabase Database and Data Access

## Goal

Add Supabase as the source of truth for DailyBit app data by delivering:

- a complete initial Postgres schema for all core tables defined in `AGENTS.md` section 7
- Row Level Security policies appropriate for a server-rendered Next.js app using Clerk (not Supabase Auth)
- typed Supabase clients for browser-safe reads and server-only pipeline writes
- reusable query helpers for sources, articles, analyses, logs, and Oxylabs scheduler tables
- environment variable documentation in `.env.example`

This task is the **database and data-access foundation only**. It does **not** include scraping, AI analysis, Oxylabs Scheduler API integration, pgvector/related articles (section 20), or replacing the current mock UI pages. Those will consume this layer in later tasks.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/supabase-postgres-best-practices/references/security-rls-basics.md`
- `.agents/skills/supabase-postgres-best-practices/references/security-privileges.md`
- `.agents/skills/supabase-postgres-best-practices/references/schema-primary-keys.md`
- `.agents/skills/supabase-postgres-best-practices/references/schema-foreign-key-indexes.md`
- `AGENTS.md` sections 7, 9, 10, 14, 15, 19, 21, 22

## Existing code inspected

| File / area | State |
|-------------|-------|
| `package.json` | Next.js 16.2.11, Clerk installed, **no Supabase packages yet** |
| `src/lib/home/mock-articles.ts` | Mock homepage dataset with slug, category, region, bias percentages |
| `src/app/page.tsx` | Homepage reads mock data only |
| `src/app/news/[slug]/page.tsx` | Details page reads mock data; Clerk-protected |
| `supabase/` | **Does not exist yet** |
| `src/lib/supabase/` | **Does not exist yet** |
| `.env.example` | **Does not exist yet** |
| `tsconfig.json` | Path alias `@/*` → `./src/*` |

## Decisions and assumptions

1. Follow the existing project convention and place application code under `src/lib/supabase/` (imported as `@/lib/supabase/*`), while keeping SQL artifacts in `supabase/schema.sql` as required by `AGENTS.md`.
2. Use **Clerk for auth**, not Supabase Auth. Public website reads happen in Next.js Server Components using the **service role client** for now; RLS still protects tables if anon/authenticated roles are ever granted.
3. Do **not** add `embedding vector(1536)` yet. That belongs to section 20 after pgvector is enabled.
4. Do **not** add UI-only mock fields (`slug`, `category`, `region`, `imageAlt`, sidebar-only analysis extras) to the database unless needed for routing. Slug for `/news/[slug]` will be derived in query mappers from `articles.title` using a shared `slugify()` helper until a dedicated column is justified.
5. Store Oxylabs schedule and run IDs as `text`, never as JavaScript numbers, because they exceed `Number.MAX_SAFE_INTEGER`.
6. Store `loaded_terms` as `jsonb` (string array). Store pipeline log context and scheduler run summaries as `jsonb`.
7. Articles appear on the public homepage only when `analyzed_at IS NOT NULL` and a matching `article_analyses` row exists.
8. Pending-analysis detection uses a **LEFT JOIN** from `articles` to `article_analyses`; never rely on `analyzed_at IS NULL` alone.
9. URL dedupe checks must chunk `.in()` filters to **15 URLs max** per query.
10. Provide optional `supabase/seed.sql` with starter news sources only if approved below; do not hardcode source URLs inside pipeline code.
11. Install pinned Supabase packages and commit lockfile changes.
12. No Supabase CLI local stack is required for this task; the canonical artifact is `supabase/schema.sql` to run in Supabase Dashboard → SQL Editor.

## Database schema

Create `supabase/schema.sql` with the following tables, constraints, indexes, triggers, and RLS.

### `sources`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `name` | `text` NOT NULL | Display name |
| `listing_url` | `text` NOT NULL UNIQUE | Homepage entry URL only |
| `parser_strategy` | `text` NULL | Optional source-specific parser key |
| `is_active` | `boolean` NOT NULL DEFAULT `true` | Only active sources used by pipeline |
| `logo_url` | `text` NULL | Optional logo |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | Auto-updated trigger |

Indexes: `is_active`, `listing_url`.

### `articles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `source_id` | `uuid` NOT NULL FK → `sources(id)` | ON DELETE RESTRICT |
| `original_url` | `text` NOT NULL UNIQUE | Dedupe key |
| `canonical_url` | `text` NOT NULL | |
| `title` | `text` NOT NULL | |
| `image_url` | `text` NOT NULL | Required before insert |
| `published_at` | `timestamptz` NOT NULL | Required before insert |
| `raw_text` | `text` NOT NULL | Cleaned article body |
| `scraped_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `analyzed_at` | `timestamptz` NULL | Set only after valid analysis saved |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `source_id`, `published_at DESC`, `analyzed_at`, `original_url`, composite for homepage queries.

Check constraints: non-empty title, image_url, raw_text.

### `article_analyses`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `article_id` | `uuid` NOT NULL UNIQUE FK → `articles(id)` ON DELETE CASCADE | One analysis per article |
| `summary` | `text` NOT NULL | Neutral summary |
| `sentiment_score` | `numeric(4,3)` NOT NULL | −1 to 1 |
| `sentiment_label` | `text` NOT NULL | `positive`, `neutral`, `negative` |
| `bias_score` | `numeric(4,3)` NOT NULL | `(right - left) / 100` |
| `bias_label` | `text` NOT NULL | `left`, `center`, `right`, `mixed`, `unclear` |
| `left_percentage` | `smallint` NOT NULL | 0–100 |
| `center_percentage` | `smallint` NOT NULL | 0–100 |
| `right_percentage` | `smallint` NOT NULL | 0–100 |
| `confidence` | `numeric(4,3)` NOT NULL | 0 to 1 |
| `framing_notes` | `text` NOT NULL | |
| `loaded_terms` | `jsonb` NOT NULL DEFAULT `'[]'` | string array |
| `disclaimer` | `text` NOT NULL | |
| `model` | `text` NOT NULL | |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Check constraints:

- sentiment label enum
- bias label enum
- percentages each 0–100
- percentages sum to 100
- sentiment_score, bias_score, confidence ranges

Index: `article_id` (unique already), optional partial index for future embedding backfill is **not** added yet.

### `logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `level` | `text` NOT NULL | `debug`, `info`, `warn`, `error` |
| `message` | `text` NOT NULL | |
| `context` | `jsonb` NULL | Structured metadata |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Index: `created_at DESC`, `level`.

### `oxylabs_schedules`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Internal row id |
| `source_id` | `uuid` NOT NULL UNIQUE FK → `sources(id)` ON DELETE CASCADE | One schedule row per source |
| `oxylabs_schedule_id` | `text` NOT NULL UNIQUE | Exact Oxylabs schedule id as string |
| `is_active` | `boolean` NOT NULL DEFAULT `true` | Mirrors desired local state |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `source_id`, `oxylabs_schedule_id`, `is_active`.

### `oxylabs_schedule_runs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `schedule_id` | `uuid` NOT NULL FK → `oxylabs_schedules(id)` ON DELETE CASCADE | |
| `oxylabs_run_id` | `text` NULL | Exact Oxylabs run id as string |
| `status` | `text` NOT NULL | e.g. `pending`, `processed`, `failed` |
| `summary` | `jsonb` NULL | Pipeline summary object |
| `processed_at` | `timestamptz` NULL | |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

Indexes: `schedule_id`, `status`, `created_at DESC`, unique partial on `(schedule_id, oxylabs_run_id)` when run id present.

### Shared SQL requirements

- Enable required extensions only if needed (`pgcrypto` for `gen_random_uuid()` if not already available).
- Add `updated_at` trigger helper for mutable tables.
- Enable RLS on **every** table.
- Grant usage on schema/table access according to Supabase skill guidance.
- Public read policies (defense in depth):
  - `sources`: `SELECT` where `is_active = true` for `anon` and `authenticated`
  - `articles` + `article_analyses`: `SELECT` only for analyzed/public-ready rows (`analyzed_at IS NOT NULL`) joined consistently
  - `logs`, `oxylabs_*`: no public policies; service role only
- Do **not** use deprecated `auth.role()` checks.
- Do **not** add `SECURITY DEFINER` helpers in `public`.
- Revoke broad public privileges where appropriate.

## Application layer

### Dependencies

Add pinned versions of:

- `@supabase/supabase-js`
- `@supabase/ssr` (for future cookie-aware server usage; wire minimal server helper now)

### Files to create

| File | Purpose |
|------|---------|
| `src/lib/supabase/env.ts` | Validate required env vars server-side |
| `src/lib/supabase/types.ts` | Database types for all tables + insert/update helpers |
| `src/lib/supabase/client.ts` | Browser-safe anon client factory |
| `src/lib/supabase/server.ts` | Server-only service role client + typed helper |
| `src/lib/supabase/slugify.ts` | Shared slug derivation for article routes |
| `src/lib/supabase/queries/sources.ts` | Active source reads |
| `src/lib/supabase/queries/articles.ts` | Article reads/writes, dedupe helpers, homepage feed |
| `src/lib/supabase/queries/analyses.ts` | Analysis insert/read, pending-analysis query |
| `src/lib/supabase/queries/logs.ts` | Append/read logs |
| `src/lib/supabase/queries/oxylabs.ts` | Schedule/run persistence helpers |
| `src/lib/supabase/queries/index.ts` | Re-export query surface |
| `src/app/api/sources/route.ts` | `GET /api/sources` read-only route |
| `src/app/api/logs/route.ts` | `GET /api/logs` read-only route with limit/pagination |
| `.env.example` | Supabase + existing Clerk vars documented |
| `supabase/schema.sql` | Full initial schema |
| `supabase/seed.sql` | Optional starter `sources` rows (only if approved) |

### Query requirements

Implement these server-side helpers using the **service role client**:

**Sources**

- `getActiveSources()`
- `getSourceById(id)`
- `getAllSources()` for admin/list route

**Articles**

- `getHomeArticles(limit?)` — analyzed articles joined with source + analysis, ordered by `published_at DESC`
- `getArticleBySlug(slug)` — derive slug from title and return article + source + analysis
- `findExistingArticleUrls(urls: string[])` — chunk to 15 URLs per query, return existing originals
- `insertArticle(input)` — append-only insert, no upsert/replace behavior
- `markArticleAnalyzed(articleId, analyzedAt?)`

**Analyses**

- `getPendingAnalysisArticles(limit?)` — LEFT JOIN where no `article_analyses` row exists
- `insertArticleAnalysis(input)` — validate percentages and labels in TypeScript before insert
- `getAnalysisByArticleId(articleId)`

**Logs**

- `insertLog(level, message, context?)`
- `getRecentLogs({ limit, level? })`

**Oxylabs persistence**

- `upsertOxylabsScheduleForSource(sourceId, oxylabsScheduleId)`
- `listOxylabsSchedules()`
- `deactivateMissingSchedules(knownOxylabsScheduleIds: string[])`
- `recordScheduleRun(input)`
- `listRecentScheduleRuns(limit?)`

### API routes

Per `AGENTS.md` section 14:

- `GET /api/sources` — returns active sources for debugging/admin visibility; no admin secret required for read-only public source metadata
- `GET /api/logs` — returns recent logs; protect with `x-DailyBit-admin-secret` header (`DailyBit_ADMIN_SECRET`)

Both routes must be thin handlers delegating to query modules.

### Type mapping helpers

Add mapper functions that convert DB rows into UI-friendly shapes without leaking server-only fields:

- `toHomeArticleRow(...)` — includes derived slug, source name, sentiment/framing fields for cards
- `toArticleDetailRow(...)` — article body + full analysis fields for details page future wiring

Keep mock-specific fields (`category`, `region`, sidebar extras) out of DB mappers; those remain UI/mock concerns until a later product decision.

## Security requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be public.
- All pipeline mutations and log reads use server-only modules marked with `server-only` where appropriate.
- Do not use Supabase Auth.
- Do not use broken joined-table filters like `.eq('foreignTable.column', value)`; filter in JavaScript after fetch when needed.
- Reject invalid admin secret on `GET /api/logs` with `401`.

## Files likely to change

| File | Change |
|------|--------|
| `package.json` | Add Supabase dependencies |
| `package-lock.json` | Lock new deps |
| `.env.example` | New file with Supabase + Clerk vars |
| `supabase/schema.sql` | New full schema |
| `supabase/seed.sql` | Optional seed sources |
| `src/lib/supabase/**` | New clients, types, queries |
| `src/app/api/sources/route.ts` | New GET route |
| `src/app/api/logs/route.ts` | New GET route |

Do **not** modify homepage or news details pages in this task.

## Acceptance criteria

- [ ] `supabase/schema.sql` defines all six core tables with constraints, indexes, RLS, and grants
- [ ] `src/lib/supabase/types.ts` matches the schema
- [ ] Server service role client and browser anon client factories exist and are separated correctly
- [ ] Query helpers cover sources, articles, analyses, logs, and Oxylabs tables listed above
- [ ] URL dedupe helper chunks `.in()` queries to 15 URLs max
- [ ] Pending-analysis query uses LEFT JOIN logic, not `analyzed_at IS NULL` alone
- [ ] `GET /api/sources` and protected `GET /api/logs` work via thin route handlers
- [ ] `.env.example` documents Supabase variables and exposure rules
- [ ] No pgvector column yet
- [ ] Mock UI pages remain unchanged
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Manual test steps

1. Create or open a Supabase project.
2. Run the full contents of `supabase/schema.sql` in Supabase Dashboard → SQL Editor.
3. Optionally run `supabase/seed.sql` if included.
4. Copy Supabase URL/keys into local `.env.local` along with existing Clerk values.
5. Run `npm run dev`.
6. Request sources:
   ```bash
   curl http://localhost:3000/api/sources
   ```
7. Insert a test log row through a temporary server script or Supabase SQL, then request logs:
   ```bash
   curl -H "x-DailyBit-admin-secret: YOUR_SECRET" "http://localhost:3000/api/logs?limit=10"
   ```
8. Confirm invalid/missing admin secret returns `401` on `/api/logs`.
9. Confirm homepage and `/news/[slug]` still render from mock data unchanged.
10. Watch the dev server terminal for Supabase client/env errors on boot and API calls.
