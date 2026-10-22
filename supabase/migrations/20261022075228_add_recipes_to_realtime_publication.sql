-- Enable live refresh subscriptions for newly published recipes.
-- Existing RLS policies continue to restrict public reads to published recipes.
alter publication supabase_realtime add table public.recipes;
