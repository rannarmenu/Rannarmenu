-- Visitors may set only review content and their browser-scoped review key.
-- Keep identifiers, visibility, and timestamps under database control.
revoke insert on public.recipe_reviews from anon, authenticated;
grant insert (recipe_id, reviewer_key, display_name, rating, comment)
  on public.recipe_reviews to anon, authenticated;
