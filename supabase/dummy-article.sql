-- DailyBit dummy article for manual testing
-- Run in Supabase Dashboard -> SQL Editor after schema.sql and seed.sql
-- This inserts one source, one article, and one analysis so the pages render immediately.

-- ---------------------------------------------------------------------------
-- 1. Source (reuse Reuters from seed.sql if it exists, otherwise insert)
-- ---------------------------------------------------------------------------
insert into public.sources (name, listing_url, parser_strategy, is_active, logo_url)
values (
  'Reuters',
  'https://www.reuters.com/',
  'reuters',
  true,
  null
)
on conflict (listing_url) do update
set
  name = excluded.name,
  parser_strategy = excluded.parser_strategy,
  is_active = excluded.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. Article
-- ---------------------------------------------------------------------------
-- We use a CTE to grab the Reuters source id, then insert the article.
with reuters_source as (
  select id from public.sources where name = 'Reuters' limit 1
)
insert into public.articles (
  source_id,
  original_url,
  canonical_url,
  title,
  image_url,
  published_at,
  raw_text,
  scraped_at,
  analyzed_at
)
select
  reuters_source.id,
  'https://www.reuters.com/world/middle-east/trump-sends-iran-revised-peace-proposal-tougher-terms-report-2026-05-31/',
  'https://www.reuters.com/world/middle-east/trump-sends-iran-revised-peace-proposal-tougher-terms-report-2026-05-31/',
  'Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
  '2026-05-31T10:00:00.000Z',
  'The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.

The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to Iranian nuclear facilities, including military sites.

"This is a take-it-or-leave-it proposal," a senior administration official told the Wall Street Journal. The President wants a deal, but he will not accept a weak agreement that puts America or our allies at risk.

Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran''s right to peaceful nuclear energy and include the lifting of all U.S. sanctions.

The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. If diplomacy fails, the administration says it is prepared to take other action to prevent Iran from obtaining a nuclear weapon.

European allies have urged both sides to continue negotiations, arguing that a durable outcome is still more likely through diplomacy than confrontation.',
  now(),
  now()
from reuters_source
on conflict (original_url) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Article Analysis
-- ---------------------------------------------------------------------------
-- CTE to grab the article id we just inserted, then insert the analysis.
with target_article as (
  select id from public.articles
  where original_url = 'https://www.reuters.com/world/middle-east/trump-sends-iran-revised-peace-proposal-tougher-terms-report-2026-05-31/'
  limit 1
)
insert into public.article_analyses (
  article_id,
  summary,
  sentiment_score,
  sentiment_label,
  bias_score,
  bias_label,
  left_percentage,
  center_percentage,
  right_percentage,
  confidence,
  framing_notes,
  loaded_terms,
  disclaimer,
  model
)
select
  target_article.id,
  'The revised proposal tightens pressure on Iran by pairing nuclear restrictions with stronger verification language and a warning that the U.S. is prepared to escalate if talks fail.',
  0.06,
  'neutral',
  0.29,
  'right',
  20,
  31,
  49,
  0.89,
  'The article foregrounds U.S. pressure, negotiation leverage, and deterrence. The framing is assertive but still keeps the diplomatic backchannel in view.',
  '["tougher terms", "verification measures", "take-it-or-leave-it", "pressure campaign"]'::jsonb,
  'AI-estimated political framing can be wrong and should be treated as a probabilistic reading, not a factual judgment.',
  'gpt-4.1-mini'
from target_article
on conflict (article_id) do nothing;