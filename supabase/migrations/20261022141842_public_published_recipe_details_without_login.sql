-- Public recipe browsing should not require an account.
-- RLS stays enabled; the existing anon SELECT policy only admits is_published = true.
-- This restores full-column reads for published recipes without exposing unpublished drafts.
grant select on table public.recipes to anon;
