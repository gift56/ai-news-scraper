-- Optional starter news sources for DailyBit
-- Run after schema.sql in Supabase Dashboard -> SQL Editor

insert into public.sources (name, listing_url, parser_strategy, is_active, logo_url)
values
  ('Reuters', 'https://www.reuters.com/', 'reuters', true, null),
  ('BBC News', 'https://www.bbc.com/news', 'bbc', true, null),
  ('NPR', 'https://www.npr.org/', 'npr', true, null),
  ('Fox News', 'https://www.foxnews.com/', 'fox', true, null),
  ('The Guardian', 'https://www.theguardian.com/us', 'guardian', true, null)
on conflict (listing_url) do update
set
  name = excluded.name,
  parser_strategy = excluded.parser_strategy,
  is_active = excluded.is_active,
  updated_at = now();
