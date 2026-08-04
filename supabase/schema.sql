-- DailyBit initial schema
-- Run in Supabase Dashboard -> SQL Editor

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  listing_url text not null unique check (char_length(trim(listing_url)) > 0),
  parser_strategy text,
  is_active boolean not null default true,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sources_is_active_idx on public.sources (is_active);
create index sources_listing_url_idx on public.sources (listing_url);

create trigger sources_set_updated_at
before update on public.sources
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  original_url text not null unique check (char_length(trim(original_url)) > 0),
  canonical_url text not null check (char_length(trim(canonical_url)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  image_url text not null check (char_length(trim(image_url)) > 0),
  published_at timestamptz not null,
  raw_text text not null check (char_length(trim(raw_text)) > 0),
  scraped_at timestamptz not null default now(),
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create index articles_source_id_idx on public.articles (source_id);
create index articles_published_at_idx on public.articles (published_at desc);
create index articles_analyzed_at_idx on public.articles (analyzed_at);
create index articles_original_url_idx on public.articles (original_url);
create index articles_homepage_idx on public.articles (analyzed_at, published_at desc);

-- ---------------------------------------------------------------------------
-- article_analyses
-- ---------------------------------------------------------------------------

create table public.article_analyses (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles (id) on delete cascade,
  summary text not null check (char_length(trim(summary)) > 0),
  sentiment_score numeric(4, 3) not null check (sentiment_score >= -1 and sentiment_score <= 1),
  sentiment_label text not null check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_score numeric(4, 3) not null check (bias_score >= -1 and bias_score <= 1),
  bias_label text not null check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage smallint not null check (left_percentage >= 0 and left_percentage <= 100),
  center_percentage smallint not null check (center_percentage >= 0 and center_percentage <= 100),
  right_percentage smallint not null check (right_percentage >= 0 and right_percentage <= 100),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  framing_notes text not null,
  loaded_terms jsonb not null default '[]'::jsonb,
  disclaimer text not null,
  model text not null check (char_length(trim(model)) > 0),
  created_at timestamptz not null default now(),
  constraint article_analyses_percentages_sum_check check (
    left_percentage + center_percentage + right_percentage = 100
  )
);

create index article_analyses_article_id_idx on public.article_analyses (article_id);

-- ---------------------------------------------------------------------------
-- pgvector: article embeddings
-- ---------------------------------------------------------------------------

-- Enable pgvector extension (run in Dashboard if not already enabled)
create extension if not exists vector;

-- Add embedding column (1536 dimensions to match Google gemini-embedding-001 with outputDimensionality: 1536)
alter table public.article_analyses
  add column if not exists embedding vector(1536);

-- Create IVFFlat cosine index for similarity search
create index if not exists article_analyses_embedding_idx
  on public.article_analyses
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------------------------------------------------------------------------
-- logs
-- ---------------------------------------------------------------------------

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  message text not null check (char_length(trim(message)) > 0),
  context jsonb,
  created_at timestamptz not null default now()
);

create index logs_created_at_idx on public.logs (created_at desc);
create index logs_level_idx on public.logs (level);

-- ---------------------------------------------------------------------------
-- oxylabs_schedules
-- ---------------------------------------------------------------------------

create table public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources (id) on delete cascade,
  oxylabs_schedule_id text not null unique check (char_length(trim(oxylabs_schedule_id)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index oxylabs_schedules_source_id_idx on public.oxylabs_schedules (source_id);
create index oxylabs_schedules_oxylabs_schedule_id_idx on public.oxylabs_schedules (oxylabs_schedule_id);
create index oxylabs_schedules_is_active_idx on public.oxylabs_schedules (is_active);

create trigger oxylabs_schedules_set_updated_at
before update on public.oxylabs_schedules
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- oxylabs_schedule_runs
-- ---------------------------------------------------------------------------

create table public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.oxylabs_schedules (id) on delete cascade,
  oxylabs_run_id text,
  status text not null check (char_length(trim(status)) > 0),
  summary jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index oxylabs_schedule_runs_schedule_id_idx on public.oxylabs_schedule_runs (schedule_id);
create index oxylabs_schedule_runs_status_idx on public.oxylabs_schedule_runs (status);
create index oxylabs_schedule_runs_created_at_idx on public.oxylabs_schedule_runs (created_at desc);
create unique index oxylabs_schedule_runs_schedule_run_unique_idx
  on public.oxylabs_schedule_runs (schedule_id, oxylabs_run_id)
  where oxylabs_run_id is not null;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

create policy sources_public_read
  on public.sources
  for select
  to anon, authenticated
  using (is_active = true);

create policy articles_public_read
  on public.articles
  for select
  to anon, authenticated
  using (analyzed_at is not null);

create policy article_analyses_public_read
  on public.article_analyses
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_analyses.article_id
        and a.analyzed_at is not null
    )
  );

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on schema public from public;
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on public.sources to anon, authenticated;
grant select on public.articles to anon, authenticated;
grant select on public.article_analyses to anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------
-- pgvector: related articles RPC function
-- ---------------------------------------------------------------------------

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
  bias_label text
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
    aa.bias_label
  from public.article_analyses aa
  join public.articles a on a.id = aa.article_id
  join public.sources s on s.id = a.source_id
  where aa.embedding is not null
    and a.analyzed_at is not null
    and a.id != p_article_id
  order by aa.embedding <=> (
    select embedding from public.article_analyses where article_id = p_article_id
  )
  limit p_limit;
$$;

grant execute on function public.get_related_articles(uuid, int) to anon, authenticated;
