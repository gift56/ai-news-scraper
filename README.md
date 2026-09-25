# DailyBit

DailyBit is an AI-powered news intelligence platform that gathers stories from multiple media sources, validates and stores them in a structured database, analyzes each article for sentiment and political framing, and presents the results in a clean, reader-friendly interface.

The project is designed to answer a simple question for readers: not just what happened, but how the article is framed, how it leans, and how it compares to related reporting.

## What the application does

- Scrapes active source homepages and article detail pages using Oxylabs
- Loads source configuration from Supabase instead of hardcoded URLs
- Filters out low-quality, category, navigation, product, or non-article pages before saving anything
- Stores article metadata and raw content in Supabase
- Runs AI analysis on each valid article to generate:
  - neutral summary
  - sentiment score and label
  - political framing label and percentages
  - confidence score and bias score
  - framing notes, loaded terms, and disclaimer
- Shows article cards and detail pages with structured bias and sentiment indicators
- Uses Clerk for authentication and protected reading flows
- Provides admin-only API routes for scraping and analysis jobs
- Supports automated scheduling and cron-based pipeline processing

## Core product idea

DailyBit sits at the intersection of news aggregation, editorial analysis, and AI-assisted understanding.

Instead of delivering a raw link dump, it turns headline feeds into a more intentional reading experience:

- readers can browse a homepage of analyzed stories
- each card shows source, sentiment, bias distribution, and confidence
- the article page explains the story with a summary and framing breakdown
- related stories can be surfaced through similarity matching once embeddings are enabled

This makes it useful for both general audiences and more analytical readers who want a quick sense of how a story is composed and framed.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Clerk for authentication
- Supabase for data persistence and query layer
- Oxylabs Web Scraper API and scheduling support
- AI SDK + Gemini/OpenAI models for article analysis
- Zod for validation
- pgvector-ready schema design for related article search

## Project structure

- `src/app` – routes, homepage, article pages, and API endpoints
- `src/components` – UI cards, headers, footer, and reusable components
- `src/lib` – pipeline logic, scraping helpers, AI analysis, admin verification, and Supabase utilities
- `supabase/schema.sql` – database schema and source-of-truth definitions
- `public` – static assets

## How the pipeline works

1. Active sources are loaded from Supabase.
2. Source homepages are scraped and candidate article links are filtered.
3. Detail pages are scraped and validated before insertion.
4. Articles are stored only when they pass quality checks.
5. The AI analysis pipeline reads pending articles and writes sentiment/framing results into the analysis table.
6. The frontend shows only analyzed, public content.
7. Cron and scheduler jobs can trigger periodic scraping and analysis updates.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env.local` file from the variables below and fill in your values.

### 3. Start the app

```bash
npm run dev
```

Then open http://localhost:3000

## Environment variables

The app expects both public and server-only values. Keep secrets in the server environment and never expose them to browser code.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL used in metadata and links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key for the frontend. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB access used by admin and pipeline code. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key for authentication. |
| `CLERK_SECRET_KEY` | Yes | Clerk server-side secret. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Recommended | Clerk sign-in route. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Recommended | Clerk sign-up route. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes in current code | Gemini API key for AI analysis. |
| `OPENAI_API_KEY` | Optional / pipeline-dependent | OpenAI key if you are using OpenAI-backed analysis flows. |
| `OXY_WSA_USERNAME` | Yes | Oxylabs Web Scraper username. |
| `OXY_WSA_PASSWORD` | Yes | Oxylabs Web Scraper password. |
| `DailyBit_ADMIN_SECRET` | Yes | Shared secret required for admin action routes such as scrape and analysis. |
| `ANALYSIS_BATCH_SIZE` | Optional | Overrides the default AI batch size for pending articles. |
| `CRON_SECRET` | Required in production | Protects the Vercel cron endpoint and is injected by Vercel. Do not add this to `.env.local`. |

Example `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
OXY_WSA_USERNAME=your-oxylabs-username
OXY_WSA_PASSWORD=your-oxylabs-password
DailyBit_ADMIN_SECRET=super-secret-admin-token
ANALYSIS_BATCH_SIZE=5
```

> `CRON_SECRET` is not meant for local development. In Vercel deployments, it is provided automatically and should be used to protect the cron endpoint.

## Admin API behavior

The app exposes server-only endpoints for work that mutates data or starts background processing. These routes require the shared admin secret in the `x-DailyBit-admin-secret` header.

Examples:

- `POST /api/scrape`
- `POST /api/analyze`
- `POST /api/oxylabs/schedules`
- `POST /api/oxylabs/scheduled-results/process`

If the header is missing or invalid, the server responds with `401 Unauthorized`.

## Development checks

Use the project scripts to validate changes:

```bash
npm run typecheck
npm run lint
npm run build
```

## Why DailyBit matters

DailyBit is built to help readers make sense of a noisy media environment. It blends automation, data persistence, and AI-driven interpretation into one workflow that can surface trustworthy, well-structured news coverage and highlight framing differences across sources.

The app is intentionally focused on a small but important editorial problem: making news more understandable, better contextualized, and easier to compare.

## License

This project is for local development and demonstration purposes unless otherwise specified by the repository owner.
